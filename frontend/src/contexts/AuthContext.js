// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase, checkSessionHealth, extendSession } from '../utils/supabaseClient';

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

  // Cache for profile to reduce unnecessary fetches
  const profileCacheRef = useRef({
    data: null,
    lastFetch: 0,
    cacheDuration: 2 * 60 * 1000, // 2 minutes
  });

  // ================== PROFILE HELPERS ==================
  const handleGoogleUserProfile = useCallback(async (user) => {
    if (!user?.id) return null;

    try {
      const now = Date.now();
      if (
        profileCacheRef.current.data?.id === user.id &&
        now - profileCacheRef.current.lastFetch < profileCacheRef.current.cacheDuration
      ) {
        setProfile(profileCacheRef.current.data);
        return profileCacheRef.current.data;
      }

      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        profileCacheRef.current = { data: existing, lastFetch: now };
        setProfile(existing);
        return existing;
      }

      if (!existing && !fetchError) {
        console.log('📝 Creating new profile for Google user...');
        const fullName = user.user_metadata?.full_name || '';
        const firstName = user.user_metadata?.first_name || fullName.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '';
        const email = user.email || user.user_metadata?.email || '';

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            user_type: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .maybeSingle();

        if (insertError) throw insertError;

        profileCacheRef.current = { data: newProfile, lastFetch: now };
        setProfile(newProfile);
        return newProfile;
      }

      return null;
    } catch (error) {
      console.error('❌ Google profile error:', error);
      return null;
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) return null;

    const now = Date.now();
    if (
      !forceRefresh &&
      profileCacheRef.current.data?.id === userId &&
      now - profileCacheRef.current.lastFetch < profileCacheRef.current.cacheDuration
    ) {
      setProfile(profileCacheRef.current.data);
      return profileCacheRef.current.data;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        profileCacheRef.current = { data, lastFetch: now };
        setProfile(data);
        return data;
      }
      setProfile(null);
      return null;
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
        cacheDuration: 2 * 60 * 1000,
      };
      setProfile(updatedProfile);
    }
  }, []);

  // ================== SESSION MANAGEMENT ==================
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Refreshing session with server...');
      const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
      if (error || !refreshed?.user) {
        console.warn('Session refresh failed:', error?.message);
        return null;
      }

      setSession(refreshed);
      setUser(refreshed.user);

      const isGoogle =
        refreshed.user.app_metadata?.provider === 'google' ||
        refreshed.user.user_metadata?.provider === 'google' ||
        refreshed.user.identities?.some((i) => i.provider === 'google');

      if (isGoogle) {
        handleGoogleUserProfile(refreshed.user);
      } else {
        fetchUserProfile(refreshed.user.id);
      }

      return refreshed;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      return null;
    }
  }, [handleGoogleUserProfile, fetchUserProfile]);

  // ================== MAIN AUTH INITIALIZATION ==================
  useEffect(() => {
    let isMounted = true;
    let sessionKeepAliveInterval = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🚀 Initializing auth...');

        // 1. Get cached session from localStorage
        const { data: { session: cachedSession } } = await supabase.auth.getSession();

        if (!cachedSession?.user) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // 2. Force refresh session with timeout (critical for mobile)
        const refreshPromise = supabase.auth.refreshSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('refresh_timeout')), 8000)
        );

        const { data: { session: refreshedSession }, error: refreshError } = await Promise.race([
          refreshPromise,
          timeoutPromise,
        ]).catch((err) => ({ error: err }));

        if (refreshError || !refreshedSession?.user) {
          console.warn('Session refresh failed → signing out stale session');
          await supabase.auth.signOut();
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // 3. Valid session
        if (isMounted) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          setLoading(false);

          const isGoogle =
            refreshedSession.user.app_metadata?.provider === 'google' ||
            refreshedSession.user.user_metadata?.provider === 'google' ||
            refreshedSession.user.identities?.some((i) => i.provider === 'google');

          if (isGoogle) {
            handleGoogleUserProfile(refreshedSession.user);
          } else {
            fetchUserProfile(refreshedSession.user.id);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    initializeAuth();

    // ✅ KEEP SESSION ALIVE - Refresh token every 10 minutes
    sessionKeepAliveInterval = setInterval(async () => {
      if (session && user) {
        console.log('🔄 Keeping session alive...');
        const refreshed = await extendSession();
        if (refreshed && isMounted) {
          setSession(refreshed);
          setUser(refreshed.user);
        }
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔐 Auth state change:', event);

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const isGoogle =
          currentSession.user.app_metadata?.provider === 'google' ||
          currentSession.user.user_metadata?.provider === 'google' ||
          currentSession.user.identities?.some((i) => i.provider === 'google');

        if (isGoogle) handleGoogleUserProfile(currentSession.user);
        else fetchUserProfile(currentSession.user.id);
      }

      if (['SIGNED_OUT', 'USER_DELETED'].includes(event)) {
        setSession(null);
        setUser(null);
        setProfile(null);
        profileCacheRef.current.data = null;
      }
    });

    // Mobile: re-validate session when app becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, re-validating session...');
        const validSession = await refreshSession();
        if (!validSession && isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      isMounted = false;
      if (sessionKeepAliveInterval) clearInterval(sessionKeepAliveInterval);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleGoogleUserProfile, fetchUserProfile, refreshSession, session, user]);

  // ================== LOGIN / REGISTER / LOGOUT ==================
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
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return {
        success: true,
        user: data.user,
        needsEmailVerification: !data.session,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      let origin = window.location.origin;
      origin = origin
        .replace('lochttps', 'https')
        .replace('httphttp', 'http')
        .replace('httpshttps', 'https')
        .replace('vercel.appalhost', 'vercel.app');

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

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      setUser(null);
      setProfile(null);
      setSession(null);
      profileCacheRef.current = { data: null, lastFetch: 0, cacheDuration: 2 * 60 * 1000 };

      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
      return { success: false, error: error.message, localCleared: true };
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

  // ================== CONTEXT VALUE ==================
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}