import { useCallback, useEffect, useState } from 'react';
import { api, errMessage } from './api/client';
import type { Tenant } from './api/types';

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setTenants(await api.listTenants());
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tenants, error, loading, reload };
}

/** Remembers the last selected tenant id across tabs via sessionStorage. */
export function useSelectedTenant(tenants: Tenant[]) {
  const [id, setId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('tenantId') ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (tenants.length && !tenants.some((t) => t.id === id)) {
      setId(tenants[0].id);
    }
  }, [tenants, id]);

  const select = useCallback((next: string) => {
    setId(next);
    try {
      sessionStorage.setItem('tenantId', next);
    } catch {
      /* ignore */
    }
  }, []);

  return [id, select] as const;
}
