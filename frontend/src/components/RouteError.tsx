import { useRouteError } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  let detail = 'Unknown error';
  if (error instanceof Error) detail = error.message;
  else if (typeof error === 'string') detail = error;
  else if (error && typeof error === 'object') {
    const o = error as { message?: unknown; statusText?: unknown };
    detail = String(o.message ?? o.statusText ?? JSON.stringify(error));
  }

  return (
    <main>
      <div className="card">
        <h2>Something went wrong</h2>
        <div className="banner err">{detail}</div>
        <p className="muted">
          If the API is unreachable, check that the backend is deployed and the{' '}
          <code>/api</code> rewrite in <code>vercel.json</code> points at it.
        </p>
        <button className="btn" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    </main>
  );
}
