import { useState, FormEvent } from 'react';
import { useStore } from '../store';

interface Props {
  needsSetup: boolean;
}

export default function Login({ needsSetup }: Props) {
  const { login, setup } = useStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (needsSetup && password !== confirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      if (needsSetup) {
        await setup(password);
      } else {
        await login(password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Einloggen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#4f86c6" />
            <rect x="8" y="14" width="24" height="4" rx="2" fill="white" opacity="0.9" />
            <rect x="8" y="22" width="16" height="4" rx="2" fill="white" opacity="0.6" />
          </svg>
        </div>
        <h1>simplePlan</h1>
        <p className="login-subtitle">
          {needsSetup ? 'Erstes Passwort festlegen' : 'Bitte einloggen'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={needsSetup ? 'Neues Passwort...' : 'Passwort eingeben...'}
              autoFocus
              required
            />
          </div>
          {needsSetup && (
            <div className="form-group">
              <label htmlFor="confirm">Passwort bestätigen</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Passwort wiederholen..."
                required
              />
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : needsSetup ? 'Passwort festlegen' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
