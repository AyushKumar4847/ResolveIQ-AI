import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('resolveiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Check auth session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('resolveiq_user', JSON.stringify(res.data));
      } catch (err) {
        // If not authenticated or expired
        setUser(null);
        localStorage.removeItem('resolveiq_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to global logout event triggered by axios 401
    const handleForceLogout = () => {
      setUser(null);
      localStorage.removeItem('resolveiq_user');
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('resolveiq_user', JSON.stringify(res.data.user));
    } else {
      // fallback fetch /auth/me
      const meRes = await api.get('/auth/me');
      setUser(meRes.data);
      localStorage.setItem('resolveiq_user', JSON.stringify(meRes.data));
    }
    return res.data;
  };

  const register = async (username, email, password, role = 'user') => {
    const res = await api.post('/auth/register', { username, email, password, role });
    return res.data;
  };

  const updateProfile = async (updateData) => {
    const res = await api.patch('/auth/update', updateData);
    const updated = { ...user, ...res.data };
    setUser(updated);
    localStorage.setItem('resolveiq_user', JSON.stringify(updated));
    return updated;
  };

  const deleteAccount = async () => {
    await api.delete('/auth/delete');
    setUser(null);
    localStorage.removeItem('resolveiq_user');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('resolveiq_user');
    }
  };

  const userRole = (user?.role || '').trim().toLowerCase();
  const isAgent = userRole === 'agent' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        deleteAccount,
        logout,
        isAgent,
        isAdmin,
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
