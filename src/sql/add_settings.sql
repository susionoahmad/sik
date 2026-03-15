-- Settings table for organization identity and structure
-- Using flattened structure instead of generic key/value for better querying
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  org_name TEXT NOT NULL DEFAULT '05',
  org_type TEXT NOT NULL DEFAULT 'RT', -- RT, Perumahan, Paguyuban
  structure JSONB NOT NULL DEFAULT '[
    {"role": "Ketua", "name": "-"},
    {"role": "Sekretaris", "name": "-"},
    {"role": "Bendahara", "name": "-"}
  ]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON settings;
CREATE POLICY "Settings viewable by everyone" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings manageable by bendahara and ketua" ON settings;
CREATE POLICY "Settings manageable by bendahara and ketua" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('bendahara', 'ketua'))
);

-- Initial app settings
INSERT INTO settings (id, org_name, org_type, structure)
VALUES (
  'app_settings',
  '05',
  'RT',
  '[
    {"role": "Ketua", "name": "-"},
    {"role": "Sekretaris", "name": "-"},
    {"role": "Bendahara", "name": "-"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
