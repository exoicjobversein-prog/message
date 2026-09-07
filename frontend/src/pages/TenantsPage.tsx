import { useState } from 'react';
import { api, errMessage } from '../api/client';
import { useTenants } from '../hooks';

export default function TenantsPage() {
  const { tenants, error, reload } = useTenants();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.createTenant(name.trim());
      setName('');
      setMsg('Tenant created');
      await reload();
    } catch (e) {
      setMsg(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function provision(id: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.provisionTenant(id);
      setMsg(`Provisioned · sender ${r.senderId ?? '—'}`);
      await reload();
    } catch (e) {
      setMsg(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {(error || msg) && (
        <div className={`banner ${error ? 'err' : 'ok'}`}>{error ?? msg}</div>
      )}

      <div className="card">
        <h2>New tenant</h2>
        <label htmlFor="t-name">Business name</label>
        <input
          id="t-name"
          value={name}
          placeholder="Gautam Realty"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <div className="hint">
          Creates a Plivo subaccount and provisions a sender ID (best effort).
        </div>
        <button className="btn" onClick={create} disabled={busy}>
          Create tenant
        </button>
      </div>

      <div className="card">
        <h2>Tenants</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sender ID</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No tenants yet.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.senderId ?? '—'}</td>
                <td className="muted">
                  {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                </td>
                <td>
                  <button
                    className="btn secondary"
                    onClick={() => provision(t.id)}
                    disabled={busy}
                  >
                    Re-provision
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
