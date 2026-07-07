export interface Site {
  id: string;
  name: string;
  code: string;
  location?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  site_id: string;
  email: string;
  role: 'technician' | 'admin' | 'sysadmin';
  updated_at: string;
}

export interface Machine {
  id: string;
  site_id: string;
  serial_number: string;
  model: 'IONSCAN 500DT' | 'Itemiser 4DX';
  location: string;
  is_active: boolean;
  created_at: string;
}

export interface DailyReport {
  id: string;
  site_id: string;
  machine_id: string;
  technician_id: string;
  report_date: string;
  sample_count: number;
  evk_status: 'verified' | 'failed' | 'bypass';
  verification_failure_reason?: string;
  created_at: string;
}

export interface PendingReport {
  id: string;
  machine_id: string;
  report_date: string;
  sample_count: number;
  evk_status: 'verified' | 'failed' | 'bypass';
  verification_failure_reason?: string;
  status: 'pending' | 'synced' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface MachineCompliance {
  id: string;
  machine_id: string;
  last_wipe_test_date?: string;
  wipe_test_due_date?: string;
  license_expiry?: string;
  leak_check_status: 'ok' | 'warning' | 'overdue';
  updated_at: string;
}

export interface Correction {
  id: string;
  report_id: string;
  admin_id: string;
  reason: string;
  original_sample_count: number;
  original_evk_status: string;
  corrected_sample_count: number;
  corrected_evk_status: string;
  created_at: string;
}
