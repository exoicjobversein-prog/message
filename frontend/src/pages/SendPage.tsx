import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errMessage } from '../api/client';
import type { Lead, SmsMessage, SmsTemplate } from '../api/types';
import { useSelectedTenant, useTenants } from '../hooks';
import TenantPicker from '../components/TenantPicker';

export default function SendPage() {
  const { tenants } = useTenants();
  const [tenantId, setTenantId] = useSelectedTenant(tenants);

  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pollRef = useRef<number | null>(null);

  const loadMessages = useCallback(async () => {
    if (!tenantId) return;
    try {
      setMessages(await api.listMessages(tenantId));
    } catch {
      /* keep last */
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    setSelected(new Set());
    setTemplateId('');
    (async () => {
      try {
        const [tpl, lds] = await Promise.all([
          api.listTemplates(tenantId),
          api.listLeads(tenantId),
        ]);
        setTemplates(tpl);
        setLeads(lds);
        setSelected(new Set(lds.map((l) => l.id)));
        setTemplateId(tpl[0]?.id ?? '');
        setErr(null);
      } catch (e) {
        setErr(errMessage(e));
      }
    })();
    void loadMessages();
  }, [tenantId, loadMessages]);

  // Poll message status for 60s after a send.
  function startPolling() {
    stopPolling();
    void loadMessages();
    let ticks = 0;
    pollRef.current = window.setInterval(() => {
      ticks += 1;
      void loadMessages();
      if (ticks >= 20) stopPolling();
    }, 3000);
  }
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }
  useEffect(() => stopPolling, []);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function send() {
    if (!tenantId || !templateId) {
      setErr('Pick a template');
      return;
    }
    const leadIds = [...selected];
    if (leadIds.length === 0) {
      setErr('Select at least one lead');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await api.send(tenantId, templateId, leadIds);
      setMsg(`Sent ${r.sent}/${r.total} · failed ${r.failed}`);
      startPolling();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const fmt = (m: SmsMessage) => {
    const d = m.deliveredAt ?? m.sentAt ?? m.createdAt;
    return d ? new Date(d).toLocaleTimeString() : '—';
  };

  return (
    <>
      {(err || msg) && (
        <div className={`banner ${err ? 'err' : 'ok'}`}>{err ?? msg}</div>
      )}

      <TenantPicker tenants={tenants} value={tenantId} onChange={setTenantId} />

      <div className="card">
        <h2>Campaign</h2>
        <label htmlFor="s-template">Template</label>
        <select
          id="s-template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {templates.length === 0 && <option value="">No templates</option>}
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label>Leads</label>
        <div className="checks">
          {leads.length === 0 && <span className="muted">No leads for this tenant.</span>}
          {leads.map((l) => (
            <label key={l.id}>
              <input
                type="checkbox"
                checked={selected.has(l.id)}
                onChange={() => toggle(l.id)}
              />
              {l.name ?? l.phone} <span className="muted">{l.phone}</span>
            </label>
          ))}
        </div>

        <button className="btn" onClick={send} disabled={busy || !tenantId}>
          Send campaign
        </button>
      </div>

      <div className="card">
        <h2>Results (live)</h2>
        <table>
          <thead>
            <tr>
              <th>To</th>
              <th>Body</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No messages yet.
                </td>
              </tr>
            )}
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{m.to}</td>
                <td className="muted">{m.body}</td>
                <td>
                  <span className={`pill ${m.status}`}>{m.status}</span>
                </td>
                <td className="muted">{fmt(m)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
