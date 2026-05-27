import { supabase } from './supabaseClient';

export async function callMpesaStk({ phone, amount, orderId, accountReference = 'ORDER', description = 'Order Payment' }) {
  const { data, error } = await supabase.functions.invoke('mpesa-stk', {
    body: { phone, amount, orderId, accountReference, description }
  });
  if (error) throw error;
  return data;
}

export async function callMpesaStatus({ checkoutRequestId, orderId }) {
  const { data, error } = await supabase.functions.invoke('mpesa-status', {
    body: { checkoutRequestId, orderId }
  });
  if (error) throw error;
  return data;
}


