import React, { createContext, useState, useContext, useEffect } from 'react';

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
    const initAuth = async () => {
      const token = sessionStorage.getItem('token'); // Use sessionStorage only
      const savedUser = sessionStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData)); // Update with fresh data
          } else {
            clearAuthData(); // Clear if token is invalid
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          clearAuthData(); // Clear on network error
        }
      } else {
        clearAuthData(); // No token or user, start fresh
      }
      setLoading(false); // Set loading to false after initialization
    };

    initAuth();
  }, []); // Run once on mount

  const clearAuthData = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        clearAuthData();
        return { success: false, error: 'Invalid token' };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      clearAuthData();
      return { success: false, error: 'Network error' };
    }
  };

  const login = async (email, password, userType) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user: userData } = data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user: userData } = data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
    fetchUserProfile, // Added back to the context value
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}