-- Migration to integrate Notulen with Agenda Rapat
ALTER TABLE notulen ADD COLUMN IF NOT EXISTS agenda_id UUID REFERENCES agenda_rapat(id) ON DELETE SET NULL;
ALTER TABLE notulen ADD COLUMN IF NOT EXISTS peserta_warga UUID[] DEFAULT '{}';
ALTER TABLE notulen ADD COLUMN IF NOT EXISTS peserta_luar TEXT[] DEFAULT '{}';

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_notulen_agenda_id ON notulen(agenda_id);
