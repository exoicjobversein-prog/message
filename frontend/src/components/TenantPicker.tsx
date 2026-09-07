import type { Tenant } from '../api/types';

interface Props {
  tenants: Tenant[];
  value: string;
  onChange: (id: string) => void;
}

export default function TenantPicker({ tenants, value, onChange }: Props) {
  return (
    <div className="card">
      <label htmlFor="tenant-picker">Tenant</label>
      <select
        id="tenant-picker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {tenants.length === 0 && <option value="">No tenants — create one first</option>}
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
