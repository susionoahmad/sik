<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-slate-800">
      <div>
        <h2 class="text-2xl font-bold">Notulen Rapat</h2>
        <p class="text-slate-500 text-sm">Dokumentasi hasil rapat dan keputusan bersama.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-5 h-5 text-indigo-400" />
        <span>Buat Notulen</span>
      </button>
    </div>

    <!-- Notulen Timeline/List -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-32 bg-slate-50"></div>
    </div>

    <div v-else-if="notulens.length === 0" class="card flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
      <BookOpenIcon class="w-12 h-12 opacity-20" />
      <p class="italic">Belum ada catatan rapat.</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="item in notulens" :key="item.id" class="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-primary-100 transition-all flex flex-col md:flex-row gap-6">
        <div class="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[100px]">
          <span class="text-2xl font-black text-primary-600 leading-none">{{ getDay(item.tanggal_rapat) }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{{ getMonth(item.tanggal_rapat) }}</span>
          <span class="text-[10px] font-bold text-slate-300 mt-0.5">{{ getYear(item.tanggal_rapat) }}</span>
        </div>

        <div class="flex-1 space-y-2">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
              {{ item.judul_rapat }}
            </h3>
            <div class="flex gap-2">
              <button @click="openEditModal(item)" class="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <EditIcon class="w-4 h-4" />
              </button>
              <button @click="handleDelete(item.id)" class="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div class="flex items-center gap-1.5">
              <MapPinIcon class="w-3.5 h-3.5 text-primary-500" />
              {{ item.lokasi || 'Lokal' }}
            </div>
            <div class="flex items-center gap-1.5">
              <UserIcon class="w-3.5 h-3.5 text-primary-500" />
              {{ item.pimpinan_rapat }}
            </div>
            <div class="flex items-center gap-1.5">
              <UsersIcon class="w-3.5 h-3.5 text-primary-500" />
              {{ (item.peserta_warga?.length || 0) + (item.peserta_luar?.length || 0) }} Peserta
            </div>
            <div v-if="item.agenda_id" class="flex items-center gap-1.5 text-green-600">
              <LinkIcon class="w-3.5 h-3.5" />
              Terhubung Agenda
            </div>
          </div>

          <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <strong>Keputusan:</strong> {{ item.keputusan }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-slate-100">
        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="text-xl font-black text-slate-800 tracking-tight">
            {{ editingId ? 'Edit Notulen' : 'Buat Notulen Baru' }}
          </h3>
          <button @click="showModal = false" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-8 py-8">
          <form @submit.prevent="handleSubmit" class="space-y-8">
            <!-- Agenda Selector -->
            <div v-if="!editingId" class="space-y-3 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
              <div class="flex items-center gap-2 mb-2">
                <LinkIcon class="w-4 h-4 text-indigo-500" />
                <label class="text-xs font-black text-indigo-600 uppercase tracking-wider">Hubungkan dengan Agenda Rapat (Opsional)</label>
              </div>
              <select 
                v-model="form.agenda_id" 
                @change="handleAgendaSelect"
                class="input-field w-full bg-white font-bold text-sm"
              >
                <option value="">-- Pilih Agenda --</option>
                <option v-for="a in agendaList" :key="a.id" :value="a.id">
                  {{ formatDate(a.tanggal) }} - {{ a.judul }}
                </option>
              </select>
              <p class="text-[10px] text-indigo-400 font-medium">Memilih agenda akan otomatis mengisi data rapat dan memvalidasi kehadiran warga.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Judul Rapat</label>
                <input v-model="form.judul_rapat" type="text" class="input-field w-full font-bold" required placeholder="Contoh: Rapat Koordinasi Keamanan" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Tanggal Rapat</label>
                <input v-model="form.tanggal_rapat" type="date" class="input-field w-full" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Lokasi</label>
                <input v-model="form.lokasi" type="text" class="input-field w-full" placeholder="Rumah Pak RT" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Pimpinan Rapat</label>
                <input v-model="form.pimpinan_rapat" type="text" class="input-field w-full" placeholder="Ketua RT" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Notulis</label>
                <input v-model="form.notulis" type="text" class="input-field w-full" placeholder="Sekretaris" />
              </div>
            </div>

            <!-- Participants Tab Switcher -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Peserta Hadir</label>
                <div class="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    @click="activeParticipantTab = 'warga'"
                    class="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                    :class="activeParticipantTab === 'warga' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'"
                  >
                    Data Warga ({{ form.peserta_warga.length }})
                  </button>
                  <button 
                    type="button"
                    @click="activeParticipantTab = 'tamu'"
                    class="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                    :class="activeParticipantTab === 'tamu' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'"
                  >
                    Tamu Luar ({{ form.peserta_luar.length }})
                  </button>
                </div>
              </div>

              <!-- Warga Selection -->
              <div v-show="activeParticipantTab === 'warga'" class="bg-slate-50 rounded-3xl border border-slate-100 p-6 animate-in fade-in duration-300">
                <div class="flex flex-col md:flex-row gap-4 mb-4">
                  <div class="relative flex-1">
                    <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      v-model="wargaSearch" 
                      type="text" 
                      placeholder="Cari nama warga..." 
                      class="input-field pl-10 w-full bg-white text-sm" 
                    />
                  </div>
                  <div class="flex items-center gap-4">
                    <button 
                      v-if="form.agenda_id && !form.peserta_warga.length"
                      type="button" 
                      @click="syncAttendanceFromAgenda"
                      class="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                    >
                      <RefreshCwIcon class="w-3.5 h-3.5" :class="{'animate-spin': syncingAttendance}" />
                      VALIDASI PRESENSI
                    </button>
                    <div class="text-[10px] font-bold text-slate-400 uppercase">
                      <span>{{ form.peserta_warga.length }} Terpilih</span>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                  <label 
                    v-for="w in filteredWarga" 
                    :key="w.id"
                    class="flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group"
                    :class="form.peserta_warga.includes(w.id) 
                      ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' 
                      : 'bg-white border-slate-100 hover:border-primary-200 text-slate-600'"
                  >
                    <input 
                      type="checkbox" 
                      :value="w.id" 
                      v-model="form.peserta_warga"
                      class="hidden"
                    />
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="form.peserta_warga.includes(w.id) ? 'border-white bg-white' : 'border-slate-200 group-hover:border-primary-400'"
                    >
                      <CheckIcon v-if="form.peserta_warga.includes(w.id)" class="w-3 h-3 text-primary-500" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-black truncate">{{ w.nama_kepala_keluarga }}</span>
                      <span class="text-[10px] opacity-60 font-bold uppercase tracking-tight">{{ w.no_rumah }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Guest Management -->
              <div v-show="activeParticipantTab === 'tamu'" class="bg-indigo-50/30 rounded-3xl border border-indigo-100/50 p-6 animate-in fade-in duration-300">
                <div class="flex gap-2 mb-6">
                  <input 
                    v-model="newGuestName" 
                    type="text" 
                    placeholder="Masukkan nama tamu luar..." 
                    class="input-field flex-1 bg-white text-sm"
                    @keyup.enter="addGuest"
                  />
                  <button type="button" @click="addGuest" class="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
                    TAMBAH
                  </button>
                </div>

                <div v-if="form.peserta_luar.length === 0" class="py-12 text-center opacity-30 italic text-sm">
                   Belum ada tamu luar yang ditambahkan.
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div 
                    v-for="(name, index) in form.peserta_luar" 
                    :key="index"
                    class="flex items-center justify-between p-3 bg-white rounded-2xl border border-indigo-100 shadow-sm group"
                  >
                    <div class="flex items-center gap-3 truncate">
                      <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                        {{ index + 1 }}
                      </div>
                      <span class="text-xs font-bold text-slate-700 truncate">{{ name }}</span>
                    </div>
                    <button type="button" @click="removeGuest(index)" class="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <TrashIcon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Agenda Rapat</label>
              <textarea v-model="form.agenda" class="input-field w-full h-24 resize-none" placeholder="Poin-poin rencana pembahasan..."></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Pembahasan & Diskusi</label>
              <textarea v-model="form.pembahasan" class="input-field w-full h-40 resize-none font-medium text-sm leading-relaxed" placeholder="Detail jalannya diskusi..."></textarea>
            </div>

            <div class="space-y-1.5 bg-primary-50 p-6 rounded-3xl border border-primary-100">
              <label class="text-xs font-black text-primary-600 uppercase tracking-wider ml-1">Keputusan Rapat</label>
              <textarea v-model="form.keputusan" class="input-field w-full h-24 resize-none bg-white font-bold" placeholder="Hasil akhir atau kesepakatan yang diambil..."></textarea>
            </div>
          </form>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
            Batal
          </button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan Notulen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useLogger } from '@/utils/logger'
import { agendaService, type Agenda } from '@/services/agendaService'
import { 
  Plus as PlusIcon, X as XIcon, MapPin as MapPinIcon, 
  User as UserIcon, Users as UsersIcon, BookOpen as BookOpenIcon,
  Trash as TrashIcon, Edit as EditIcon, Search as SearchIcon,
  Check as CheckIcon, Link as LinkIcon, RefreshCw as RefreshCwIcon
} from 'lucide-vue-next'
import type { Notulen, Warga } from '@/types'

const route = useRoute()
const { logActivity } = useLogger()

const notulens = ref<Notulen[]>([])
const wargaList = ref<Warga[]>([])
const agendaList = ref<Agenda[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const wargaSearch = ref('')
const activeParticipantTab = ref<'warga' | 'tamu'>('warga')
const newGuestName = ref('')
const syncingAttendance = ref(false)

const form = ref({
  agenda_id: '',
  judul_rapat: '',
  tanggal_rapat: new Date().toISOString().split('T')[0],
  lokasi: '',
  pimpinan_rapat: '',
  notulis: '',
  peserta: [] as string[], // Legacy
  peserta_warga: [] as string[],
  peserta_luar: [] as string[],
  agenda: '',
  pembahasan: '',
  keputusan: '',
  file_url: ''
})

const filteredWarga = computed(() => {
  return wargaList.value.filter(w => 
    w.nama_kepala_keluarga.toLowerCase().includes(wargaSearch.value.toLowerCase()) ||
    w.no_rumah.toLowerCase().includes(wargaSearch.value.toLowerCase())
  )
})

const fetchWarga = async () => {
  try {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('status', 'aktif')
      .order('no_rumah', { ascending: true })
    if (error) throw error
    wargaList.value = data || []
  } catch (e: any) {
    console.error('Gagal mengambil data warga:', e.message)
  }
}

const fetchAgendas = async () => {
  try {
    agendaList.value = await agendaService.getAgendas()
  } catch (e: any) {
    console.error('Gagal mengambil agenda:', e.message)
  }
}

const fetchNotulen = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('notulen')
      .select('*')
      .order('tanggal_rapat', { ascending: false })

    if (error) throw error
    notulens.value = data || []
  } catch (e: any) {
    console.warn('Gagal mengambil notulen:', e.message)
  } finally {
    loading.value = false
  }
}

const handleAgendaSelect = () => {
  if (!form.value.agenda_id) return
  const selected = agendaList.value.find(a => a.id === form.value.agenda_id)
  if (selected) {
    form.value.judul_rapat = selected.judul
    form.value.tanggal_rapat = selected.tanggal
    form.value.lokasi = selected.lokasi
    form.value.agenda = selected.deskripsi || ''
    // Trigger sync
    syncAttendanceFromAgenda()
  }
}

const syncAttendanceFromAgenda = async () => {
  if (!form.value.agenda_id) return
  syncingAttendance.value = true
  try {
    const absensi = await agendaService.getAbsensiByAgenda(form.value.agenda_id)
    // Validate residents: only those who have is_final = true
    const presentWarga = absensi
      .filter(a => a.is_final && a.warga_id)
      .map(a => a.warga_id as string)
    
    form.value.peserta_warga = presentWarga
  } catch (e: any) {
    console.error('Gagal sinkronisasi presensi:', e.message)
  } finally {
    syncingAttendance.value = false
  }
}

const addGuest = () => {
  if (!newGuestName.value.trim()) return
  if (!form.value.peserta_luar.includes(newGuestName.value.trim())) {
    form.value.peserta_luar.push(newGuestName.value.trim())
  }
  newGuestName.value = ''
}

const removeGuest = (index: number) => {
  form.value.peserta_luar.splice(index, 1)
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    agenda_id: '',
    judul_rapat: '',
    tanggal_rapat: new Date().toISOString().split('T')[0],
    lokasi: '',
    pimpinan_rapat: 'Ketua RT',
    notulis: 'Sekretaris',
    peserta: [],
    peserta_warga: [],
    peserta_luar: [],
    agenda: '',
    pembahasan: '',
    keputusan: '',
    file_url: ''
  }
  wargaSearch.value = ''
  activeParticipantTab.value = 'warga'
  showModal.value = true
}

