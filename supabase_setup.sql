-- ECOGREEN SO TRACKING SYSTEM - SUPABASE SETUP SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  force_password_change BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.so_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  so_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  dangerous_type TEXT NOT NULL,
  etd DATE NOT NULL,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'done')),
  manual_priority TEXT DEFAULT NULL CHECK (manual_priority IN ('HIGH', 'MEDIUM', 'NORMAL', NULL)),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  so_id UUID REFERENCES public.so_records ON DELETE CASCADE NOT NULL,
  modifier_id UUID REFERENCES auth.users ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  comment TEXT NOT NULL,
  attachment_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.so_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_logs ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES (Idempotent)

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Customers Policies
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- SO Records Policies
DROP POLICY IF EXISTS "Users can view own SO" ON public.so_records;
CREATE POLICY "Users can view own SO" ON public.so_records FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can insert own SO" ON public.so_records;
CREATE POLICY "Users can insert own SO" ON public.so_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own SO or Admin can update any" ON public.so_records;
CREATE POLICY "Users can update own SO or Admin can update any" ON public.so_records FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- Shipment Logs Policies
DROP POLICY IF EXISTS "Users can view logs for their SO" ON public.shipment_logs;
CREATE POLICY "Users can view logs for their SO" ON public.shipment_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.so_records WHERE id = so_id AND (user_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Users can insert logs for their SO" ON public.shipment_logs;
CREATE POLICY "Users can insert logs for their SO" ON public.shipment_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.so_records WHERE id = so_id AND (user_id = auth.uid() OR is_admin()))
);

-- 5. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('templates', 'templates', false), ('attachments', 'attachments', true), ('exports', 'exports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Idempotent)
DROP POLICY IF EXISTS "Admin manages templates" ON storage.objects;
CREATE POLICY "Admin manages templates" ON storage.objects FOR ALL USING (bucket_id = 'templates' AND is_admin());
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
CREATE POLICY "Anyone can view attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- 6. SET UP INITIAL ADMIN
-- To create the initial admin, FIRST create a user in Supabase Auth (Email: admin@ecogreen.com, Pass: admin123)
-- Then, note the UUID of that user and run the query below:
-- INSERT INTO public.profiles (id, full_name, role, force_password_change) 
-- VALUES ('YOUR_USER_UUID', 'System Administrator', 'admin', TRUE)
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', force_password_change = TRUE;

-- AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
