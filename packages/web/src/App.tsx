import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setSessionExpired(true);
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (prof && ['admin', 'sysadmin'].includes(prof.role)) {
          setProfile(prof as Profile);
        }
      }
    }
    setLoading(false);
  };

  const handleLogin = (prof: Profile) => {
    setProfile(prof);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  if (loading) {
    return null;
  }

  if (!profile) {
    return (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Login onLogin={handleLogin} initialError={sessionExpired ? 'Session expired. Please log in again.' : undefined} />
      </>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Dashboard profile={profile} onLogout={handleLogout} />
    </>
  );
}
