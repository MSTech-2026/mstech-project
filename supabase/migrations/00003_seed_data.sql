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

  -- Passenger & Cargo Terminal ETDs from provided list
  INSERT INTO public.machines (site_id, serial_number, model, location) VALUES
    (gial_id, 'D1120234771', 'Itemiser 4DX', 'T1-INTERNATIONAL'),
    (gial_id, 'D1120234772', 'Itemiser 4DX', 'T2-New_Crash gate'),
    (gial_id, 'D1120234773', 'Itemiser 4DX', 'T1-SHA 4'),
    (gial_id, 'D0220244829', 'Itemiser 4DX', 'T1-SHA 3'),
    (gial_id, 'D0220244830', 'Itemiser 4DX', 'T1-Dom_Dep'),
    (gial_id, 'D1220244957', 'Itemiser 4DX', 'ASTI, CISF-Barr'),
    (gial_id, 'D1220244958', 'Itemiser 4DX', 'T1-SHA 1'),
    (gial_id, 'D1220244959', 'Itemiser 4DX', 'T1-BMA'),
    (gial_id, 'D0320254990', 'Itemiser 4DX', 'T1-SHA 2'),
    (gial_id, 'D0320254987', 'Itemiser 4DX', 'T1-Cargo Gate'),
    (gial_id, 'D0320254993', 'Itemiser 4DX', 'T2-SHA 1'),
    (gial_id, 'D0320254982', 'Itemiser 4DX', 'T2-SHA 4'),
    (gial_id, 'D0320254977', 'Itemiser 4DX', 'T2-ARRIVAL STAFF GATE'),
    (gial_id, 'D0320254986', 'Itemiser 4DX', 'T2-SHA 2'),
    (gial_id, 'D0320254974', 'Itemiser 4DX', 'T2-OOG'),
    (gial_id, 'D0320254975', 'Itemiser 4DX', 'T2-ATRS-1'),
    (gial_id, 'D0320254976', 'Itemiser 4DX', 'T2-BMA'),
    (gial_id, 'D0320254983', 'Itemiser 4DX', 'T1-AIRLINES 1'),
    (gial_id, 'D0320254973', 'Itemiser 4DX', 'T2-MEZZANINE'),
    (gial_id, 'D0320254984', 'Itemiser 4DX', 'T2-GOODS ENTRY GATE'),
    (gial_id, 'D0320254981', 'Itemiser 4DX', 'T2-AIR SIDE ENTRY'),
    (gial_id, 'D0320254979', 'Itemiser 4DX', 'T2-SHA 3'),
    (gial_id, 'D0320254991', 'Itemiser 4DX', 'T2 - Vehicle Cargo gate'),
    (gial_id, 'D0320254989', 'Itemiser 4DX', 'T2- Arr.Staff Gate'),
    (gial_id, 'D0320254985', 'Itemiser 4DX', 'T2- Random'),
    (gial_id, 'D0320254980', 'Itemiser 4DX', 'T2- SHA 5'),
    (gial_id, 'D0320254992', 'Itemiser 4DX', 'T2- SHA 6'),
    (gial_id, 'D0320254988', 'Itemiser 4DX', 'Null'),
    (gial_id, 'D0320254978', 'Itemiser 4DX', 'T2- LEVEL 3');

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
