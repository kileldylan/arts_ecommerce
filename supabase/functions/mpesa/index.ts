// supabase/functions/mpesa/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Environment variables
const DARAJA_BASE_URL =
  Deno.env.get("DARAJA_BASE_URL") ?? "https://sandbox.safaricom.co.ke";
const MPESA_CONSUMER_KEY = Deno.env.get("DARAJA_CONSUMER_KEY")!;
const MPESA_CONSUMER_SECRET = Deno.env.get("DARAJA_CONSUMER_SECRET")!;
const MPESA_SHORTCODE = Deno.env.get("DARAJA_SHORTCODE")!;
const MPESA_PASSKEY = Deno.env.get("DARAJA_PASSKEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.split("/").pop();

    // 🟢 Handle STK Push Initiation
    if (req.method === "POST" && pathname === "stkpush") {
      const body = await req.json();
      const { phone, amount, order_id } = body;

      if (!phone || !amount || !order_id) {
        return new Response(JSON.stringify({ error: "Missing phone, amount, or order_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Step 1: Get Access Token
      const tokenRes = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: "Basic " + btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`),
        },
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Step 2: Prepare STK Push Payload
      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .substring(0, 14);
      const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

      const stkPayload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: `${SUPABASE_URL}/functions/v1/mpesa/callback`,
        AccountReference: `ORDER-${order_id}`,
        TransactionDesc: "Payment for Order",
      };

      // Step 3: Send STK Push Request
      const stkRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(stkPayload),
      });

      const stkData = await stkRes.json();
      console.log("STK Response:", stkData);

      // Step 4: Save transaction to Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          order_id,
          transaction_ref: stkData.CheckoutRequestID ?? crypto.randomUUID(),
          amount,
          payment_method: "mpesa",
          status: "pending",
          payment_details: stkData,
        }),
      });

      return new Response(JSON.stringify(stkData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🟠 Handle Callback from Daraja
    if (req.method === "POST" && pathname === "callback") {
      const callbackData = await req.json();
      console.log("M-PESA Callback:", JSON.stringify(callbackData, null, 2));

      const result = callbackData?.Body?.stkCallback ?? {};
      const checkoutId = result?.CheckoutRequestID ?? null;
      const resultCode = result?.ResultCode ?? null;
      const resultDesc = result?.ResultDesc ?? "";
      const metadata = result?.CallbackMetadata?.Item ?? [];

      const mpesaReceipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value ?? null;
      const amount = metadata.find((i: any) => i.Name === "Amount")?.Value ?? null;
      const phone = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value ?? null;

      const status = resultCode === 0 ? "completed" : "failed";

      // Update transaction in Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/transactions?transaction_ref=eq.${checkoutId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          status,
          payment_details: callbackData,
          updated_at: new Date().toISOString(),
        }),
      });

      // ✅ Respond quickly to Safaricom
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 🟣 Health check
    return new Response(JSON.stringify({ message: "MPESA Edge function active" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("MPESA function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
