import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables (read once)
const DARAJA_BASE_URL = "https://sandbox.safaricom.co.ke";
const CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") ?? "";
const CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") ?? "";
const SHORTCODE = Deno.env.get("MPESA_SHORTCODE") ?? "";
const PASSKEY = Deno.env.get("MPESA_PASSKEY") ?? "";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Safely initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.split("/").pop() || "";
    
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (_) {
        console.log("No JSON body or invalid JSON");
      }
    }

    const route = body.route || pathname;
    console.log(`📍 Route: ${route}, Pathname: ${pathname}, Method: ${req.method}`);

    // ====================== STK PUSH ======================
    if (req.method === "POST" && route === "stkpush") {
      const { phone, amount, orderId, order_id } = body;
      const finalOrderId = orderId || order_id;

      console.log("📱 Received STK Push request:", { phone, amount, finalOrderId });

      if (!phone || !amount || !finalOrderId) {
        return new Response(
          JSON.stringify({ error: "Missing phone, amount, or orderId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate Daraja credentials
      if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY) {
        console.error("❌ Missing Daraja credentials");
        return new Response(
          JSON.stringify({ error: "Server configuration error: Missing Daraja credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Step 1: Get Access Token
      const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
      console.log("🔑 Requesting access token...");

      const tokenRes = await fetch(
        `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        { 
          method: "GET", 
          headers: { Authorization: `Basic ${auth}` } 
        }
      );

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error("❌ Token fetch failed:", errorText);
        throw new Error(`Failed to get access token: ${tokenRes.status} - ${errorText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      console.log("✅ Access token obtained successfully");

      // Step 2: Prepare STK Push
      const timestamp = getTimestamp();
      const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
      const callbackUrl = `${SUPABASE_URL}/functions/v1/mpesa/callback`;

      const stkPayload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(Number(amount)),
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `ORDER-${finalOrderId}`,
        TransactionDesc: "Payment for Order",
      };

      console.log("📤 Sending STK Payload...");

      // Step 3: Call Daraja STK Push
      const stkRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(stkPayload),
      });

      const stkData = await stkRes.json();
      console.log("📥 STK Response from Daraja:", stkData);

      if (!stkData.CheckoutRequestID) {
        console.error("❌ No CheckoutRequestID received from Daraja:", stkData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to initiate payment", 
            raw: stkData 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ✅ FIXED: Save transaction using try-catch instead of .catch()
      try {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            order_id: finalOrderId,
            transaction_ref: stkData.CheckoutRequestID,
            amount: Math.round(Number(amount)),
            payment_method: "mpesa",
            status: "pending",
            payment_details: stkData,
          });
        
        if (insertError) {
          console.error("❌ Transaction insert error:", insertError);
        } else {
          console.log("✅ Transaction saved");
        }
      } catch (err) {
        console.error("❌ Transaction insert exception:", err);
      }

      // ✅ FIXED: Update order using try-catch instead of .catch()
      try {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            checkout_request_id: stkData.CheckoutRequestID,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalOrderId);
        
        if (updateError) {
          console.error("❌ Order update error:", updateError);
        } else {
          console.log("✅ Order updated with CheckoutRequestID");
        }
      } catch (err) {
        console.error("❌ Order update exception:", err);
      }

      console.log(`✅ STK Push successful. CheckoutRequestID: ${stkData.CheckoutRequestID}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            CheckoutRequestID: stkData.CheckoutRequestID,
            MerchantRequestID: stkData.MerchantRequestID,
            ResponseCode: stkData.ResponseCode,
            ResponseDescription: stkData.ResponseDescription,
            CustomerMessage: stkData.CustomerMessage,
          },
          message: "STK Push sent successfully. Check your phone for M-Pesa prompt.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====================== CALLBACK ======================
    if (req.method === "POST" && pathname === "callback") {
      console.log("📞 M-PESA Callback received");
      console.log("Callback body:", JSON.stringify(body, null, 2));

      try {
        const result = body?.Body?.stkCallback ?? {};
        const checkoutRequestId = result?.CheckoutRequestID;
        const resultCode = result?.ResultCode;
        const resultDesc = result?.ResultDesc;
        const metadata = result?.CallbackMetadata?.Item ?? [];

        const mpesaReceipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
        const amount = metadata.find((i: any) => i.Name === "Amount")?.Value;
        const phone = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value;

        console.log(`📊 Callback result: ResultCode=${resultCode}, CheckoutID=${checkoutRequestId}`);

        if (checkoutRequestId) {
          // Find the order
          const { data: order, error: orderFindError } = await supabase
            .from('orders')
            .select('id')
            .eq('checkout_request_id', checkoutRequestId)
            .single();

          if (orderFindError) {
            console.error("❌ Error finding order:", orderFindError);
          } else if (order) {
            if (resultCode === 0) {
              // Payment successful
              console.log(`✅ Payment successful! Order: ${order.id}, Receipt: ${mpesaReceipt}, Amount: ${amount}`);
              
              // Update order status
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  payment_status: 'paid',
                  status: 'confirmed',
                  mpesa_receipt: mpesaReceipt,
                  paid_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error("❌ Error updating order:", updateError);
              } else {
                console.log(`✅✅✅ Order ${order.id} marked as PAID!`);
              }

              // Add status history
              await supabase
                .from('order_status_history')
                .insert({
                  order_id: order.id,
                  status: 'confirmed',
                  note: `Payment received via M-Pesa. Receipt: ${mpesaReceipt}, Amount: ${amount}`,
                  created_at: new Date().toISOString()
                });

              // Update transaction
              await supabase
                .from('transactions')
                .update({
                  status: 'completed',
                  payment_details: body,
                  updated_at: new Date().toISOString()
                })
                .eq('transaction_ref', checkoutRequestId);

            } else {
              // Payment failed
              console.log(`❌ Payment failed: ${resultDesc}`);
              
              await supabase
                .from('orders')
                .update({
                  payment_status: 'failed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              await supabase
                .from('transactions')
                .update({
                  status: 'failed',
                  payment_details: body,
                  updated_at: new Date().toISOString()
                })
                .eq('transaction_ref', checkoutRequestId);
            }
          }
        }

      } catch (callbackErr) {
        console.error("❌ Callback processing error:", callbackErr);
      }

      // Always return success to Safaricom
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Health check
    return new Response(
      JSON.stringify({
        message: "MPESA Edge function is active",
        environment: DARAJA_BASE_URL.includes("sandbox") ? "sandbox" : "production",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("🔥 MPESA function error:", err.message);
    console.error("Stack:", err.stack);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message || "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ====================== HELPER FUNCTIONS ======================
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
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // already correct
  }
  return cleaned;
}