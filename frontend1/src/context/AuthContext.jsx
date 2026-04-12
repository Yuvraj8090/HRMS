// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('hrms_user');
    const t = localStorage.getItem('hrms_token');
    if (u && t) { try { setUser(JSON.parse(u)); } catch { localStorage.clear(); } }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('hrms_token', data.token);
    localStorage.setItem('hrms_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setUser(null);
  }, []);

  const updateUser = useCallback(patch => {
    setUser(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('hrms_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthCtx.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      role:       user?.role ?? null,
      isAdmin:    user?.role === 'Admin',
      isHR:       user?.role === 'HR',
      isEmployee: user?.role === 'Employee',
      hasRole: (...roles) => roles.includes(user?.role),
      login, logout, updateUser,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
