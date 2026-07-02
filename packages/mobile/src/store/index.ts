import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Profile, Machine, DailyReport, PendingReport } from '../types';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';

interface AppState {
  user: User | null;
  profile: Profile | null;
  machines: Machine[];
  todayReports: DailyReport[];
  pendingReports: PendingReport[];
  pendingCount: number;
  isOffline: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setMachines: (machines: Machine[]) => void;
  setTodayReports: (reports: DailyReport[]) => void;
  setPendingReports: (reports: PendingReport[]) => void;
  setPendingCount: (count: number) => void;
  setIsOffline: (offline: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchMachines: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  machines: [],
  todayReports: [],
  pendingReports: [],
  pendingCount: 0,
  isOffline: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setMachines: (machines) => set({ machines }),
  setTodayReports: (reports) => set({ todayReports: reports }),
  setPendingReports: (reports) => set({ pendingReports: reports }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setIsOffline: (offline) => set({ isOffline: offline }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    set({ isLoading: true });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      set({ isLoading: false });
      return;
    }
    if (user) {
      set({ user });
      await get().fetchProfile();
      await get().fetchMachines();
    }
    await get().refreshPendingCount();
    set({ isLoading: false });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) set({ profile: data as Profile });
  },

  fetchMachines: async () => {
    const profile = get().profile;
    if (!profile?.site_id) return;
    const { data } = await supabase
      .from('machines')
      .select('*')
      .eq('site_id', profile.site_id)
      .eq('is_active', true)
      .order('location');

    if (data) {
      set({ machines: data as Machine[] });
      const cacheData = data.map((m: Machine) => ({ id: m.id, data: JSON.stringify(m) }));
      await db.cacheMachines(cacheData);
    }
  },

  refreshPendingCount: async () => {
    const count = await db.getPendingReportCount();
    set({ pendingCount: count });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, machines: [], todayReports: [] });
  },
}));
