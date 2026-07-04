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
