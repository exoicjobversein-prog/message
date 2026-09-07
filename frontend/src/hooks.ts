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
