import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  // Handle Google user profile creation
  const handleGoogleUserProfile = async (user) => {
    if (!user || !user.id) return null;
    
    try {
      // Check if profile already exists using maybeSingle
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      // If profile exists, return it
      if (existingProfile) {
        console.log('✅ Existing profile found for Google user');
        setProfile(existingProfile);
        return existingProfile;
      }
      
      // If profile doesn't exist, create it
      if (!existingProfile && !fetchError) {
        console.log('📝 Creating new profile for Google user...');
        
        // Extract name from user metadata
        const fullName = user.user_metadata?.full_name || '';
        const firstName = user.user_metadata?.first_name || fullName.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '';
        const email = user.email || user.user_metadata?.email || '';
        
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              user_type: 'customer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .maybeSingle();
        
        if (insertError) {
          console.error('❌ Failed to create profile for Google user:', insertError);
          return null;
        }
        
        console.log('✅ Profile created successfully for Google user');
        setProfile(newProfile);
        return newProfile;
      }
      
      // Handle other errors
      if (fetchError) {
        console.error('❌ Error checking existing profile:', fetchError);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Unexpected error in handleGoogleUserProfile:', error);
      return null;
    }
  };

  // Lightweight, non-blocking profile fetcher
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return null;
      }
      
      if (data) {
        setProfile(data);
        return data;
      } else {
        // Profile doesn't exist - this could happen for Google users before creation
        console.log('No profile found for user:', userId);
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile(null);
      return null;
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
        // Fetch profile in background to avoid blocking UI
        fetchUserProfile(currentSession.user.id);
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

  // Enhanced logout function with error handling
  const logout = async () => {
    try {
      console.log('🚪 Attempting logout...');
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Try to sign out from Supabase with error handling
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // If it's a session missing error, it might already be logged out
        if (error.message.includes('AuthSessionMissingError') || 
            error.message.includes('session missing')) {
          console.log('ℹ️ Session already invalidated, continuing with local logout');
          return { success: true };
        }
        throw error;
      }
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if Supabase logout fails, ensure local state is cleared
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Clear any residual tokens/local storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      return { 
        success: false, 
        error: error.message,
        localCleared: true
      };
    }
  };

  // Enhanced auth state listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🚀 Initializing auth...');
        const { data: { session: bootSession } } = await supabase.auth.getSession();
        
        if (!bootSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          setLoading(false);
        } else {
          setSession(bootSession);
          setUser(bootSession.user);
          setLoading(false);
          
          // Check if Google user and handle profile accordingly
          const isGoogleUser = bootSession.user.app_metadata?.provider === 'google' || 
                               bootSession.user.user_metadata?.provider === 'google' ||
                               bootSession.user.identities?.some(identity => identity.provider === 'google');
          
          if (isGoogleUser) {
            await handleGoogleUserProfile(bootSession.user);
          } else {
            fetchUserProfile(bootSession.user.id).catch(() => {});
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Enhanced auth state change listener with profile creation for Google users
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
              
              // Check if this is a Google user
              const isGoogleUser = currentSession.user.app_metadata?.provider === 'google' || 
                                   currentSession.user.user_metadata?.provider === 'google' ||
                                   currentSession.user.identities?.some(identity => identity.provider === 'google');
              
              if (isGoogleUser) {
                // For Google users, ensure profile exists
                await handleGoogleUserProfile(currentSession.user);
              } else {
                // For email/password users, fetch existing profile
                fetchUserProfile(currentSession.user.id);
              }
            }
            break;

          case 'SIGNED_OUT':
            console.log('✅ Signed out event received');
            setSession(null);
            setUser(null);
            setProfile(null);
            break;

          case 'USER_DELETED':
            setSession(null);
            setUser(null);
            setProfile(null);
            break;

          case 'INITIAL_SESSION':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              fetchUserProfile(currentSession.user.id).catch(() => {});
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
      let origin = window.location.origin;
  
      // Fix any common malformed cases
      origin = origin.replace('lochttps', 'https').replace('httphttp', 'http').replace('httpshttps', 'https');
      origin = origin.replace('vercel.appalhost', 'vercel.app');
  
      const redirectTo = `${origin}/oauth-success`;
  
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
  
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Session validation function for other components to use
  const validateSession = async () => {
    return await refreshSession();
  };

  const getToken = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return null;
      }
      
      if (currentSession?.access_token) {
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        if (expiresAt && expiresAt > now) {
          console.log('✅ Using existing valid token');
          return currentSession.access_token;
        }
        
        console.log('🔄 Token expired, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          return null;
        }
        
        return refreshData.session?.access_token || null;
      }
      
      console.warn('⚠️ No active session found');
      return null;
    } catch (error) {
      console.error('❌ Unexpected error getting token:', error);
      return null;
    }
  }, []);

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
    validateSession,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}