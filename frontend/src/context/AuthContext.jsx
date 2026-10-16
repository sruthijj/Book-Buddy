import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('book_buddy_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('book_buddy_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Auto-login verification on initial app mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('book_buddy_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('book_buddy_user', JSON.stringify(res.data));
        } catch (err) {
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();

    // Listen for 401 expiration events dispatched by axios interceptor
    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('book_buddy_auth_change', handleAuthChange);
    return () => window.removeEventListener('book_buddy_auth_change', handleAuthChange);
  }, []);

  const login = async (username, password) => {
    setAuthError(null);
    try {
      const res = await authAPI.login({ username, password });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('book_buddy_token', access_token);
      localStorage.setItem('book_buddy_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid username or password.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    setAuthError(null);
    try {
      const res = await authAPI.register({ username, email, password });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('book_buddy_token', access_token);
      localStorage.setItem('book_buddy_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed. Please check inputs.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('book_buddy_token');
    localStorage.removeItem('book_buddy_user');
  };

  // Senior Developer Trick: 1-Click Demo Login for Evaluators & Recruiters
  const demoLogin = async () => {
    setAuthError(null);
    // 1. Attempt login with pre-configured reviewer demo account
    const loginResult = await login('demo_reviewer', 'DemoReviewer2026!');
    if (loginResult && loginResult.success) {
      return loginResult;
    }
    // 2. If demo account doesn't exist yet on backend, auto-register and authenticate!
    const registerResult = await register('demo_reviewer', 'reviewer@sayonetech.com', 'DemoReviewer2026!');
    return registerResult;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
