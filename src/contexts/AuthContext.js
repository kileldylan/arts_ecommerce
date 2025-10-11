import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  const [lastProfileUpdate, setLastProfileUpdate] = useState(0);
  
  // Use refs to track state without causing re-renders
  const profileCacheRef = useRef({});
  const lastFetchTimeRef = useRef(0);

  // Enhanced profile fetcher with cache control
  const fetchUserProfile = async (userId, forceRefresh = false) => {
    try {
      const now = Date.now();
      const CACHE_TIMEOUT = 30000; // 30 seconds cache
      
      // Check cache if not forcing refresh
      if (!forceRefresh && 
          profileCacheRef.current[userId] && 
          now - lastFetchTimeRef.current < CACHE_TIMEOUT) {
        console.log('📦 Using cached profile for user:', userId);
        setProfile(profileCacheRef.current[userId]);
        return profileCacheRef.current[userId];
      }

      console.log('🔄 Fetching fresh profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile does not exist for user:', userId);
          profileCacheRef.current[userId] = null;
          setProfile(null);
          return null;
        }
        throw error;
      }

      console.log('✅ Profile fetched successfully:', data);
      
      // Update cache and state
      profileCacheRef.current[userId] = data;
      setProfile(data);
      setLastProfileUpdate(now);
      lastFetchTimeRef.current = now;
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      return null;
    }
  };

  // Clear cache function
  const clearProfileCache = (userId = null) => {
    if (userId) {
      delete profileCacheRef.current[userId];
    } else {
      profileCacheRef.current = {};
    }
    lastFetchTimeRef.current = 0;
    setLastProfileUpdate(Date.now());
    console.log('🧹 Cleared profile cache for:', userId || 'all users');
  };

  // Update profile immediately (for avatar changes, etc.)
  const updateProfileImmediately = (updatedProfile) => {
    if (updatedProfile && user) {
      profileCacheRef.current[user.id] = updatedProfile;
      setProfile(updatedProfile);
      setLastProfileUpdate(Date.now());
      console.log('⚡ Profile updated immediately:', updatedProfile);
    }
  };

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing...');

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        console.log('🔍 Session found:', !!session);

        if (session?.user) {
          setUser(session.user);
          console.log('👤 User set:', session.user.id);
          
          // Always fetch fresh profile on initialization (no cache)
          await fetchUserProfile(session.user.id, true);
        } else {
          console.log('🔍 No user session');
          setUser(null);
          setProfile(null);
          clearProfileCache();
        }
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setProfile(null);
        clearProfileCache();
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
          // Force refresh profile on auth state changes
          await fetchUserProfile(session.user.id, true);
        } else {
          setUser(null);
          setProfile(null);
          clearProfileCache();
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('🔌 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
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
        // Clear cache and fetch fresh profile after successful login
        clearProfileCache(data.user.id);
        await fetchUserProfile(data.user.id, true);
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
          // Clear cache and refresh profile after creation
          clearProfileCache(data.user.id);
          await fetchUserProfile(data.user.id, true);
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
      clearProfileCache();
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (forceRefresh = true) => {
    if (user) {
      return await fetchUserProfile(user.id, forceRefresh);
    }
    return null;
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
    refreshProfile,
    updateProfileImmediately, // New function for immediate updates
    clearProfileCache, // New function to clear cache
    lastProfileUpdate, // For components to watch for changes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}