<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
    <!-- Header/Logo -->
    <div class="w-full max-w-xl mb-8 flex flex-col items-center">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black shadow-xl shadow-primary-500/20 mb-4 scale-110 text-2xl uppercase">
        {{ (settingsStore.organizationLabel || 'S')[0] }}
      </div>
      <h2 class="text-3xl font-black text-slate-900 tracking-tight uppercase">{{ settingsStore.appTitle }}</h2>
      <p class="text-sm font-bold text-primary-600 tracking-widest uppercase mt-1">Presensi Rapat {{ settingsStore.organizationLabel || settingsStore.settings.orgType }}</p>
    </div>

    <!-- Main Card -->
    <div class="w-full max-w-xl">
      <div v-if="loading" class="card flex flex-col items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p class="text-slate-500 font-medium">Memuat informasi rapat...</p>
      </div>

      <div v-else-if="error" class="card border-red-100 bg-red-50/30 text-center py-12">
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class="text-xl font-bold text-red-800 mb-2">Mohon Maaf</h3>
        <p class="text-red-600 font-medium mb-6">Informasi rapat belum dapat dimuat saat ini. Hubungi pengurus {{ settingsStore.organizationLabel || 'setempat' }} jika kendala berlanjut.</p>
        <button @click="fetchData" class="btn-primary">Coba Lagi</button>
      </div>

      <div v-else-if="success" class="card border-green-100 bg-green-50/30 text-center py-16 animate-in fade-in zoom-in duration-500 shadow-xl border-none ring-1 ring-green-100">
        <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-green-200">✓</div>
        <h3 class="text-2xl font-black text-slate-900 mb-2">Terima Kasih!</h3>
        <p class="text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
          Data presensi Anda telah berhasil dikirimkan ke pengurus {{ settingsStore.organizationLabel }}.
        </p>
        <div class="mt-8 pt-6 border-t border-green-100 w-full px-4 text-center">
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informasi Rapat</p>
          <p class="text-sm font-bold text-slate-700 mt-1 uppercase">{{ agenda?.judul }}</p>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Agenda Info -->
        <div class="card overflow-hidden !p-0 shadow-lg border-none ring-1 ring-slate-200">
          <div class="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white relative overflow-hidden">
            <div class="absolute right-0 top-0 w-32 h-32 bg-white/5 -rotate-12 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <p class="text-xs font-bold text-primary-400 uppercase tracking-widest mb-1">Agenda Rapat</p>
            <h3 class="text-2xl font-black leading-tight">{{ agenda?.judul }}</h3>
            <div class="mt-6 grid grid-cols-2 gap-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white/10 rounded-lg shrink-0"><CalendarIcon class="w-4 h-4 text-primary-400" /></div>
                <div class="min-w-0">
                  <p class="text-[10px] text-slate-400 font-bold uppercase">Tanggal</p>
                  <p class="text-sm font-bold truncate">{{ formatDate(agenda?.tanggal || '') }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white/10 rounded-lg shrink-0"><ClockIcon class="w-4 h-4 text-primary-400" /></div>
                <div class="min-w-0">
                  <p class="text-[10px] text-slate-400 font-bold uppercase">Waktu</p>
                  <p class="text-sm font-bold truncate">{{ agenda?.waktu }} WIB</p>
                </div>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-3">
              <div class="p-2 bg-white/10 rounded-lg shrink-0"><MapPinIcon class="w-4 h-4 text-primary-400" /></div>
              <div class="min-w-0">
                <p class="text-[10px] text-slate-400 font-bold uppercase">Lokasi</p>
                <p class="text-sm font-bold truncate">{{ agenda?.lokasi }}</p>
              </div>
            </div>
          </div>
          
          <div class="p-6 bg-white shrink-0">
            <h4 class="text-sm font-bold text-slate-800 mb-2 uppercase tracking-tight">Keterangan:</h4>
            <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{{ agenda?.deskripsi || 'Tidak ada keterangan khusus.' }}</p>
          </div>
        </div>

        <!-- Attendance Form -->
        <form @submit.prevent="handleSubmit" class="card shadow-2xl border-none ring-1 ring-slate-200 p-8 flex flex-col gap-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-primary-50/50 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          
          <!-- Selection -->
          <div class="space-y-3">
            <label class="block text-sm font-black text-slate-800 uppercase tracking-widest">Pilih Nama / No. Rumah</label>
            <div class="relative">
              <select v-model="form.warga_id" class="input-field py-3.5 pr-10 appearance-none font-bold text-slate-700 bg-slate-50 border-slate-200 focus:bg-white" required>
                <option value="" disabled>-- Silakan pilih --</option>
                <option v-for="w in wargaList" :key="w.id" :value="w.id">
                  {{ w.no_rumah }} - {{ w.nama_kepala_keluarga }}
                </option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDownIcon class="w-5 h-5" />
              </div>
            </div>
            <p class="text-[10px] text-slate-500 italic mt-1 font-medium">*Silakan hubungi Sekretaris jika nama Anda tidak ada di daftar.</p>
          </div>

          <!-- Status -->
          <div class="space-y-3">
            <label class="block text-sm font-black text-slate-800 uppercase tracking-widest">Rencana Kehadiran</label>
            <div class="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                @click="form.status = 'hadir'"
                class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-black group"
                :class="form.status === 'hadir' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'"
              >
                <UserCheckIcon class="w-6 h-6" :class="form.status === 'hadir' ? 'scale-110' : 'group-hover:scale-110 opacity-50'" />
                <span class="text-xs">HADIR</span>
              </button>
              <button 
                type="button" 
                @click="form.status = 'tidak_hadir'"
                class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-black group"
                :class="form.status === 'tidak_hadir' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'"
              >
                <UserXIcon class="w-6 h-6" :class="form.status === 'tidak_hadir' ? 'scale-110' : 'group-hover:scale-110 opacity-50'" />
                <span class="text-xs">ABSEN</span>
              </button>
            </div>
          </div>

          <!-- Alasan (if absent) -->
          <div v-show="form.status === 'tidak_hadir'" class="space-y-2 animate-in slide-in-from-top-4 duration-300">
            <label class="block text-sm font-black text-slate-800 uppercase tracking-widest">Alasan Tidak Hadir</label>
            <textarea v-model="form.alasan" class="input-field font-medium h-24 p-4 border-slate-200 bg-slate-50 focus:bg-white" placeholder="Contoh: Ada keperluan keluarga di luar kota..." :required="form.status === 'tidak_hadir'"></textarea>
          </div>

          <!-- Aspirasi -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-black text-slate-800 uppercase tracking-widest">Masukan / Aspirasi</label>
            </div>
            <textarea v-model="form.masukan_aspirasi" class="input-field font-medium h-28 p-4 border-slate-200 bg-slate-50 focus:bg-white" placeholder="Tuliskan masukan atau hal yang ingin disampaikan jika tidak bisa hadir langsung..."></textarea>
            <p class="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-primary-200 pl-3 py-1 bg-primary-50/30 rounded-r-lg">
              "Kami sangat mengapresiasi masukan {{ settingsStore.residentLabel.toLowerCase() }} meskipun berhalangan hadir langsung dalam rapat."
            </p>
          </div>

          <!-- Submit -->
          <div class="pt-4">
            <button 
              type="submit" 
              class="w-full bg-slate-900 border-none hover:bg-black text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              :disabled="submitting"
            >
              {{ submitting ? 'Mengirim Data...' : 'KIRIM PRESENSI' }}
              <SendIcon v-if="!submitting" class="w-5 h-5 text-primary-400" />
            </button>
          </div>
        </form>
      </div>

      <!-- Footer Info -->
      <footer class="mt-12 text-center text-slate-400 pb-8">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">SIK - Sistem Informasi Digital {{ settingsStore.organizationLabel }}</p>
        <p class="text-[9px] font-medium opacity-60">Penyampaian aspirasi {{ settingsStore.residentLabel.toLowerCase() }} menjadi bagian penting dalam kemajuan wilayah.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { agendaService, type Agenda } from '@/services/agendaService'
import { useSettingsStore } from '@/stores/settings'
import { 
  Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon,
  ChevronDown as ChevronDownIcon, UserCheck as UserCheckIcon, UserX as UserXIcon,
  Send as SendIcon
} from 'lucide-vue-next'
import type { Warga } from '@/types'

const route = useRoute()
const settingsStore = useSettingsStore()

const loading = ref(true)
const submitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

const agenda = ref<Agenda | null>(null)
const wargaList = ref<Warga[]>([])

const form = ref({
  warga_id: '',
  status: 'hadir' as 'hadir' | 'tidak_hadir',
  alasan: '',
  masukan_aspirasi: ''
})

const fetchData = async () => {
  loading.value = true
  error.value = null
  const id = route.params.id as string

  try {
    // 1. Fetch Agenda
    const agendaData = await agendaService.getAgendaById(id)
    if (!agendaData) {
      error.value = 'Agenda rapat tidak ditemukan atau sudah dihapus.'
      return
    }
    
    if (agendaData.status === 'draft') {
      error.value = 'Agenda ini belum dipublikasikan.'
      return
    }
    
    agenda.value = agendaData

    // 2. Fetch Warga for dropdown
    const { data: wargaData, error: wargaErr } = await supabase
      .from('warga')
      .select('*')
      .eq('status', 'aktif')
      .order('no_rumah', { ascending: true })
    
    if (wargaErr) throw wargaErr
    wargaList.value = (wargaData || []).sort((a, b) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))

  } catch (e: any) {
    console.error('Fetch error:', e)
    error.value = `Gagal memuat data: ${e.message || 'Koneksi bermasalah'}. Pastikan agenda sudah dipublikasikan.`
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date(dateStr))
}


const handleSubmit = async () => {
  if (!agenda.value || !form.value.warga_id) return
  
  submitting.value = true
  try {
    const selectedWarga = wargaList.value.find(w => w.id === form.value.warga_id)
    
    await agendaService.submitAbsensi({
      agenda_id: agenda.value.id,
      warga_id: form.value.warga_id,
      nama_warga: selectedWarga?.nama_kepala_keluarga || 'Unknown',
      no_rumah: selectedWarga?.no_rumah || null,
      status: form.value.status,
      alasan: form.value.status === 'tidak_hadir' ? form.value.alasan : null,
      masukan_aspirasi: form.value.masukan_aspirasi || null
    })
    
    success.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    console.error(e)
    if (e.code === '23505') {
       alert('Anda sudah mengisi presensi untuk rapat ini.')
    } else {
       alert('Gagal mengirim presensi: ' + (e.message || 'Unknown error'))
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!settingsStore.initialized) {
    await settingsStore.fetchSettings()
  }
  fetchData()
})
</script>

<style scoped>
.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}
</style>
