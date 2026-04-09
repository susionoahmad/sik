import { supabase } from './supabase'

export interface Agenda {
  id: string
  judul: string
  tanggal: string
  waktu: string
  lokasi: string
  deskripsi: string | null
  status: 'draft' | 'published' | 'finished'
  created_at: string
  created_by?: string
}

export interface Absensi {
  id: string
  agenda_id: string
  warga_id: string | null
  nama_warga: string
  no_rumah: string | null
  status: 'hadir' | 'tidak_hadir'
  alasan: string | null
  masukan_aspirasi: string | null
  is_final: boolean
  is_pra_absensi: boolean
  created_at: string
}

export const agendaService = {
  async getAgendas() {
    const { data, error } = await supabase
      .from('agenda_rapat')
      .select('*')
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as Agenda[]
  },

  async getPublishedAgendas() {
    const { data, error } = await supabase
      .from('agenda_rapat')
      .select('*')
      .eq('status', 'published')
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as Agenda[]
  },

  async getAgendaById(id: string) {
    const { data, error } = await supabase
      .from('agenda_rapat')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Agenda
  },

  async createAgenda(agenda: Omit<Agenda, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('agenda_rapat')
      .insert([agenda])
      .select()
      .single()
    if (error) throw error
    return data as Agenda
  },

  async updateAgenda(id: string, updates: Partial<Agenda>) {
    const { data, error } = await supabase
      .from('agenda_rapat')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Agenda
  },

  async deleteAgenda(id: string) {
    const { error } = await supabase
      .from('agenda_rapat')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getAbsensiByAgenda(agendaId: string) {
    const { data, error } = await supabase
      .from('absensi_rapat')
      .select('*')
      .eq('agenda_id', agendaId)
    if (error) throw error
    return data as Absensi[]
  },

  async submitAbsensi(absensi: Omit<Absensi, 'id' | 'created_at' | 'is_final' | 'is_pra_absensi'>) {
    const { data, error } = await supabase
      .from('absensi_rapat')
      .upsert([
        { 
          ...absensi, 
          is_final: false, 
          is_pra_absensi: true 
        }
      ], { onConflict: 'agenda_id,warga_id' })
      .select()
      .single()
    if (error) throw error
    return data as Absensi
  },

  async updateAbsensiStatus(id: string, updates: Partial<Absensi>) {
    const { data, error } = await supabase
      .from('absensi_rapat')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Absensi
  }
}
