import { useState } from 'react';
import { api, errMessage } from '../api/client';
import { useTenants } from '../hooks';

export default function TenantsPage() {
  const { tenants, error, reload } = useTenants();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setErr('Name, email, and a 6+ char password are required');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await api.createTenant(name.trim(), email.trim(), password);
      setName('');
      setEmail('');
      setPassword('');
      setMsg(
        `Tenant "${r.tenant.name}" created · login ${r.login.email}` +
          (r.provisioning.ok
            ? ` · sender ${r.tenant.senderId ?? '—'}`
            : ` · provisioning skipped (${r.provisioning.error ?? 'no Plivo creds'})`),
      );
      await reload();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function provision(id: string) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await api.provisionTenant(id);
      setMsg(`Provisioned · sender ${r.senderId ?? '—'}`);
      await reload();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {(error || err || msg) && (
        <div className={`banner ${error || err ? 'err' : 'ok'}`}>
          {error ?? err ?? msg}
        </div>
      )}

      <div className="card">
        <h2>New tenant workspace</h2>
        <label htmlFor="t-name">Business name</label>
        <input
          id="t-name"
          value={name}
          placeholder="Gautam Realty"
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid">
          <div>
            <label htmlFor="t-email">Login email</label>
            <input
              id="t-email"
              type="email"
              value={email}
              placeholder="owner@gautamrealty.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="t-pw">Temporary password</label>
            <input
              id="t-pw"
              value={password}
              placeholder="min 6 characters"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="hint">
          Creates the workspace, its login account, and a Plivo sender (best effort).
          Share the email + password with the tenant.
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
              <th>Login</th>
              <th>Sender ID</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No tenants yet.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="muted">
                  {t.users?.find((u) => u.role === 'tenant')?.email ?? '—'}
                </td>
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
