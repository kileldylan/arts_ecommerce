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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Enhanced profile fetcher with retry logic
  const fetchUserProfile = async (userId, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Fetching profile (attempt ${attempt}/${retries})...`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist
            console.log('⚠️ Profile not found for user:', userId);
            setProfile(null);
            return null;
          }
          throw error;
        }

        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
        return data;
      } catch (error) {
        console.error(`❌ Profile fetch attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          console.error('💥 All profile fetch attempts failed');
          setProfile(null);
          return null;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Check and refresh session
  const refreshSession = async () => {
    try {
      console.log('🔄 Checking/refreshing session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check error:', error);
        throw error;
      }

      console.log('🔍 Current session:', currentSession ? 'Valid' : 'Invalid');
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchUserProfile(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      return currentSession;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      return null;
    }
  };

  // Enhanced auth state listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🚀 Initializing auth...');
        
        await refreshSession();
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Enhanced auth state change listener with session refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth state change:', event, currentSession ? 'Has session' : 'No session');
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              await fetchUserProfile(currentSession.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
          case 'USER_DELETED':
            setSession(null);
            setUser(null);
            setProfile(null);
            break;
            
          case 'INITIAL_SESSION':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              await fetchUserProfile(currentSession.user.id);
            }
            break;
        }
        
        setLoading(false);
      }
    );

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  // Enhanced login with session validation
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('✅ Login successful, validating session...');
      await refreshSession();
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login failed:', error);
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
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType,
          },
        },
      });

      if (error) throw error;

      // Create profile after successful registration
      if (data.user) {
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              user_type: userData.userType,
              created_at: new Date().toISOString(),
            }
          ]);
      }

      return { 
        success: true, 
        user: data.user,
        needsEmailVerification: !data.session
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async (userType = 'customer') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-success`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  // Session validation function for other components to use
  const validateSession = async () => {
    return await refreshSession();
  };

  const value = {
    user,
    profile,
    session,
    userData: user ? { ...user, profile } : null,
    isAuthenticated: !!user && !!session,
    userType: profile?.user_type || 'customer',
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    refreshProfile: () => user && fetchUserProfile(user.id),
    validateSession, // Export session validation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}