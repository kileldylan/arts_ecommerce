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
  const [profile, setProfile] = useState(null); // Separate profile state
  const [loading, setLoading] = useState(true);

  // Simple profile fetcher
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
        
        // If profile doesn't exist, check if we need to create one
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile does not exist, checking auth user...');
          return null;
        }
        throw error;
      }

      console.log('✅ Profile fetched successfully:', data);
      setProfile(data);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      setProfile(null);
      return null;
    }
  };

  // Create profile if it doesn't exist
  const createUserProfile = async (authUser) => {
    try {
      console.log('🔄 Creating profile for user:', authUser.id);
      
      const userMetadata = authUser.user_metadata || {};
      const userType = userMetadata.user_type || 'customer';
      const fullName = userMetadata.full_name || userMetadata.name || 'User';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
            avatar_url: userMetadata.avatar_url,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Profile creation error:', error);
        throw error;
      }

      console.log('✅ Profile created successfully:', data);
      setProfile(data);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to create profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing...');

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        console.log('🔍 Session found:', !!session);

        if (session?.user) {
          setUser(session.user);
          
          // Try to fetch profile
          const userProfile = await fetchUserProfile(session.user.id);
          
          // If profile doesn't exist and this is a new user, create one
          if (!userProfile) {
            console.log('🔄 No profile found, creating one...');
            await createUserProfile(session.user);
          }
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
        console.log('✅ Auth initialization complete');
      }
    };

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          
          if (event === 'SIGNED_IN') {
            // For new sign-ins, ensure profile exists
            const profile = await fetchUserProfile(session.user.id);
            if (!profile) {
              await createUserProfile(session.user);
            }
          } else {
            // For existing sessions, just fetch profile
            await fetchUserProfile(session.user.id);
          }
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
    // User from Supabase Auth
    user,
    // Profile from profiles table (contains user_type)
    profile,
    // Combined user data for convenience
    userData: user ? { ...user, profile } : null,
    // Helpers
    isAuthenticated: !!user,
    userType: profile?.user_type || 'customer',
    // Methods
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    // Refresh profile
    refreshProfile: () => user && fetchUserProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}