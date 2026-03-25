import { useState } from 'react';

/**
 * AuthGate — real email + password login form.
 *
 * On success the server sets an HttpOnly session cookie.
 * onContinue({ role, name, tenantId, staffId }) is called with the profile
 * returned by POST /api/v1/auth/login.
 */
export default function AuthGate({ onContinue }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch('/api/v1/auth/login', {
        method:      'POST',
        credentials: 'include',            // send/receive cookies
        headers:     { 'content-type': 'application/json' },
        body:        JSON.stringify({ email: email.trim(), password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      // data.profile = { staffId, role, tenantId, name }
      onContinue(data.profile);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-gate visible">
      <div className="auth-card">
        <h2>Sign in to workspace</h2>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail"
            type="email"
            className="auth-input"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label className="auth-label" htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            className="auth-input"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="action-btn primary"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
