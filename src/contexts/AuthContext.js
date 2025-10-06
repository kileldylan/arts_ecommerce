import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch additional user data from your "users" table
      if (data.user) {
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();

        if (!userError && userRecord) {
          const userData = { ...data.user, details: userRecord };
          setUser(userData);
          return { success: true, user: userData };
        }
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: `${userData.firstName} ${userData.lastName}`,
            user_type: userData.userType,
          },
        },
      });

      if (error) throw error;

      // Insert user record in your Supabase "users" table
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            password: userData.password, // optional (you might hash this if backend)
            user_type: userData.userType,
          },
        ]);

        if (insertError) throw insertError;
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
