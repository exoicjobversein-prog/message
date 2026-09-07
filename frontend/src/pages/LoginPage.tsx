import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMessage } from '../api/client';

const STATS = [
  { value: '3.4×', label: 'Reply Rate' },
  { value: '68%', label: 'Time Saved' },
  { value: '12K+', label: 'Teams' },
];

const FEATURES = [
  { title: 'Hyper-Automation', desc: 'Multi-step AI-driven sequences' },
  { title: 'Unified Inbox', desc: 'Every channel in one place' },
  { title: 'AI Smart Reply', desc: 'Human-like responses instantly' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__brand">
        <div className="login__mark">Adora<span>7x</span><sup>™</sup></div>
        <h1 className="login__headline">
          Scale Outreach
          <br />
          with Intelligence
        </h1>
        <p className="login__sub">
          Multi-channel AI automation — Email, WhatsApp, Calls &amp; LinkedIn from
          one unified platform.
        </p>

        <div className="login__stats">
          {STATS.map((s) => (
            <div key={s.label} className="login__stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <ul className="login__features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </li>
          ))}
        </ul>

        <div className="login__badge">🛡 Enterprise-Grade Security</div>
      </aside>

      <main className="login__panel">
        <form className="login__form" onSubmit={onSubmit}>
          <h2>Welcome back</h2>
          <p className="login__panel-sub">Sign in to your workspace to continue.</p>

          {err && <div className="banner err">{err}</div>}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="login__pw">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login__pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="btn login__submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Adora 7X →'}
          </button>

          <p className="login__contact">
            Don&apos;t have an account? Contact your admin to get a workspace login.
          </p>
        </form>
      </main>
    </div>
  );
}
