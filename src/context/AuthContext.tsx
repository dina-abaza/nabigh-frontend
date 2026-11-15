'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '@/lib/api';
import { clearToken, getStoredToken, storeToken } from '@/lib/auth-storage';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// /auth/register, /auth/login and /auth/google return `id`, while /users/me returns `_id`.
function normalizeUser(raw: AuthUser & { _id?: string }): AuthUser {
  return { ...raw, id: raw.id ?? raw._id! };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    storeToken(nextToken);
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(normalizeUser(nextUser));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }
      setAccessToken(storedToken);
      if (isMounted) setToken(storedToken);
      try {
        const response = await api.get('/users/me');
        if (isMounted) setUser(normalizeUser(response.data.data));
      } catch {
        clearToken();
        setAccessToken(null);
        if (isMounted) setToken(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await api.post('/auth/register', input);
      applySession(response.data.data.token, response.data.data.user);
    },
    [applySession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await api.post('/auth/login', input);
      applySession(response.data.data.token, response.data.data.user);
    },
    [applySession],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await api.post('/auth/google', { idToken });
      applySession(response.data.data.token, response.data.data.user);
    },
    [applySession],
  );

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const response = await api.patch('/users/me', input);
    setUser(normalizeUser(response.data.data));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, register, login, loginWithGoogle, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
