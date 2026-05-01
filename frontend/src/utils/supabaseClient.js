import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
}

// Create Supabase client with sessionStorage to isolate tabs
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        // Use sessionStorage instead of localStorage
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