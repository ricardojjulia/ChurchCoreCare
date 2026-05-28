import { useEffect, useState } from 'react';
import { api } from './api.js';

export function useAuth() {
  const [user, setUser] = useState(undefined);  // undefined = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    api.me()
      .then((data) => setUser(data?.user ?? data))
      .catch((err) => {
        if (err.status === 401) setUser(null);
        else setError(err.message);
      });
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data?.user ?? data);
    return data;
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
  };

  return { user, error, login, logout };
}
