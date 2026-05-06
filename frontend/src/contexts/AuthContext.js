// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  
  // Cache ref for profile to prevent unnecessary fetches
  const profileCacheRef = useRef({
    data: null,
    lastFetch: 0,
    cacheDuration: 2 * 60 * 1000 // 2 minutes
  });

  // Handle Google user profile creation
  const handleGoogleUserProfile = useCallback(async (user) => {
    if (!user || !user.id) return null;
    
    try {
      const now = Date.now();
      if (profileCacheRef.current.data && 
          profileCacheRef.current.data.id === user.id &&
          (now - profileCacheRef.current.lastFetch) < profileCacheRef.current.cacheDuration) {
        setProfile(profileCacheRef.current.data);
        return profileCacheRef.current.data;
      }
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        profileCacheRef.current = { data: existingProfile, lastFetch: Date.now(), cacheDuration: 2 * 60 * 1000 };
        setProfile(existingProfile);
        return existingProfile;
      }
      
      if (!existingProfile && !fetchError) {
        console.log('📝 Creating new profile for Google user...');
        const fullName = user.user_metadata?.full_name || '';
        const firstName = user.user_metadata?.first_name || fullName.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '';
        const email = user.email || user.user_metadata?.email || '';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            user_type: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .maybeSingle();
        
        if (insertError) throw insertError;
        
        profileCacheRef.current = { data: newProfile, lastFetch: Date.now(), cacheDuration: 2 * 60 * 1000 };
        setProfile(newProfile);
        return newProfile;
      }
      return null;
    } catch (error) {
      console.error('❌ Google profile error:', error);
      return null;
    }
  }, []);

  // Optimized profile fetcher with caching
  const fetchUserProfile = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) return null;
    
    const now = Date.now();
    if (!forceRefresh && 
        profileCacheRef.current.data && 
        profileCacheRef.current.data.id === userId &&
        (now - profileCacheRef.current.lastFetch) < profileCacheRef.current.cacheDuration) {
      setProfile(profileCacheRef.current.data);
      return profileCacheRef.current.data;
    }
    
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
        profileCacheRef.current = { data, lastFetch: now, cacheDuration: 2 * 60 * 1000 };
        setProfile(data);
        return data;
      } else {
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (forceRefresh = false) => {
    if (user?.id) {
      return await fetchUserProfile(user.id, forceRefresh);
    }
    return null;
  }, [user?.id, fetchUserProfile]);

  const updateProfileImmediately = useCallback((updatedProfile) => {
    if (updatedProfile) {
      profileCacheRef.current = { 
        data: updatedProfile, 
        lastFetch: Date.now(), 
        cacheDuration: 2 * 60 * 1000 
      };
      setProfile(updatedProfile);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Refreshing session with server...');
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session refresh error:', error.message);
        // Don't throw here, just return null
        return null;
      }
      
      if (refreshedSession?.user) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        // Don't await profile fetch - let it happen in background
        fetchUserProfile(refreshedSession.user.id);
        return refreshedSession;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      return null;
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      setUser(null);
      setProfile(null);
      setSession(null);
      profileCacheRef.current = { data: null, lastFetch: 0, cacheDuration: 2 * 60 * 1000 };
      
      const { error } = await supabase.auth.signOut();
      if (error && !error.message.includes('AuthSessionMissingError') && !error.message.includes('session missing')) {
        throw error;
      }
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      return { success: false, error: error.message, localCleared: true };
    }
  }, []);

  // ✅ CRITICAL MOBILE FIX: Force session validation on every app start/visibility
  useEffect(() => {
    let isMounted = true;
    let visibilityHandler = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🚀 Initializing auth (mobile-optimized)...');
        
        // Step 1: Get current session from local cache
        const { data: { session: cachedSession }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('Get session error:', getSessionError);
          await logout();
          if (isMounted) setLoading(false);
          return;
        }
        
        // Step 2: If no cached session, we are logged out
        if (!cachedSession) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // Step 3: Always refresh session to validate with server (kills stale cached sessions)
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.warn('Session refresh failed, clearing stale session');
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // Valid session exists
        if (isMounted) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          setLoading(false); // UI can render now, profile loads in background
          
          const isGoogleUser = refreshedSession.user.app_metadata?.provider === 'google' || 
                               refreshedSession.user.user_metadata?.provider === 'google' ||
                               refreshedSession.user.identities?.some(identity => identity.provider === 'google');
          
          if (isGoogleUser) {
            handleGoogleUserProfile(refreshedSession.user);
          } else {
            fetchUserProfile(refreshedSession.user.id);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // ✅ Mobile fix: refresh session when app becomes visible (user returns from background)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, validating session...');
        const refreshed = await refreshSession();
        if (!refreshed && isMounted) {
          // Session invalid, force re-login by clearing state
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    // Listen to auth changes (already provided by Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth state change:', event);
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              const isGoogleUser = currentSession.user.app_metadata?.provider === 'google' || 
                                   currentSession.user.user_metadata?.provider === 'google' ||
                                   currentSession.user.identities?.some(identity => identity.provider === 'google');
              if (isGoogleUser) {
                await handleGoogleUserProfile(currentSession.user);
              } else {
                fetchUserProfile(currentSession.user.id);
              }
            }
            break;
          case 'SIGNED_OUT':
          case 'USER_DELETED':
            setSession(null);
            setUser(null);
            setProfile(null);
            profileCacheRef.current = { data: null, lastFetch: 0, cacheDuration: 2 * 60 * 1000 };
            break;
          default:
            break;
        }
      }
    );

    // Periodic session check every 5 minutes (less important on mobile)
    const sessionCheckInterval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000);

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleGoogleUserProfile, fetchUserProfile, refreshSession, logout]);

  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Login attempt...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('✅ Login successful');
      await refreshSession();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.message };
    }
  }, [refreshSession]);

  const register = useCallback(async (userData) => {
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
      if (data.user) {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          email: data.user.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.userType,
          created_at: new Date().toISOString(),
        }]);
      }
      return { success: true, user: data.user, needsEmailVerification: !data.session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      let origin = window.location.origin;
      origin = origin.replace('lochttps', 'https').replace('httphttp', 'http').replace('httpshttps', 'https');
      origin = origin.replace('vercel.appalhost', 'vercel.app');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/oauth-success` },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const validateSession = useCallback(async () => {
    return await refreshSession();
  }, [refreshSession]);

  const getToken = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt > now) return currentSession.access_token;
        const { data: refreshData } = await supabase.auth.refreshSession();
        return refreshData.session?.access_token || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Token error:', error);
      return null;
    }
  }, []);

  const value = {
    user,
    profile,
    session,
    userData: user ? { ...user, profile } : null,
    isAuthenticated: !!user && !!session,
    sessionReady: !loading && !!session,
    userType: profile?.user_type || 'customer',
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    refreshProfile,
    updateProfileImmediately,
    validateSession,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}