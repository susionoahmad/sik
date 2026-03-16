-- Migration for Secretary Module

-- Surat table (Incoming and Outgoing)
CREATE TABLE IF NOT EXISTS surat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_surat TEXT,
  judul_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  tanggal_diterima DATE, -- For incoming mail
  pengirim TEXT NOT NULL,
  penerima TEXT NOT NULL,
  perihal TEXT,
  kategori TEXT CHECK (kategori IN ('masuk', 'keluar')) NOT NULL,
  file_url TEXT, -- URL to Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Surat Template table
CREATE TABLE IF NOT EXISTS surat_template (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_template TEXT NOT NULL,
  konten_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notulen table
CREATE TABLE IF NOT EXISTS notulen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul_rapat TEXT NOT NULL,
  tanggal_rapat DATE NOT NULL,
  lokasi TEXT,
  pimpinan_rapat TEXT,
  notulis TEXT,
  peserta TEXT[], -- Array of names or IDs
  agenda TEXT,
  pembahasan TEXT,
  keputusan TEXT,
  file_url TEXT, -- URL to Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for new tables
ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE notulen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Surat viewable by everyone" ON surat;
DROP POLICY IF EXISTS "Surat Template viewable by everyone" ON surat_template;
DROP POLICY IF EXISTS "Notulen viewable by everyone" ON notulen;
DROP POLICY IF EXISTS "Surat manageable by secretary" ON surat;
DROP POLICY IF EXISTS "Surat Template manageable by secretary" ON surat_template;
DROP POLICY IF EXISTS "Notulen manageable by secretary" ON notulen;

-- Select policy (everyone can see)
CREATE POLICY "Surat viewable by everyone" ON surat FOR SELECT USING (true);
CREATE POLICY "Surat Template viewable by everyone" ON surat_template FOR SELECT USING (true);
CREATE POLICY "Notulen viewable by everyone" ON notulen FOR SELECT USING (true);

-- Active management by secretary, bendahara, and ketua
CREATE POLICY "Surat manageable by secretary" ON surat FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sekretaris', 'bendahara', 'ketua'))
);
CREATE POLICY "Surat Template manageable by secretary" ON surat_template FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sekretaris', 'bendahara', 'ketua'))
);
CREATE POLICY "Notulen manageable by secretary" ON notulen FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sekretaris', 'bendahara', 'ketua'))
);
