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

  // Handle Google user profile creation (optimized)
  const handleGoogleUserProfile = useCallback(async (user) => {
    if (!user || !user.id) return null;
    
    try {
      // Check cache first
      const now = Date.now();
      if (profileCacheRef.current.data && 
          profileCacheRef.current.data.id === user.id &&
          (now - profileCacheRef.current.lastFetch) < profileCacheRef.current.cacheDuration) {
        console.log('✅ Serving Google profile from cache');
        setProfile(profileCacheRef.current.data);
        return profileCacheRef.current.data;
      }
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        console.log('✅ Existing profile found for Google user');
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
        
        console.log('✅ Profile created successfully for Google user');
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
    
    // Check cache
    const now = Date.now();
    if (!forceRefresh && 
        profileCacheRef.current.data && 
        profileCacheRef.current.data.id === userId &&
        (now - profileCacheRef.current.lastFetch) < profileCacheRef.current.cacheDuration) {
      console.log('✅ Serving profile from cache');
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
        // Update cache
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

  // Optimized refresh profile function
  const refreshProfile = useCallback(async (forceRefresh = false) => {
    if (user?.id) {
      return await fetchUserProfile(user.id, forceRefresh);
    }
    return null;
  }, [user?.id, fetchUserProfile]);

  // Immediate profile update (for optimistic UI updates)
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
      console.log('🔄 Checking/refreshing session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        // Fetch profile in background - don't await
        fetchUserProfile(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        profileCacheRef.current = { data: null, lastFetch: 0, cacheDuration: 2 * 60 * 1000 };
      }
      
      return currentSession;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      return null;
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Attempting logout...');
      
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

  // Optimized auth initialization
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
          setLoading(false);
        } else {
          setSession(bootSession);
          setUser(bootSession.user);
          
          const isGoogleUser = bootSession.user.app_metadata?.provider === 'google' || 
                               bootSession.user.user_metadata?.provider === 'google' ||
                               bootSession.user.identities?.some(identity => identity.provider === 'google');
          
          setLoading(false); // Set loading false immediately for faster UI
          
          // Handle profile in background
          if (isGoogleUser) {
            handleGoogleUserProfile(bootSession.user);
          } else {
            fetchUserProfile(bootSession.user.id);
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
        }
      }
    );

    const sessionCheckInterval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [handleGoogleUserProfile, fetchUserProfile, refreshSession]);

  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
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