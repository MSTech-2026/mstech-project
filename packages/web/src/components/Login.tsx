import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface LoginProps {
  onLogin: (profile: Profile) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile || !['admin', 'sysadmin'].includes(profile.role)) {
        await supabase.auth.signOut();
        setError('Access restricted to Admin and SysAdmin roles.');
        setLoading(false);
        return;
      }

      onLogin(profile as Profile);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.header}>
          <h1 style={styles.title}>GIAL DSR</h1>
          <p style={styles.subtitle}>Admin Portal, Guwahati International Airport</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            autoFocus
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        {error && <p style={styles.error}>Error: {error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-0)',
    padding: '24px',
  },
  card: {
    backgroundColor: 'var(--bg-1)',
    padding: '48px 40px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)',
    width: '100%',
    maxWidth: '380px',
    border: '1px solid var(--border-default)',
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-0)',
    margin: '0 0 4px 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-3)',
    margin: 0,
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-3)',
    marginBottom: '6px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-2)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'var(--text-1)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s ease',
  },
  error: {
    color: 'var(--failed)',
    fontSize: '12px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '11px',
    backgroundColor: 'var(--accent-blue)',
    color: 'var(--accent-blue-fg)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.12s ease',
  },
};
