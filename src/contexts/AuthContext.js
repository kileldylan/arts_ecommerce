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
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          // Fetch user profile from profiles table
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        
        if (session?.user) {
          // For OAuth sign-ins, create profile and user records
          if (event === 'SIGNED_IN') {
            await handleOAuthSignIn(session.user);
          } else {
            await fetchUserProfile(session.user);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleOAuthSignIn = async (authUser) => {
    try {
      // First, try to fetch existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create both profile and user records
        await createProfileAndUserRecords(authUser);
      } else if (profileError) {
        throw profileError;
      } else {
        // Profile exists, just update user data
        const userData = {
          ...authUser,
          profile: profile
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error in handleOAuthSignIn:', error);
      setUser(authUser); // Fallback to just auth user
    }
  };
  
  const createProfileAndUserRecords = async (authUser) => {
    try {
      const userMetadata = authUser.user_metadata || {};
      const fullName = userMetadata.full_name || userMetadata.name || '';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // For Google OAuth, we don't have a password, so we'll handle it differently
      const userType = userMetadata.user_type || 'customer';

      // 1. Create profile record (Supabase auth profiles)
      const { error: profileError } = await supabase
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
        ]);

      if (profileError) throw profileError;

      // 2. Create record in your existing users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id, // Using the same UUID from auth.users
            name: fullName,
            email: authUser.email,
            password: 'oauth-user-no-password', // Placeholder for OAuth users
            user_type: userType,
            phone: null, // Can be updated later
            bio: userMetadata.bio || null,
            specialty: userMetadata.specialty || null,
            portfolio: userMetadata.portfolio || null,
            social_media: userMetadata.social_media || null,
            avatar: userMetadata.avatar_url || null,
            is_verified: 1, // OAuth users are typically verified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);

      if (userError && !userError.message.includes('duplicate key')) {
        console.warn('Error creating users table record:', userError);
        // Don't throw error for users table - it might have constraints
      }

      // Fetch the newly created profile
      await fetchUserProfile(authUser);
    } catch (error) {
      console.error('Error creating profile and user records:', error);
      throw error;
    }
  };

  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createProfileAndUserRecords(authUser);
          return;
        }
        throw error;
      }

      const userData = {
        ...authUser,
        profile: profile
      };
      setUser(userData);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(authUser); // Fallback to just auth user
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user);
        // ✅ FIXED: Return data.user instead of user state
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
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
            bio: userData.bio,
            specialty: userData.specialty,
            portfolio: userData.portfolio,
            social_media: userData.socialMedia,
            phone: userData.phone,
          },
          emailRedirectTo: `${window.location.origin}/oauth-success`,
        },
      });

      if (error) throw error;

      // For email/password registration, also create profile immediately
      if (data.user && data.session) {
        await createProfileAndUserRecords(data.user);
      }

      return { 
        success: true, 
        user: data.user,
        needsEmailVerification: !data.session // If no session, email verification was sent
      };
    } catch (error) {
      console.error('Registration error:', error);
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
          // Pass user type as additional data
          data: {
            user_type: userType,
          }
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}