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
-- RLS Policies for Multi-Tenant Data Isolation
-- Must be applied AFTER core schema migration

-- Security Definer Function: get current user's site_id from profiles table
CREATE OR REPLACE FUNCTION public.get_current_site_id()
RETURNS UUID AS $$
  SELECT site_id FROM public.profiles WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = 'public';

-- Security Definer Function: get current user's role from profiles table
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = 'public';

-- ============================================================================
-- SITES TABLE POLICIES
-- ============================================================================

-- Users can only view their assigned site
DROP POLICY IF EXISTS "Users can view their assigned site" ON public.sites;
CREATE POLICY "Users can view their assigned site"
ON public.sites
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR id = (SELECT public.get_current_site_id())
);

-- Only sysadmins can create/update/delete sites
DROP POLICY IF EXISTS "Sysadmins can manage all sites" ON public.sites;
CREATE POLICY "Sysadmins can manage all sites"
ON public.sites
FOR ALL
TO authenticated
USING (public.get_current_role() = 'sysadmin')
WITH CHECK (public.get_current_role() = 'sysadmin');

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view profiles within their site
DROP POLICY IF EXISTS "View profiles within same site" ON public.profiles;
CREATE POLICY "View profiles within same site"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR site_id = (SELECT public.get_current_site_id())
);

-- Users can update their own profile only
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Sysadmins can manage all profiles
DROP POLICY IF EXISTS "Sysadmins manage all profiles" ON public.profiles;
CREATE POLICY "Sysadmins manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.get_current_role() = 'sysadmin')
WITH CHECK (public.get_current_role() = 'sysadmin');

-- Allow inserting new profiles (for signup flow)
DROP POLICY IF EXISTS "Insert own profile on signup" ON public.profiles;
CREATE POLICY "Insert own profile on signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================================================
-- MACHINES TABLE POLICIES
-- ============================================================================

-- Site members can view their site's machines
DROP POLICY IF EXISTS "View site machines" ON public.machines;
CREATE POLICY "View site machines"
ON public.machines
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR site_id = (SELECT public.get_current_site_id())
);

-- Admins and sysadmins can manage machines for their site
DROP POLICY IF EXISTS "Manage site machines" ON public.machines;
CREATE POLICY "Manage site machines"
ON public.machines
FOR ALL
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR (
    site_id = (SELECT public.get_current_site_id())
    AND public.get_current_role() IN ('admin', 'sysadmin')
  )
)
WITH CHECK (
  public.get_current_role() = 'sysadmin'
  OR (
    site_id = (SELECT public.get_current_site_id())
    AND public.get_current_role() IN ('admin', 'sysadmin')
  )
);

-- ============================================================================
-- DAILY_REPORTS TABLE POLICIES
-- ============================================================================

-- Technicians and admins can view reports for their site
DROP POLICY IF EXISTS "View site reports" ON public.daily_reports;
CREATE POLICY "View site reports"
ON public.daily_reports
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR site_id = (SELECT public.get_current_site_id())
);

-- Technicians can insert reports for their site (with their own ID as technician)
DROP POLICY IF EXISTS "Insert site reports" ON public.daily_reports;
CREATE POLICY "Insert site reports"
ON public.daily_reports
FOR INSERT
TO authenticated
WITH CHECK (
  site_id = (SELECT public.get_current_site_id())
  AND technician_id = auth.uid()
  AND public.get_current_role() IN ('technician', 'admin', 'sysadmin')
);

-- Technicians can update their own reports within 2-hour window
DROP POLICY IF EXISTS "Update own reports within window" ON public.daily_reports;
CREATE POLICY "Update own reports within window"
ON public.daily_reports
FOR UPDATE
TO authenticated
USING (
  technician_id = auth.uid()
  AND public.get_current_role() IN ('technician', 'admin', 'sysadmin')
  AND site_id = (SELECT public.get_current_site_id())
  AND (EXTRACT(EPOCH FROM (now() - created_at)) / 3600) <= 2
)
WITH CHECK (
  technician_id = auth.uid()
  AND site_id = (SELECT public.get_current_site_id())
  AND (EXTRACT(EPOCH FROM (now() - created_at)) / 3600) <= 2
);

