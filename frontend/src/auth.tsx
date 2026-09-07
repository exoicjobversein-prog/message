import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken } from './api/client';
import type { AuthUser, Tenant } from './api/types';

interface AuthState {
  user: AuthUser | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { user, tenant } = await api.me();
      setUser(user);
      setTenant(tenant);
    } catch {
      setToken(null);
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await api.login(email, password);
    setToken(token);
    const me = await api.me();
    setUser(me.user);
    setTenant(me.tenant);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTenant(null);
    window.location.assign('/login');
  }, []);

  const value = useMemo(
    () => ({ user, tenant, loading, login, logout }),
    [user, tenant, loading, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
