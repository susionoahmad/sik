<template>
  <div class="space-y-6">
    <!-- Breadcrumbs / Back -->
    <div class="flex items-center gap-2">
      <router-link :to="{ name: 'agenda' }" class="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Agenda Rapat</span>
    </div>

    <div v-if="loading" class="space-y-6">
      <div class="card h-48 animate-pulse bg-slate-100 border-none"></div>
      <div class="card h-96 animate-pulse bg-slate-100 border-none"></div>
    </div>

    <div v-else-if="!agenda" class="card py-12 text-center">
      <p class="text-slate-500">Data agenda tidak ditemukan.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Top Action Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-tight">{{ agenda.judul }}</h2>
          <div class="flex flex-wrap items-center gap-4 mt-2">
            <div class="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase">
              <CalendarIcon class="w-4 h-4 text-primary-500" />
              {{ formatDate(agenda.tanggal) }}
            </div>
            <div class="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase">
              <ClockIcon class="w-4 h-4 text-primary-500" />
              {{ agenda.waktu }} WIB
            </div>
            <span :class="[
              'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
              agenda.status === 'published' ? 'bg-green-100 text-green-700' : 
              agenda.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
            ]">
              {{ agenda.status }}
            </span>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-2">
          <button 
            v-if="agenda.status === 'draft'"
            @click="handleUpdateStatus('published')"
            class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
          >
            <SendIcon class="w-4 h-4" />
            PUBLIKASIKAN
          </button>
          
          <div v-if="agenda.status === 'published'" class="flex gap-2">
            <button 
              @click="handleShareWA"
              class="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/10 transition-all flex items-center gap-2"
              title="Bagikan link absensi"
            >
              <LinkIcon class="w-4 h-4" />
              LINK ABSENSI
            </button>
            <button 
              @click="handleShareInvitationWA"
              class="px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/10 transition-all flex items-center gap-2"
              title="Bagikan undangan formal"
            >
              <PhoneIcon class="w-4 h-4" />
              UNDANGAN WA
            </button>
          </div>
          
          <button 
            v-if="agenda.status === 'published' || agenda.status === 'finished'"
            @click="goToNotulen"
            class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <BookOpenIcon class="w-4 h-4" />
            BUAT NOTULEN
          </button>

          <button 
            v-if="agenda.status === 'published'"
            @click="handleUpdateStatus('finished')"
            class="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2"
          >
            <CheckCheckIcon class="w-4 h-4" />
            SELESAI RAPAT
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-4 border-none ring-1 ring-slate-200 shadow-sm flex flex-col items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Warga</span>
          <span class="text-2xl font-black text-slate-800">{{ absensiList.length }}</span>
        </div>
        <div class="card p-4 border-none ring-1 ring-slate-200 shadow-sm flex flex-col items-center">
          <span class="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Rencana Hadir</span>
          <span class="text-2xl font-black text-green-600">{{ stats.hadir }}</span>
        </div>
        <div class="card p-4 border-none ring-1 ring-slate-200 shadow-sm flex flex-col items-center">
          <span class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Rencana Absen</span>
          <span class="text-2xl font-black text-amber-600">{{ stats.tidakHadir }}</span>
        </div>
        <div class="card p-4 border-none ring-1 ring-slate-200 shadow-sm flex flex-col items-center">
          <span class="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Aspirasi</span>
          <span class="text-2xl font-black text-primary-600">{{ stats.aspirasi }}</span>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Attendance Table -->
        <div class="lg:col-span-2 space-y-4">
          <div class="card !p-0 border-none ring-1 ring-slate-200 shadow-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 class="font-black text-slate-800 uppercase tracking-tight text-sm">Daftar Presensi Warga</h3>
              <div class="text-[10px] font-bold text-slate-400 uppercase">
                {{ absensiList.filter(a => a.is_final).length }} Terkonfirmasi Hadir
              </div>
            </div>
            
            <div class="overflow-x-auto min-h-[300px]">
              <table class="w-full text-left">
                <thead class="bg-slate-50/80 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <tr>
                    <th class="px-6 py-4 w-16">No</th>
                    <th class="px-6 py-4">Warga / No. Rumah</th>
                    <th class="px-6 py-4 text-center">Status Pra</th>
                    <th class="px-6 py-4 text-center">Final (Hadir)</th>
                    <th class="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="absensiList.length === 0">
                    <td colspan="5" class="px-6 py-20 text-center">
                      <div class="flex flex-col items-center opacity-40">
                        <UsersIcon class="w-12 h-12 mb-2" />
                        <p class="text-sm font-medium">Belum ada warga yang mengisi presensi.</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(item, idx) in absensiList" :key="item.id" class="hover:bg-slate-50 transition-colors group">
                    <td class="px-6 py-4 text-xs font-bold text-slate-400">{{ idx + 1 }}</td>
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-800 text-sm">{{ item.nama_warga }}</div>
                      <div class="text-[10px] font-black text-primary-500 uppercase">Blok {{ item.no_rumah || '-' }}</div>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span :class="[
                        'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                        item.status === 'hadir' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      ]">
                        {{ item.status === 'hadir' ? 'Hadir' : 'Absen' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button 
                        @click="toggleFinalAttendance(item)"
                        class="p-2 rounded-xl transition-all"
                        :class="item.is_final ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-slate-100 text-slate-300 hover:text-slate-500'"
                      >
                        <UserCheckIcon class="w-5 h-5" />
                      </button>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button 
                        v-if="item.masukan_aspirasi || item.alasan"
                        @click="viewDetail(item)"
                        class="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest"
                      >
                        Lihat Pesan
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Sidebar Page Info & Aspirations -->
        <div class="space-y-6">
          <!-- Location/Time Card -->
          <div class="card border-none ring-1 ring-slate-200 shadow-sm bg-slate-50/50 space-y-4">
            <h3 class="font-black text-slate-800 uppercase tracking-tight text-xs">Informasi Pertemuan</h3>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <MapPinIcon class="w-4 h-4 text-slate-400 mt-0.5" />
                <span class="text-xs font-bold text-slate-600">{{ agenda.lokasi }}</span>
              </div>
              <div class="flex items-start gap-3">
                <FileTextIcon class="w-4 h-4 text-slate-400 mt-0.5" />
                <p class="text-xs text-slate-500 leading-relaxed">{{ agenda.deskripsi || 'Tidak ada deskripsi.' }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Aspirations List -->
          <div class="card border-none ring-1 ring-slate-200 shadow-sm h-[500px] flex flex-col p-0">
            <div class="p-6 border-b border-slate-100">
              <h3 class="font-black text-slate-800 uppercase tracking-tight text-xs">Daftar Masukan / Aspirasi</h3>
              <p class="text-[10px] font-medium text-slate-400 mt-0.5">Pesan dari warga terkait agenda ini.</p>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              <div v-if="absensiList.filter(a => a.masukan_aspirasi).length === 0" class="py-12 text-center opacity-30">
                <MessageSquareIcon class="w-10 h-10 mx-auto mb-2" />
                <p class="text-xs font-medium">Belum ada aspirasi masuk.</p>
              </div>
              <div v-for="a in absensiList.filter(a => a.masukan_aspirasi)" :key="a.id" class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <div class="flex justify-between items-start">
                  <span class="text-[10px] font-black text-slate-800 uppercase">{{ a.nama_warga }}</span>
                  <span class="text-[9px] font-bold text-slate-400">{{ a.no_rumah }}</span>
                </div>
                <p class="text-xs text-slate-600 italic leading-relaxed">"{{ a.masukan_aspirasi }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal View Detail -->
    <div v-if="selectedAbsensi" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Detail Pesan Warga</h3>
          <button @click="selectedAbsensi = null" class="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="space-y-6">
          <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-800 border border-slate-100 shadow-sm">
              {{ selectedAbsensi.nama_warga[0]?.toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-black text-slate-800">{{ selectedAbsensi.nama_warga }}</p>
              <p class="text-xs font-bold text-primary-500 uppercase tracking-widest">No. Rumah {{ selectedAbsensi.no_rumah }}</p>
            </div>
          </div>

          <div v-if="selectedAbsensi.status === 'tidak_hadir'" class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Tidak Hadir</label>
            <div class="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm italic text-amber-800">
              {{ selectedAbsensi.alasan || 'Tidak dicantumkan.' }}
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aspirasi / Masukan</label>
            <div class="p-4 bg-primary-50 border border-primary-100 rounded-2xl text-sm italic text-primary-800 leading-relaxed">
              {{ selectedAbsensi.masukan_aspirasi || 'Tidak ada masukan.' }}
            </div>
          </div>

          <button @click="selectedAbsensi = null" class="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]">
            TUTUP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agendaService, type Agenda, type Absensi } from '@/services/agendaService'
import { useLogger } from '@/utils/logger'
import { useSettingsStore } from '@/stores/settings'
import { 
  ArrowLeft as ArrowLeftIcon, Calendar as CalendarIcon, Clock as ClockIcon,
  MapPin as MapPinIcon, Send as SendIcon, CheckCheck as CheckCheckIcon,
  Phone as PhoneIcon, UserCheck as UserCheckIcon, MessageSquare as MessageSquareIcon,
  Users as UsersIcon, FileText as FileTextIcon, X as XIcon, Link as LinkIcon,
  BookOpen as BookOpenIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const loading = ref(true)
const agenda = ref<Agenda | null>(null)
const absensiList = ref<Absensi[]>([])
const selectedAbsensi = ref<Absensi | null>(null)

const stats = computed(() => {
  return {
    hadir: absensiList.value.filter(a => a.status === 'hadir').length,
    tidakHadir: absensiList.value.filter(a => a.status === 'tidak_hadir').length,
    aspirasi: absensiList.value.filter(a => a.masukan_aspirasi).length
  }
})

const fetchData = async () => {
  loading.value = true
  const id = route.params.id as string
  try {
    agenda.value = await agendaService.getAgendaById(id)
    const absensiData = await agendaService.getAbsensiByAgenda(id)
    absensiList.value = (absensiData || []).sort((a, b) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
  } catch (e: any) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleUpdateStatus = async (status: 'published' | 'finished') => {
  if (!agenda.value) return
  if (!confirm(`Ubah status agenda menjadi ${statusLabel(status)}?`)) return
  
  try {
    await agendaService.updateAgenda(agenda.value.id, { status })
    await logActivity('UPDATE_AGENDA_STATUS', 'agenda_rapat', { id: agenda.value.id, status })
    await fetchData()
  } catch (e: any) {
    alert('Gagal update status: ' + e.message)
  }
}

const toggleFinalAttendance = async (item: Absensi) => {
  try {
    const newFinal = !item.is_final
    await agendaService.updateAbsensiStatus(item.id, { is_final: newFinal })
    item.is_final = newFinal
  } catch (e: any) {
    alert('Gagal update presensi: ' + e.message)
  }
}

const goToNotulen = () => {
  if (!agenda.value) return
  router.push({ 
    name: 'notulen', 
    query: { agenda_id: agenda.value.id } 
  })
}

const handleShareWA = () => {
  if (!agenda.value) return
  
  const publicLink = `${window.location.origin}/absensi/${agenda.value.id}`
  const orgLabel = settingsStore.organizationLabel
  const message = `*PRESENSI RAPAT ${settingsStore.residentLabel.toUpperCase()}*\n\nKepada Bpk/Ibu ${settingsStore.residentLabel.toLowerCase()} ${orgLabel}, mohon kerjasamanya untuk mengisi *Pra-Absensi* kehadiran untuk rapat yang akan dilaksanakan pada:\n\n📅 *Hari/Tgl:* ${formatDate(agenda.value.tanggal)}\n⏰ *Waktu:* ${agenda.value.waktu} WIB\n📍 *Lokasi:* ${agenda.value.lokasi}\n📝 *Agenda:* ${agenda.value.judul}\n\nSilakan klik tautan berikut untuk mengisi:\n${publicLink}\n\nTerima kasih atas partisipasinya.`
  
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank')
}

const handleShareInvitationWA = () => {
  if (!agenda.value) return
  
  const orgLabel = settingsStore.organizationLabel
  const resLabel = settingsStore.residentLabel
  const publicLink = `${window.location.origin}/absensi/${agenda.value.id}`
  
  const message = `*UNDANGAN RAPAT ${resLabel.toUpperCase()}*

Kepada Yth.
${resLabel} ${orgLabel}

Dengan Hormat,

Mengharap kehadiran ${resLabel.toLowerCase()} ${orgLabel} dalam pertemuan ${resLabel.toLowerCase()} yang akan diselenggarakan pada:

📅 *Hari/Tanggal:* ${formatDate(agenda.value.tanggal)}
⏰ *Waktu:* ${agenda.value.waktu} WIB – Selesai
📍 *Lokasi:* ${agenda.value.lokasi}

*Agenda Rapat:*
${agenda.value.judul}
${agenda.value.deskripsi ? agenda.value.deskripsi : ''}

Mengingat pentingnya agenda yang akan dibahas, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya demi kemajuan lingkungan kita bersama.

*Pra-Absensi & Aspirasi:*
Silakan mengisi kehadiran melalui link berikut:
${publicLink}

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.

Hormat kami,
Pengurus ${orgLabel}`
  
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank')
}

const viewDetail = (item: Absensi) => {
  selectedAbsensi.value = item
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

const statusLabel = (s: string) => {
  const labels: any = { draft: 'Draf', published: 'Aktif', finished: 'Selesai' }
  return labels[s] || s
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchData()
})
</script>
