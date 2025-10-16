M-Pesa via Supabase Edge Functions (Quick Guide)

1) Create Edge Functions
- mpesa-stk: Initiates STK push
- mpesa-status: Polls payment status (optional if you use callbacks)

2) Required Environment Vars (on Supabase project)
- MPESA_CONSUMER_KEY
- MPESA_CONSUMER_SECRET
- MPESA_SHORTCODE
- MPESA_PASSKEY
- MPESA_ENV=sandbox|production
- CALLBACK_URL=https://<your-domain>/api/mpesa-callback (or a Supabase function URL)

3) Function Outline (TypeScript / Deno)
- Validate payload { phone, amount, orderId }
- Obtain access token from Safaricom
- Build password: base64(shortcode + passkey + timestamp)
- Call STK push endpoint
- Return CheckoutRequestID / MerchantRequestID to client

4) Client Usage
- Wrap app with PaymentProvider
- Call initiateStkPush({ phone, amount, orderId }) from checkout
- Optionally poll with pollPaymentStatus({ checkoutRequestId, orderId })

5) Security
- Never expose consumer keys in the client.
- Only perform STK/signing on Edge Functions.


