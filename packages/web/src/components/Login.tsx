import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface LoginProps {
  onLogin: (profile: Profile) => void;
  initialError?: string;
}

export function Login({ onLogin, initialError }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
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
    <div className="login-screen">
      <div className="login-decor login-decor-1">&#9992;</div>
      <div className="login-decor login-decor-2">&#127758;</div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <h1 className="login-title">GIAL DSR</h1>
          <p className="login-subtitle">Admin Portal, Guwahati International Airport</p>
        </div>

        <div className="login-field">
          <label htmlFor="login-email" className="login-label">Email</label>
          <div className="login-input-wrapper">
            <span className="login-input-icon">&#9993;</span>
            <input id="login-email" type="email" className="login-input" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
        </div>

        <div className="login-field">
          <label htmlFor="login-password" className="login-label">Password</label>
          <div className="login-input-wrapper">
            <span className="login-input-icon">&#128274;</span>
            <input id="login-password" type="password" className="login-input" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        {error && (
          <div className="login-error animate-shake" role="alert">
            <span className="sr-only">Error: </span>
            <span style={{ fontSize: '18px' }}>&#9888;</span> {error}
          </div>
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Secured by Supabase &middot; GIAL Airport Authority</span>
        </div>
      </form>
    </div>
  );
}
