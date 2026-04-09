<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center text-slate-800">
      <div>
        <h2 class="text-2xl font-bold">Agenda Rapat</h2>
        <p class="text-slate-500 text-sm">Kelola jadwal rapat, preresensi warga, dan aspirasi.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-5 h-5" />
        <span>Agenda Baru</span>
      </button>
    </div>

    <!-- Tabs/Filter -->
    <div class="flex border-b border-slate-200">
      <button 
        v-for="status in ['draft', 'published', 'finished']" 
        :key="status"
        @click="activeStatus = status"
        :class="[
          'px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-2',
          activeStatus === status ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
        ]"
      >
        {{ statusLabels[status] }}
      </button>
    </div>

    <!-- Grid List -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="card h-48 animate-pulse bg-slate-100"></div>
    </div>

    <div v-else-if="filteredAgendas.length === 0" class="card py-20 text-center flex flex-col items-center justify-center">
      <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
        <CalendarIcon class="w-10 h-10" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">Belum Ada Agenda</h3>
      <p class="text-slate-500 text-sm max-w-xs mt-1">Silakan buat agenda rapat baru untuk mulai mengumpulkan presensi warga.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="item in filteredAgendas" :key="item.id" 
        class="card group hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 border-none ring-1 ring-slate-200 relative overflow-hidden flex flex-col pt-0 px-0"
      >
        <!-- Status Badge -->
        <div class="absolute top-4 right-4 z-10">
          <span :class="[
            'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
            item.status === 'published' ? 'bg-green-100 text-green-700' : 
            item.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
          ]">
            {{ item.status }}
          </span>
        </div>

        <!-- Card Header (Date Box) -->
        <div class="bg-slate-50 p-6 border-b border-slate-100">
          <div class="flex items-start gap-4">
            <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[60px]">
              <span class="text-[10px] font-black text-primary-500 uppercase">{{ getMonth(item.tanggal) }}</span>
              <span class="text-2xl font-black text-slate-900">{{ getDay(item.tanggal) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-black text-slate-800 leading-snug group-hover:text-primary-600 transition-colors truncate pr-12">{{ item.judul }}</h4>
              <div class="flex items-center gap-1.5 mt-1 text-slate-500">
                <ClockIcon class="w-3.5 h-3.5" />
                <span class="text-xs font-medium">{{ item.waktu }} WIB</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 flex-1 space-y-4">
          <div class="flex items-start gap-2.5">
            <MapPinIcon class="w-4 h-4 text-slate-400 mt-0.5" />
            <span class="text-xs font-bold text-slate-600">{{ item.lokasi }}</span>
          </div>
          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">{{ item.deskripsi || 'Tidak ada deskripsi.' }}</p>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between gap-2">
          <router-link :to="{ name: 'agenda-detail', params: { id: item.id }}" class="flex-1 text-center py-2 bg-white rounded-lg text-xs font-black border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            DETAIL
          </router-link>
          <div class="flex items-center gap-1">
            <button @click="openEditModal(item)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all" title="Edit">
              <EditIcon class="w-4 h-4" />
            </button>
            <button @click="handleDelete(item.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Hapus">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 border border-white/20">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
              <CalendarIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-800 tracking-tight">{{ editingId ? 'Edit Agenda' : 'Agenda Rapat Baru' }}</h3>
              <p class="text-xs font-medium text-slate-500 mt-0.5">Lengkapi detail pertemuan {{ settingsStore.residentLabel.toLowerCase() }} berikut.</p>
            </div>
          </div>
          <button @click="showModal = false" class="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Judul Agenda</label>
            <input v-model="form.judul" type="text" class="input-field py-3 font-bold" required placeholder="Contoh: Rapat Koordinasi Keamanan Lingkungan" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tanggal</label>
              <input v-model="form.tanggal" type="date" class="input-field py-3 font-bold" required />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Waktu</label>
              <input v-model="form.waktu" type="time" class="input-field py-3 font-bold" required />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lokasi</label>
            <input v-model="form.lokasi" type="text" class="input-field py-3 font-bold" required :placeholder="'Contoh: Balai ' + settingsStore.organizationLabel" />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Deskripsi / Agenda</label>
            <textarea v-model="form.deskripsi" class="input-field h-28 py-3 font-medium resize-none" placeholder="Tuliskan poin-poin yang akan dibahas..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-4">
            <button type="button" @click="showModal = false" class="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all text-center">
              Batal
            </button>
            <button type="submit" class="bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2" :disabled="submitting">
              {{ submitting ? 'MENYIMPAN...' : (editingId ? 'SIMPAN PERUBAHAN' : 'BUAT AGENDA') }}
              <ArrowRightIcon v-if="!submitting" class="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { agendaService, type Agenda } from '@/services/agendaService'
import { useLogger } from '@/utils/logger'
import { useSettingsStore } from '@/stores/settings'
import { 
  Plus as PlusIcon, Calendar as CalendarIcon, Clock as ClockIcon, 
  MapPin as MapPinIcon, X as XIcon, Edit2 as EditIcon, 
  Trash2 as TrashIcon, ArrowRight as ArrowRightIcon 
} from 'lucide-vue-next'

const { logActivity } = useLogger()
const settingsStore = useSettingsStore()

const agendaList = ref<Agenda[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const activeStatus = ref('published')
const editingId = ref<string | null>(null)

const statusLabels: Record<string, string> = {
  draft: 'Draf',
  published: 'Aktif / Berjalan',
  finished: 'Selesai'
}

interface AgendaForm {
  judul: string
  tanggal: string
  waktu: string
  lokasi: string
  deskripsi: string
  status: 'draft' | 'published' | 'finished'
}

const form = ref<AgendaForm>({
  judul: '',
  tanggal: new Date().toISOString().split('T')[0] || '',
  waktu: '19:30',
  lokasi: '',
  deskripsi: '',
  status: 'draft'
})

const filteredAgendas = computed(() => {
  return agendaList.value.filter(item => item.status === activeStatus.value)
})

const fetchAgendas = async () => {
  loading.value = true
  try {
    agendaList.value = await agendaService.getAgendas()
  } catch (e: any) {
    console.error('Failed to fetch agendas:', e.message)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    judul: '',
    tanggal: new Date().toISOString().split('T')[0] || '',
    waktu: '19:30',
    lokasi: '',
    deskripsi: '',
    status: 'draft'
  }
  showModal.value = true
}

const openEditModal = (item: Agenda) => {
  editingId.value = item.id
  form.value = { 
    judul: item.judul,
    tanggal: item.tanggal,
    waktu: item.waktu,
    lokasi: item.lokasi,
    deskripsi: item.deskripsi || '',
    status: item.status
  }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingId.value) {
      await agendaService.updateAgenda(editingId.value, form.value)
      await logActivity('UPDATE_AGENDA', 'agenda_rapat', { id: editingId.value, ...form.value })
    } else {
      await agendaService.createAgenda(form.value)
      await logActivity('CREATE_AGENDA', 'agenda_rapat', form.value)
    }
    showModal.value = false
    await fetchAgendas()
    
    // Switch to status if created/updated
    if (form.value.status !== activeStatus.value) {
      activeStatus.value = form.value.status
    }
  } catch (e: any) {
    alert('Gagal menyimpan agenda: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Hapus agenda rapat ini? Semua data presensi terkait juga akan terhapus.')) return
  try {
    await agendaService.deleteAgenda(id)
    await logActivity('DELETE_AGENDA', 'agenda_rapat', { id })
    await fetchAgendas()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  }
}

const getMonth = (dateStr: string) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(dateStr)).toUpperCase()
}

const getDay = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).getDate()
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchAgendas()
})
</script>
