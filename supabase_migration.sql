-- Drop existing tables if they exist
DROP TABLE IF EXISTS pembayaran_tagihan;
DROP TABLE IF EXISTS meter_air;
DROP TABLE IF EXISTS tagihan_detail;
DROP TABLE IF EXISTS tagihan;
DROP TABLE IF EXISTS jenis_iuran;
DROP TABLE IF EXISTS warga;
DROP TABLE IF EXISTS iuran_warga;
DROP TABLE IF EXISTS kas_transaksi;
DROP TABLE IF EXISTS rekening_kas;
DROP TABLE IF EXISTS profiles;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('bendahara', 'ketua', 'sekretaris', 'warga')) NOT NULL DEFAULT 'warga',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), new.email, 'warga');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Warga table
CREATE TABLE warga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  no_rumah TEXT NOT NULL,
  nama_kepala_keluarga TEXT NOT NULL,
  alamat TEXT,
  no_hp TEXT,
  status TEXT DEFAULT 'aktif',
  status_hunian TEXT DEFAULT 'sendiri' CHECK (status_hunian IN ('sendiri', 'kontrak', 'kosong')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Jenis Iuran table
CREATE TABLE jenis_iuran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_iuran TEXT NOT NULL,
  nominal_default NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tagihan table
CREATE TABLE tagihan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warga_id UUID REFERENCES warga(id) ON DELETE CASCADE NOT NULL,
  bulan INT NOT NULL,
  tahun INT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('belum_bayar', 'lunas')) DEFAULT 'belum_bayar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tagihan Detail table
CREATE TABLE tagihan_detail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tagihan_id UUID REFERENCES tagihan(id) ON DELETE CASCADE NOT NULL,
  jenis_iuran_id UUID REFERENCES jenis_iuran(id) NOT NULL,
  jumlah NUMERIC NOT NULL DEFAULT 0
);

-- Iuran Warga (custom per-warga)
CREATE TABLE iuran_warga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warga_id UUID REFERENCES warga(id) ON DELETE CASCADE NOT NULL,
  jenis_iuran_id UUID REFERENCES jenis_iuran(id) ON DELETE CASCADE NOT NULL,
  nominal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(warga_id, jenis_iuran_id)
);

-- Rekening Kas table (multi-account: cash + bank)
CREATE TABLE rekening_kas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_rekening TEXT NOT NULL,
  jenis TEXT CHECK (jenis IN ('tunai', 'bank')) NOT NULL,
  saldo_awal NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Kas Transaksi table
CREATE TABLE kas_transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
  jenis TEXT CHECK (jenis IN ('masuk', 'keluar')) NOT NULL,
  kategori TEXT NOT NULL,
  keterangan TEXT,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  rekening_id UUID REFERENCES rekening_kas(id),
  transfer_ke_rekening_id UUID REFERENCES rekening_kas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Pembayaran Tagihan table
CREATE TABLE pembayaran_tagihan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tagihan_id UUID REFERENCES tagihan(id) ON DELETE CASCADE NOT NULL,
  kas_transaksi_id UUID REFERENCES kas_transaksi(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  metode_pembayaran TEXT DEFAULT 'tunai',
  bukti_transfer TEXT, -- URL to Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meter Air table
CREATE TABLE meter_air (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warga_id UUID REFERENCES warga(id) ON DELETE CASCADE NOT NULL,
  bulan INT NOT NULL,
  tahun INT NOT NULL,
  meter_awal NUMERIC NOT NULL DEFAULT 0,
  meter_akhir NUMERIC NOT NULL DEFAULT 0,
  pemakaian NUMERIC GENERATED ALWAYS AS (meter_akhir - meter_awal) STORED,
  tarif_per_m3 NUMERIC NOT NULL DEFAULT 0,
  is_late BOOLEAN DEFAULT FALSE,
  total NUMERIC GENERATED ALWAYS AS (GREATEST(0, (meter_akhir - meter_awal) - 10) * tarif_per_m3) STORED
);

-- RLS Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekening_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran_warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_air ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Warga
DROP POLICY IF EXISTS "Warga are viewable by everyone." ON warga;
DROP POLICY IF EXISTS "Warga are manageable by admins." ON warga;
CREATE POLICY "Warga are viewable by everyone." ON warga FOR SELECT USING (true);
CREATE POLICY "Warga are manageable by admins." ON warga FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('bendahara', 'sekretaris'))
);

