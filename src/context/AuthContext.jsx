import { createContext, useState, useEffect } from 'react';
import * as authLib from '@/lib/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLib.isAuthenticated()) {
      setUser(authLib.getUser());
    }
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    const result = await authLib.login(loginId, password);
    if (result.error) return result;
    setUser(result.user);
    return { success: true, user: result.user };
  };

  const logout = () => {
    authLib.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
