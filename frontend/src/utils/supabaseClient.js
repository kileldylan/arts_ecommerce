// src/utils/supabaseClient.js - UPDATED
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
}

// ✅ Keep sessionStorage for tab isolation (admin in one tab, customer in another)
// But add heartbeat to keep session alive
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        return sessionStorage.getItem(key);
      },
      setItem: (key, value) => {
        sessionStorage.setItem(key, value);
      },
      removeItem: (key) => {
        sessionStorage.removeItem(key);
      },
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ✅ Heartbeat function to keep session alive
let heartbeatInterval = null;

export const startSessionHeartbeat = (onSessionRefreshed) => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Refresh session every 5 minutes (before typical 10-15 min expiry)
  heartbeatInterval = setInterval(async () => {
    try {
      console.log('💓 Session heartbeat - refreshing token...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Heartbeat refresh failed:', error);
        return;
      }
      
      if (session) {
        console.log('✅ Session heartbeat successful');
        if (onSessionRefreshed) onSessionRefreshed(session);
      }
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  return () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  };
};

export const stopSessionHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

// ✅ Check if session is still valid
export const isSessionValid = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    return expiresAt > now;
  } catch {
    return false;
  }
};