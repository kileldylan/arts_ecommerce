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

  // Enhanced profile fetcher with better error handling
  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔄 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile does not exist');
          // Don't create profile automatically - let registration handle it
          return null;
        }
        throw error;
      }

      console.log('✅ Profile fetched successfully:', data);
      setProfile(data);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing...');

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        console.log('🔍 Session found:', !!session);

        if (session?.user) {
          setUser(session.user);
          console.log('👤 User set:', session.user.id);
          
          // Fetch profile - but don't create if it doesn't exist
          await fetchUserProfile(session.user.id);
        } else {
          console.log('🔍 No user session');
          setUser(null);
          setProfile(null);
        }
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
        console.log('✅ Auth initialization complete - Loading:', false);
      }
    };

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch profile after successful login
        await fetchUserProfile(data.user.id);
      }

      return { 
        success: true, 
        user: data.user 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
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
        const { error: profileError } = await supabase
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

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
        } else {
          // Refresh profile after creation
          await fetchUserProfile(data.user.id);
        }
      }

      return { 
        success: true, 
        user: data.user,
        needsEmailVerification: !data.session
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (userType = 'customer') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-success`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    userData: user ? { ...user, profile } : null,
    isAuthenticated: !!user,
    userType: profile?.user_type || 'customer',
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    refreshProfile: () => user && fetchUserProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}