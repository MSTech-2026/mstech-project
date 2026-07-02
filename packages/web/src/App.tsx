import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      setLoading(false);
      return;
    }
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (prof && ['admin', 'sysadmin'].includes(prof.role)) {
        setProfile(prof as Profile);
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
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard profile={profile} onLogout={handleLogout} />;
}
