// supabase/functions/mpesa/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables - FIXED variable names
const DARAJA_BASE_URL = Deno.env.get("DARAJA_BASE_URL") ?? "https://sandbox.safaricom.co.ke";
const CONSUMER_KEY = Deno.env.get("DARAJA_CONSUMER_KEY")!;
const CONSUMER_SECRET = Deno.env.get("DARAJA_CONSUMER_SECRET")!;
const SHORTCODE = Deno.env.get("DARAJA_SHORTCODE")!;
const PASSKEY = Deno.env.get("DARAJA_PASSKEY")!;
const SUPABASE_URL = Deno.env.get("REACT_APP_SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("REACT_APP_SUPABASE_SERVICE_ROLE_KEY")!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.split("/").pop();

    // 🟢 Handle STK Push Initiation
    if (req.method === "POST" && pathname === "stkpush") {
      const body = await req.json();
      const { phone, amount, order_id } = body;

      console.log("Received STK Push request:", { phone, amount, order_id });

      if (!phone || !amount || !order_id) {
        return new Response(
          JSON.stringify({ error: "Missing phone, amount, or order_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Format phone number to 254XXXXXXXXX
      const formattedPhone = formatPhoneNumber(phone);

      // Step 1: Get Access Token - FIXED variable usage
      const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
      const tokenRes = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!tokenRes.ok) {
        console.error("Token fetch failed:", await tokenRes.text());
        throw new Error("Failed to get access token");
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      console.log("Access token obtained successfully");

      // Step 2: Prepare STK Push Payload - FIXED variable usage
      const timestamp = getTimestamp();
      const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

      const stkPayload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: `${SUPABASE_URL}/functions/v1/mpesa/callback`,
        AccountReference: `ORDER-${order_id}`,
        TransactionDesc: "Payment for Order",
      };

      console.log("STK Payload:", stkPayload);

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

      if (!stkRes.ok) {
        throw new Error(`STK Push failed: ${stkData.errorMessage || JSON.stringify(stkData)}`);
      }

      // Step 4: Save transaction to Supabase - UPDATED for your schema
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          order_id: order_id,
          transaction_ref: stkData.CheckoutRequestID,
          amount: Math.round(amount),
          payment_method: "mpesa",
          status: "pending",
          payment_details: stkData,
        })
        .select()
        .single();

      if (transactionError) {
        console.error("Failed to save transaction:", transactionError);
        // Continue anyway - transaction record is not critical for the payment flow
      }

      // Also update order with transaction reference
      await supabase
        .from('orders')
        .update({
          transaction_ref: stkData.CheckoutRequestID,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutRequestId: stkData.CheckoutRequestID,
          message: "STK Push sent successfully. Check your phone for M-Pesa prompt.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🟠 Handle Callback from Daraja
    if (req.method === "POST" && pathname === "callback") {
      const callbackData = await req.json();
      console.log("M-PESA Callback received:", JSON.stringify(callbackData, null, 2));

      const result = callbackData?.Body?.stkCallback ?? {};
      const checkoutId = result?.CheckoutRequestID ?? null;
      const resultCode = result?.ResultCode ?? null;
      const resultDesc = result?.ResultDesc ?? "";
      const metadata = result?.CallbackMetadata?.Item ?? [];

      const mpesaReceipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value ?? null;
      const amount = metadata.find((i: any) => i.Name === "Amount")?.Value ?? null;
      const phone = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value ?? null;
      const transactionDate = metadata.find((i: any) => i.Name === "TransactionDate")?.Value ?? null;

      const status = resultCode === 0 ? "completed" : "failed";

      // Get the transaction and order details
      const { data: transaction } = await supabase
        .from('transactions')
        .select('order_id')
        .eq('transaction_ref', checkoutId)
        .single();

      // Update transaction in Supabase
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: status,
          payment_details: callbackData,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_ref', checkoutId);

      if (updateError) {
        console.error("Failed to update transaction:", updateError);
      }

      // ✅ If payment successful, update order status
      if (resultCode === 0 && transaction?.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: "paid",
            status: "confirmed",
            transaction_ref: checkoutId,
            mpesa_receipt: mpesaReceipt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id);

        if (orderError) {
          console.error("Failed to update order:", orderError);
        } else {
          console.log(`Order ${transaction.order_id} updated successfully`);
          
          // Optional: Clear user's cart after successful payment
          // This would depend on your cart implementation
        }
      }

      // ✅ Respond quickly to Safaricom
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🟣 Query transaction status
    if (req.method === "POST" && pathname === "query") {
      const { checkoutRequestId } = await req.json();

      if (!checkoutRequestId) {
        return new Response(
          JSON.stringify({ error: "checkoutRequestId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get access token
      const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
      const tokenRes = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const timestamp = getTimestamp();
      const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

      const queryPayload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const queryRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(queryPayload),
      });

      const queryData = await queryRes.json();
      console.log("Query response:", queryData);

      return new Response(
        JSON.stringify(queryData),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🟣 Health check
    return new Response(
      JSON.stringify({ 
        message: "MPESA Edge function active",
        environment: DARAJA_BASE_URL.includes("sandbox") ? "sandbox" : "production",
        endpoints: ["stkpush", "callback", "query"]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("MPESA function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper Functions
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  // If starts with +254, remove the +
  else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already in correct format
  }
  // If starts with 1 or 7 (9 digits), add 254
  else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}