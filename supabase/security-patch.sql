-- Security Patch: Fix privilege escalation and profile INSERT policy
-- Run this in the Supabase SQL Editor against the live project
-- 2026-07-02

-- C2 FIX: Remove user-supplied role from signup trigger
-- Every new user defaults to 'technician' regardless of what they send in app_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, site_id, email, role)
  VALUES (
    NEW.id,
    (SELECT id FROM public.sites WHERE code = 'GIAL' LIMIT 1),
    NEW.email,
    'technician'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- H4 FIX: Lock down profile INSERT policy
-- Only allows INSERT with role=technician (cannot self-elevate)
DROP POLICY IF EXISTS "Insert own profile on signup" ON public.profiles;
CREATE POLICY "Insert own profile on signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND role = 'technician'
  AND site_id IS NOT NULL
);
