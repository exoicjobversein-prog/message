import { useCallback, useEffect, useState } from 'react';
import { api, errMessage } from '../api/client';
import type { SmsTemplate } from '../api/types';
import { useSelectedTenant, useTenants } from '../hooks';
import TenantPicker from '../components/TenantPicker';

export default function TemplatesPage() {
  const { tenants } = useTenants();
  const [tenantId, setTenantId] = useSelectedTenant(tenants);

  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setTemplates(await api.listTemplates(tenantId));
      setErr(null);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setBody('');
  }

  async function save() {
    if (!tenantId || !name.trim() || !body.trim()) {
      setErr('Name and body are required');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (editingId) {
        await api.updateTemplate(editingId, name.trim(), body.trim());
      } else {
        await api.createTemplate(tenantId, name.trim(), body.trim());
      }
      resetForm();
      setMsg('Saved');
      await load();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return;
    setBusy(true);
    try {
      await api.deleteTemplate(id);
      if (editingId === id) resetForm();
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

      <TenantPicker tenants={tenants} value={tenantId} onChange={setTenantId} />

      <div className="card">
        <h2>{editingId ? 'Edit template' : 'New template'}</h2>
        <label htmlFor="tpl-name">Name</label>
        <input
          id="tpl-name"
          value={name}
          placeholder="New Listing"
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="tpl-body">Body</label>
        <textarea
          id="tpl-body"
          value={body}
          placeholder="Hi {{name}}, new {{type}} in {{city}}. {{link}}"
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="hint">
          Use {'{{name}}'}, {'{{phone}}'}, and any lead field like {'{{city}}'},{' '}
          {'{{type}}'}, {'{{link}}'}.
        </div>
        <button className="btn" onClick={save} disabled={busy || !tenantId}>
          Save template
        </button>
        {editingId && (
          <button className="btn secondary" onClick={resetForm} disabled={busy}>
            Cancel edit
          </button>
        )}
      </div>

      <div className="card">
        <h2>Templates</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Body</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No templates.
                </td>
              </tr>
            )}
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="muted">{t.body}</td>
                <td>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setEditingId(t.id);
                      setName(t.name);
                      setBody(t.body);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => remove(t.id)}
                    disabled={busy}
                  >
                    Delete
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
