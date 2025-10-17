import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

const PaymentContext = createContext();

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
}

export function PaymentProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const invokeFunction = useCallback(async (name, payload) => {
  const { data, error: fnError } = await supabase.functions.invoke(name, {
    body: payload,
    headers: { 'Content-Type': 'application/json' },
  });
    if (fnError) throw fnError;
    return data;
  }, []);

  const initiateStkPush = useCallback(async ({ phone, amount, orderId, accountReference = 'ORDER', description = 'Order Payment' }) => {
    setLoading(true);
    setError(null);
    setLastResult(null);
    try {
      const payload = { phone, amount, orderId, accountReference, description };
      setLastRequest(payload);
      const data = await invokeFunction('mpesa', {
        ...payload,
        route: 'stkpush'
      });
      setLastResult(data);
      return { success: true, data };
    } catch (e) {
      setError(e.message || 'Payment initiation failed');
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [invokeFunction]);

  const pollPaymentStatus = useCallback(async ({ checkoutRequestId, orderId }) => {
    try {
      const data = await invokeFunction('mpesa', { checkoutRequestId, orderId });
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [invokeFunction]);

  const value = useMemo(() => ({
    loading,
    error,
    lastRequest,
    lastResult,
    initiateStkPush,
    pollPaymentStatus
  }), [loading, error, lastRequest, lastResult, initiateStkPush, pollPaymentStatus]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}


