import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiAuth, setToken, getToken } from '../lib/api';

interface Profile {
  id: string; nome: string; email: string; role: string;
  avatar_url?: string; telefone?: string;
}

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  isAdmin: boolean;
  isGerenteOuAcima: boolean;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      apiAuth.me()
        .then(p => setProfile(p))
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiAuth.login(email, password);
      setToken(data.token);
      setProfile(data.profile);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signOut = () => {
    setToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      profile, loading, signIn, signOut,
      isAdmin: profile?.role === 'admin',
      isGerenteOuAcima: profile?.role === 'admin' || profile?.role === 'gerente',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);