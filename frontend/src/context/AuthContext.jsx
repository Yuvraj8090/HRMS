// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const clearStorage = () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  };

  // 1. Hydrate from localStorage on mount
  useEffect(() => {
    const storedUser  = localStorage.getItem('hrms_user');
    const storedToken = localStorage.getItem('hrms_token');
    if (storedUser && storedToken) {
      try { 
        setUser(JSON.parse(storedUser)); 
      } catch { 
        clearStorage(); 
      }
    }
    setLoading(false);
  }, []);

  // 2. Auth Methods
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('hrms_token', data.token);
    localStorage.setItem('hrms_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('hrms_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 3. System Event Listeners
  // Listen for 401 Unauthorized events from the API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      // Clear state safely. The RequireAuth router guard will catch this 
      // and natively redirect the user to /login without a hard reload.
      logout(); 
    };

    window.addEventListener('hrms:auth-expired', handleAuthExpired);
    
    // Cleanup listener to prevent memory leaks
    return () => {
      window.removeEventListener('hrms:auth-expired', handleAuthExpired);
    };
  }, [logout]);

  // 4. Context Value payload
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role:       user?.role ?? null,
    isAdmin:    user?.role === 'Admin',
    isHR:       user?.role === 'HR',
    isEmployee: user?.role === 'Employee',
    hasRole: (roles) => roles.includes(user?.role),
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export default AuthContext;