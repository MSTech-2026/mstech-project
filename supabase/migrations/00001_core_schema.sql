-- GIAL DSR System: Core Schema Migration
-- Run with: supabase db push or supabase migration up

-- 1. Sites Master Table
CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_site_code_uppercase CHECK (code = UPPER(code))
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 2. User Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_authorized_role CHECK (role IN ('technician', 'admin', 'sysadmin'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_site_id ON public.profiles(site_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 3. Equipment Inventory Table
CREATE TABLE public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    serial_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    location TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_machine_model CHECK (model IN ('IONSCAN 500DT', 'Itemiser 4DX'))
);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_machines_site_active ON public.machines(site_id) WHERE (is_active = TRUE);
CREATE INDEX idx_machines_serial ON public.machines(serial_number);

-- 4. Daily Reports Table (transactional, immutable)
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
    technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sample_count INTEGER NOT NULL,
    evk_status TEXT NOT NULL,
    verification_failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_report_sample_count CHECK (sample_count >= 0),
    CONSTRAINT chk_report_evk_status CHECK (evk_status IN ('verified', 'failed', 'bypass')),
    CONSTRAINT uq_machine_report_date_per_site UNIQUE (site_id, machine_id, report_date)
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_daily_reports_composite ON public.daily_reports(site_id, report_date, machine_id);
CREATE INDEX idx_daily_reports_technician ON public.daily_reports(technician_id, report_date);

-- 5. Pending Sync Queue (for offline reconciliation)
CREATE TABLE public.pending_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sample_count INTEGER NOT NULL,
    evk_status TEXT NOT NULL,
    verification_failure_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pending_sample_count CHECK (sample_count >= 0),
    CONSTRAINT chk_pending_evk_status CHECK (evk_status IN ('verified', 'failed', 'bypass')),
    CONSTRAINT chk_pending_status CHECK (status IN ('pending', 'synced', 'failed'))
);

ALTER TABLE public.pending_sync ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pending_sync_technician ON public.pending_sync(technician_id, status);

-- 6. Machine Compliance Table (wipe tests, licenses for Ni-63 sources)
CREATE TABLE public.machine_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
    last_wipe_test_date DATE,
    wipe_test_due_date DATE,
    license_expiry DATE,
    leak_check_status TEXT DEFAULT 'ok',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_leak_check CHECK (leak_check_status IN ('ok', 'warning', 'overdue')),
    CONSTRAINT uq_machine_compliance UNIQUE (machine_id)
);

ALTER TABLE public.machine_compliance ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_machine_compliance_due ON public.machine_compliance(wipe_test_due_date);

-- 7. Corrections Table (admin amendments to immutable reports)
CREATE TABLE public.corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE RESTRICT,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    original_sample_count INTEGER NOT NULL,
    original_evk_status TEXT NOT NULL,
    corrected_sample_count INTEGER NOT NULL,
    corrected_evk_status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_correction_sample_count CHECK (corrected_sample_count >= 0),
    CONSTRAINT chk_correction_evk_status CHECK (corrected_evk_status IN ('verified', 'failed', 'bypass'))
);

ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_corrections_report ON public.corrections(report_id);
