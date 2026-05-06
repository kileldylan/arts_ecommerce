// src/utils/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
}

// ✅ FIXED: Use localStorage for persistent sessions (stays logged in across tabs/browser restarts)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ Use localStorage for persistence across browser restarts
    storage: {
      getItem: (key) => {
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      },
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure, better session handling
  },
});

// ✅ Session health check function
export const checkSessionHealth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session) {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏰ Session expires in ${Math.floor(timeUntilExpiry / 60)} minutes`);
      
      // Auto-refresh if less than 5 minutes remaining
      if (timeUntilExpiry < 300) {
        console.log('🔄 Session expiring soon, refreshing...');
        const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          return null;
        }
        return refreshed;
      }
      return session;
    }
    return null;
  } catch (error) {
    console.error('Session check failed:', error);
    return null;
  }
};

// ✅ Extend session function
export const extendSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    console.log('✅ Session extended successfully');
    return session;
  } catch (error) {
    console.error('Failed to extend session:', error);
    return null;
  }
};