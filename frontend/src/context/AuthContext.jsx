import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartbiz_token');
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  function login(token, userData) {
    localStorage.setItem('smartbiz_token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('smartbiz_token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