-- Admins can update any report in their site (for admin corrections)
DROP POLICY IF EXISTS "Admin update any site report" ON public.daily_reports;
CREATE POLICY "Admin update any site report"
ON public.daily_reports
FOR UPDATE
TO authenticated
USING (
  site_id = (SELECT public.get_current_site_id())
  AND public.get_current_role() IN ('admin', 'sysadmin')
)
WITH CHECK (
  site_id = (SELECT public.get_current_site_id())
  AND public.get_current_role() IN ('admin', 'sysadmin')
);

-- No DELETE policy on daily_reports — reports are immutable (audit trail)

-- ============================================================================
-- PENDING_SYNC TABLE POLICIES
-- ============================================================================

-- Users can manage their own pending sync entries
DROP POLICY IF EXISTS "Manage own pending sync" ON public.pending_sync;
CREATE POLICY "Manage own pending sync"
ON public.pending_sync
FOR ALL
TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- ============================================================================
-- MACHINE_COMPLIANCE TABLE POLICIES
-- ============================================================================

-- Site members can view compliance records for machines in their site
DROP POLICY IF EXISTS "View site compliance" ON public.machine_compliance;
CREATE POLICY "View site compliance"
ON public.machine_compliance
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR machine_id IN (
    SELECT id FROM public.machines WHERE site_id = (SELECT public.get_current_site_id())
  )
);

-- Admins can manage compliance records for their site's machines
DROP POLICY IF EXISTS "Manage site compliance" ON public.machine_compliance;
CREATE POLICY "Manage site compliance"
ON public.machine_compliance
FOR ALL
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR (
    machine_id IN (
      SELECT id FROM public.machines WHERE site_id = (SELECT public.get_current_site_id())
    )
    AND public.get_current_role() IN ('admin', 'sysadmin')
  )
)
WITH CHECK (
  public.get_current_role() = 'sysadmin'
  OR (
    machine_id IN (
      SELECT id FROM public.machines WHERE site_id = (SELECT public.get_current_site_id())
    )
    AND public.get_current_role() IN ('admin', 'sysadmin')
  )
);

-- ============================================================================
-- CORRECTIONS TABLE POLICIES
-- ============================================================================

-- Site members can view corrections for reports in their site
DROP POLICY IF EXISTS "View site corrections" ON public.corrections;
CREATE POLICY "View site corrections"
ON public.corrections
FOR SELECT
TO authenticated
USING (
  public.get_current_role() = 'sysadmin'
  OR report_id IN (
    SELECT id FROM public.daily_reports WHERE site_id = (SELECT public.get_current_site_id())
  )
);

-- Admins can create corrections for reports in their site
DROP POLICY IF EXISTS "Insert site corrections" ON public.corrections;
CREATE POLICY "Insert site corrections"
ON public.corrections
FOR INSERT
TO authenticated
WITH CHECK (
  admin_id = auth.uid()
  AND public.get_current_role() IN ('admin', 'sysadmin')
  AND report_id IN (
    SELECT id FROM public.daily_reports WHERE site_id = (SELECT public.get_current_site_id())
  )
);
-- Seed Data: GIAL Guwahati site, admin user, 29 ETD machines
-- Run after schema and RLS policies are in place

-- Insert GIAL site
INSERT INTO public.sites (name, code, location) VALUES
  ('Guwahati International Airport', 'GIAL', 'Guwahati, Assam');

-- Machines will be seeded via admin portal or direct SQL after site creation.
-- For local development, insert sample machines:
DO $$
DECLARE
  gial_id UUID;