-- Jenis Iuran
DROP POLICY IF EXISTS "Jenis iuran are viewable by everyone." ON jenis_iuran;
DROP POLICY IF EXISTS "Jenis iuran manageable by bendahara." ON jenis_iuran;
CREATE POLICY "Jenis iuran are viewable by everyone." ON jenis_iuran FOR SELECT USING (true);
CREATE POLICY "Jenis iuran manageable by bendahara." ON jenis_iuran FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Tagihan
DROP POLICY IF EXISTS "Tagihan viewable by everyone." ON tagihan;
DROP POLICY IF EXISTS "Tagihan manageable by bendahara." ON tagihan;
CREATE POLICY "Tagihan viewable by everyone." ON tagihan FOR SELECT USING (true);
CREATE POLICY "Tagihan manageable by bendahara." ON tagihan FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Tagihan Detail
DROP POLICY IF EXISTS "Tagihan detail viewable by everyone." ON tagihan_detail;
DROP POLICY IF EXISTS "Tagihan detail manageable by bendahara." ON tagihan_detail;
CREATE POLICY "Tagihan detail viewable by everyone." ON tagihan_detail FOR SELECT USING (true);
CREATE POLICY "Tagihan detail manageable by bendahara." ON tagihan_detail FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Iuran Warga
DROP POLICY IF EXISTS "Iuran warga viewable by everyone." ON iuran_warga;
DROP POLICY IF EXISTS "Iuran warga manageable by bendahara." ON iuran_warga;
CREATE POLICY "Iuran warga viewable by everyone." ON iuran_warga FOR SELECT USING (true);
CREATE POLICY "Iuran warga manageable by bendahara." ON iuran_warga FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Rekening Kas
DROP POLICY IF EXISTS "Rekening accessible by everyone" ON rekening_kas;
DROP POLICY IF EXISTS "Rekening manageable by bendahara" ON rekening_kas;
CREATE POLICY "Rekening accessible by everyone" ON rekening_kas FOR SELECT USING (true);
CREATE POLICY "Rekening manageable by bendahara" ON rekening_kas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Kas Transaksi
DROP POLICY IF EXISTS "Kas transactions are viewable by everyone." ON kas_transaksi;
DROP POLICY IF EXISTS "Kas transactions manageable by bendahara." ON kas_transaksi;
CREATE POLICY "Kas transactions are viewable by everyone." ON kas_transaksi FOR SELECT USING (true);
CREATE POLICY "Kas transactions manageable by bendahara." ON kas_transaksi FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Pembayaran Tagihan
DROP POLICY IF EXISTS "Pembayaran viewable by everyone." ON pembayaran_tagihan;
DROP POLICY IF EXISTS "Pembayaran manageable by bendahara." ON pembayaran_tagihan;
CREATE POLICY "Pembayaran viewable by everyone." ON pembayaran_tagihan FOR SELECT USING (true);
CREATE POLICY "Pembayaran manageable by bendahara." ON pembayaran_tagihan FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Meter Air
DROP POLICY IF EXISTS "Meter air viewable by everyone." ON meter_air;
DROP POLICY IF EXISTS "Meter air manageable by bendahara." ON meter_air;
CREATE POLICY "Meter air viewable by everyone." ON meter_air FOR SELECT USING (true);
CREATE POLICY "Meter air manageable by bendahara." ON meter_air FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bendahara')
);

-- Initial Data
INSERT INTO jenis_iuran (nama_iuran, nominal_default) VALUES
('kebersihan', 25000),
('keamanan', 30000),
('kas_rt', 10000),
('air_abodemen', 20000),
('kelebihan_air', 0),
('iuran_rumah_kosong', 30000),
('denda_air', 25000)
ON CONFLICT DO NOTHING;

-- Initial Rekening
INSERT INTO rekening_kas (nama_rekening, jenis, saldo_awal) VALUES
('Kas Tunai', 'tunai', 0)
ON CONFLICT DO NOTHING;

-- Storage Setup
-- Note: Storage buckets cannot be created via standard SQL in some Supabase environments without extensions.
-- This SQL assumes the storage schema is available.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pembayaran', 'pembayaran', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pembayaran');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pembayaran' AND auth.role() = 'authenticated');
