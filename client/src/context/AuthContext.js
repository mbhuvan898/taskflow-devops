import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem('tf_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('tf_token', data.token);
    setUser(data.user);
  };

  const register = async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password });
    localStorage.setItem('tf_token', data.token);
    setUser(data.user);
  };

  const logout = () => { localStorage.removeItem('tf_token'); setUser(null); };

  const refresh = async () => {
    const { data } = await authAPI.me();
    setUser(data);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
