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
    'technician'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