BEGIN
  SELECT id INTO gial_id FROM public.sites WHERE code = 'GIAL';

  -- Passenger Terminal - Level 1 machines
  INSERT INTO public.machines (site_id, serial_number, model, location) VALUES
    (gial_id, 'SN-ION-001', 'IONSCAN 500DT', 'Passenger Terminal - Check-in Area A'),
    (gial_id, 'SN-ION-002', 'IONSCAN 500DT', 'Passenger Terminal - Check-in Area B'),
    (gial_id, 'SN-ION-003', 'IONSCAN 500DT', 'Passenger Terminal - Check-in Area C'),
    (gial_id, 'SN-ION-004', 'IONSCAN 500DT', 'Passenger Terminal - Security Hold Area 1'),
    (gial_id, 'SN-ION-005', 'IONSCAN 500DT', 'Passenger Terminal - Security Hold Area 2'),
    (gial_id, 'SN-ION-006', 'IONSCAN 500DT', 'Passenger Terminal - Boarding Gate 1-4'),
    (gial_id, 'SN-ION-007', 'IONSCAN 500DT', 'Passenger Terminal - Boarding Gate 5-8'),
    (gial_id, 'SN-ION-008', 'IONSCAN 500DT', 'Passenger Terminal - Transfer Desk'),
    (gial_id, 'SN-ION-009', 'IONSCAN 500DT', 'Passenger Terminal - Baggage Make-up Area'),
    (gial_id, 'SN-ION-010', 'IONSCAN 500DT', 'Passenger Terminal - Domestic Arrivals'),
    (gial_id, 'SN-ION-011', 'IONSCAN 500DT', 'Passenger Terminal - International Arrivals'),
    (gial_id, 'SN-ION-012', 'IONSCAN 500DT', 'Passenger Terminal - Mezzanine Level'),
    (gial_id, 'SN-ION-013', 'IONSCAN 500DT', 'Passenger Terminal - Staff Entry Point'),
    (gial_id, 'SN-ION-014', 'IONSCAN 500DT', 'Passenger Terminal - VIP Lounge Entry'),
    (gial_id, 'SN-ION-015', 'IONSCAN 500DT', 'Passenger Terminal - Oversized Baggage'),
    (gial_id, 'SN-ITM-001', 'Itemiser 4DX', 'Passenger Terminal - Check-in Area A'),
    (gial_id, 'SN-ITM-002', 'Itemiser 4DX', 'Passenger Terminal - Check-in Area B'),
    (gial_id, 'SN-ITM-003', 'Itemiser 4DX', 'Passenger Terminal - Security Hold 1'),
    (gial_id, 'SN-ITM-004', 'Itemiser 4DX', 'Passenger Terminal - Security Hold 2'),
    (gial_id, 'SN-ITM-005', 'Itemiser 4DX', 'Passenger Terminal - Boarding 1-4'),
    (gial_id, 'SN-ITM-006', 'Itemiser 4DX', 'Passenger Terminal - Boarding 5-8'),
    (gial_id, 'SN-ITM-007', 'Itemiser 4DX', 'Passenger Terminal - Domestic Arrivals'),
    (gial_id, 'SN-ITM-008', 'Itemiser 4DX', 'Passenger Terminal - International Arrivals');

  -- Cargo Terminal machines
  INSERT INTO public.machines (site_id, serial_number, model, location) VALUES
    (gial_id, 'SN-ION-016', 'IONSCAN 500DT', 'Cargo Terminal - Export Screening Bay 1'),
    (gial_id, 'SN-ION-017', 'IONSCAN 500DT', 'Cargo Terminal - Export Screening Bay 2'),
    (gial_id, 'SN-ION-018', 'IONSCAN 500DT', 'Cargo Terminal - Import Inspection'),
    (gial_id, 'SN-ITM-009', 'Itemiser 4DX', 'Cargo Terminal - Export Bay 1'),
    (gial_id, 'SN-ITM-010', 'Itemiser 4DX', 'Cargo Terminal - Export Bay 2'),
    (gial_id, 'SN-ITM-011', 'Itemiser 4DX', 'Cargo Terminal - Import Bay');

END $$;

-- Note: User profiles are created via the application signup flow
-- which triggers the handle_new_user function

-- Trigger: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, site_id, email, role)
  VALUES (
    NEW.id,
    (SELECT id FROM public.sites WHERE code = 'GIAL' LIMIT 1),
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
