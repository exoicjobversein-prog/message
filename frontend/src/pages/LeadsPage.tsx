import { useCallback, useEffect, useState } from 'react';
import { api, errMessage } from '../api/client';
import type { Lead } from '../api/types';
import { useAuth } from '../auth';

const EXTRA_FIELDS = ['city', 'type', 'link'] as const;

export default function LeadsPage() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id ?? '';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLeads(await api.listLeads(tenantId));
      setErr(null);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function addOne() {
    if (!tenantId || !form.phone?.trim()) {
      setErr('Phone is required');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const extra: Record<string, string> = {};
      for (const k of EXTRA_FIELDS) if (form[k]?.trim()) extra[k] = form[k].trim();
      await api.createLead(tenantId, {
        name: form.name?.trim() || undefined,
        phone: form.phone.trim(),
        extra,
      });
      setForm({});
      setMsg('Lead added');
      await load();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function addBulk() {
    if (!tenantId || !bulk.trim()) {
      setErr('Paste some rows first');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await api.createLeadsBulk(tenantId, bulk.trim());
      setBulk('');
      setMsg('Imported');
      await load();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {(err || msg) && (
        <div className={`banner ${err ? 'err' : 'ok'}`}>{err ?? msg}</div>
      )}

      <div className="card">
        <h2>Add lead</h2>
        <div className="grid">
          <div>
            <label>Name</label>
            <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label>Phone (E.164)</label>
            <input
              value={form.phone ?? ''}
              placeholder="+9198XXXXXXXX"
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="grid">
          {EXTRA_FIELDS.map((k) => (
            <div key={k}>
              <label style={{ textTransform: 'capitalize' }}>{k}</label>
              <input value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <button className="btn" onClick={addOne} disabled={busy || !tenantId}>
          Add lead
        </button>
      </div>

      <div className="card">
        <h2>Bulk paste</h2>
        <label>
          One per line: <code>name,phone,city</code>
        </label>
        <textarea
          value={bulk}
          placeholder={'Rahul,+9198XXXXXXXX,Baner\nPriya,+9199XXXXXXXX,Kothrud'}
          onChange={(e) => setBulk(e.target.value)}
        />
        <button className="btn" onClick={addBulk} disabled={busy || !tenantId}>
          Import
        </button>
      </div>

      <div className="card">
        <h2>Leads</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No leads.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.name ?? '—'}</td>
                <td>{l.phone}</td>
                <td className="muted">{JSON.stringify(l.extra ?? {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
