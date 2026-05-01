// contexts/PaymentContext.js - Simplified (just for polling)
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

  // Poll payment status using Supabase Edge Function
  const pollPaymentStatus = useCallback(async (checkoutRequestId, orderId) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('mpesa', {
        body: {
          route: 'status',
          checkoutRequestId,
          orderId
        }
      });
      
      if (fnError) throw fnError;
      return { success: true, data };
    } catch (e) {
      console.error('Polling error:', e);
      return { success: false, error: e.message };
    }
  }, []);

  const value = useMemo(() => ({
    loading,
    error,
    pollPaymentStatus
  }), [loading, error, pollPaymentStatus]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}