const openEditModal = (item: Notulen) => {
  editingId.value = item.id
  form.value = { 
    ...item,
    agenda_id: item.agenda_id || '',
    peserta_warga: item.peserta_warga || [],
    peserta_luar: item.peserta_luar || []
  }
  wargaSearch.value = ''
  activeParticipantTab.value = 'warga'
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    // Generate legacy peserta list for backward compatibility
    const selectedWargaNames = wargaList.value
      .filter(w => form.value.peserta_warga.includes(w.id))
      .map(w => w.nama_kepala_keluarga)
    form.value.peserta = [...selectedWargaNames, ...form.value.peserta_luar]

    if (editingId.value) {
      const { error } = await supabase
        .from('notulen')
        .update(form.value)
        .eq('id', editingId.value)
      if (error) throw error
      await logActivity('UPDATE_NOTULEN', 'notulen', form.value)
    } else {
      const { error } = await supabase
        .from('notulen')
        .insert([form.value])
      if (error) throw error
      await logActivity('ADD_NOTULEN', 'notulen', form.value)
    }

    showModal.value = false
    await fetchNotulen()
  } catch (e: any) {
    alert('Gagal menyimpan: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus notulen ini?')) return

  try {
    const { error } = await supabase
      .from('notulen')
      .delete()
      .eq('id', id)
    if (error) throw error
    await logActivity('DELETE_NOTULEN', 'notulen', { id })
    await fetchNotulen()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }).format(new Date(dateStr))
}

const getDay = (date: string) => new Date(date).getDate()
const getMonth = (date: string) => new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(date))
const getYear = (date: string) => new Date(date).getFullYear()

onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchNotulen(),
    fetchWarga(),
    fetchAgendas()
  ])
  
  // Handle shortcut from AgendaDetail
  const queryAgendaId = route.query.agenda_id as string
  if (queryAgendaId) {
    openAddModal()
    form.value.agenda_id = queryAgendaId
    handleAgendaSelect()
  }
  loading.value = false
})
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
</style>
