-- Agenda Rapat table
CREATE TABLE IF NOT EXISTS agenda_rapat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  tanggal DATE NOT NULL,
  waktu TIME NOT NULL,
  lokasi TEXT NOT NULL,
  deskripsi TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'finished')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Absensi Rapat table
CREATE TABLE IF NOT EXISTS absensi_rapat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agenda_rapat(id) ON DELETE CASCADE NOT NULL,
  warga_id UUID REFERENCES warga(id) ON DELETE SET NULL,
  nama_warga TEXT NOT NULL,
  no_rumah TEXT,
  status TEXT CHECK (status IN ('hadir', 'tidak_hadir')) NOT NULL,
  alasan TEXT,
  masukan_aspirasi TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  is_pra_absensi BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agenda_id, warga_id)
);

-- RLS
ALTER TABLE agenda_rapat ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi_rapat ENABLE ROW LEVEL SECURITY;

-- Agenda Policies
DROP POLICY IF EXISTS "Anyone can view published agendas" ON agenda_rapat;
CREATE POLICY "Anyone can view published agendas" ON agenda_rapat FOR SELECT USING (true);

DROP POLICY IF EXISTS "Management can do everything with agendas" ON agenda_rapat;
CREATE POLICY "Management can do everything with agendas" ON agenda_rapat FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sekretaris', 'ketua', 'bendahara'))
);

-- Absensi Policies
DROP POLICY IF EXISTS "Anyone can see attendance" ON absensi_rapat;
CREATE POLICY "Anyone can see attendance" ON absensi_rapat FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can submit attendance" ON absensi_rapat;
CREATE POLICY "Anyone can submit attendance" ON absensi_rapat FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Management can manage attendance" ON absensi_rapat;
CREATE POLICY "Management can manage attendance" ON absensi_rapat FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sekretaris', 'ketua', 'bendahara'))
);
