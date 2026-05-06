// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase, startSessionHeartbeat, stopSessionHeartbeat, isSessionValid } from '../utils/supabaseClient';

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
    let stopHeartbeat = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🚀 Initializing auth with sessionStorage + heartbeat...');

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

        // Validate session is not expired
        const valid = await isSessionValid();
        if (!valid) {
          console.log('Session expired, clearing...');
          await supabase.auth.signOut();
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // Valid session
        if (isMounted) {
          setSession(cachedSession);
          setUser(cachedSession.user);
          setLoading(false);

          const isGoogle = cachedSession.user.app_metadata?.provider === 'google' ||
                          cachedSession.user.user_metadata?.provider === 'google' ||
                          cachedSession.user.identities?.some((i) => i.provider === 'google');

          if (isGoogle) {
            handleGoogleUserProfile(cachedSession.user);
          } else {
            fetchUserProfile(cachedSession.user.id);
          }
        }

        // ✅ Start heartbeat to keep session alive
        stopHeartbeat = startSessionHeartbeat((refreshedSession) => {
          if (isMounted && refreshedSession) {
            console.log('🔄 Heartbeat refreshed session');
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          }
        });

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

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔐 Auth state change:', event);

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const isGoogle = currentSession.user.app_metadata?.provider === 'google' ||
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
        stopSessionHeartbeat(); // Stop heartbeat on logout
      }
    });

    // Mobile: re-validate session when app becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, checking session...');
        const valid = await isSessionValid();
        if (!valid && isMounted && session) {
          console.log('Session expired while away, logging out');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (stopHeartbeat) stopHeartbeat();
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleGoogleUserProfile, fetchUserProfile]); // ✅ FIXED: Removed 'session' from dependencies to prevent infinite loops

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
      sessionStorage.removeItem('sb-localhost-auth-token'); // Clear sessionStorage
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
      sessionStorage.removeItem('sb-localhost-auth-token');
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