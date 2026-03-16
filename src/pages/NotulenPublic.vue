<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-slate-800">
      <div>
        <h2 class="text-3xl font-black tracking-tight">Arsip Notulen Rapat</h2>
        <p class="text-slate-500 font-medium">Kumpulan catatan dan keputusan rapat warga.</p>
      </div>
      <div v-if="isOfficer" class="flex gap-2">
        <router-link to="/kelola-notulen" class="btn-primary flex items-center gap-2">
          <SettingsIcon class="w-4 h-4" />
          <span>Kelola Notulen</span>
        </router-link>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="card flex flex-col md:flex-row gap-4 justify-between items-center">
      <div class="relative w-full md:max-w-sm">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="search" 
          type="text" 
          placeholder="Cari judul atau hasil rapat..." 
          class="input-field pl-10 w-full bg-slate-50/50 border-slate-200" 
        />
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Urutkan:</span>
        <select v-model="orderBy" class="input-field py-1 bg-white">
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
        </select>
      </div>
    </div>

    <!-- Notulen List -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="card shadow-md animate-pulse h-48"></div>
    </div>

    <div v-else-if="filteredNotulen.length === 0" class="card flex flex-col items-center justify-center py-20 text-slate-400">
      <BookIcon class="w-16 h-16 opacity-10 mb-4" />
      <p class="italic font-medium">Tidak ada notulen rapat yang ditemukan.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="item in filteredNotulen" 
        :key="item.id" 
        class="group bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-100 transition-all cursor-pointer flex flex-col"
        @click="selectedNotulen = item"
      >
        <div class="flex justify-between items-start mb-6">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-1">{{ formatDate(item.tanggal_rapat) }}</span>
            <h3 class="text-xl font-black text-slate-800 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{{ item.judul_rapat }}</h3>
          </div>
          <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <FileTextIcon class="w-6 h-6 text-slate-400 group-hover:text-primary-500 transition-colors" />
          </div>
        </div>

        <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-6 flex-1 italic group-hover:bg-white transition-all">
          <p class="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            "{{ item.keputusan }}"
          </p>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex -space-x-2">
            <div v-for="i in Math.min(3, item.peserta?.length || 0)" :key="i" class="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-primary-600 uppercase">
              {{ item.peserta[i-1]?.[0] }}
            </div>
            <div v-if="(item.peserta?.length || 0) > 3" class="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
              +{{ item.peserta.length - 3 }}
            </div>
          </div>
          <button class="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">Baca Selengkapnya</button>
        </div>
      </div>
    </div>

    <!-- Modal View Notulen (Sama seperti Dashboard) -->
    <div v-if="selectedNotulen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div class="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest opacity-40">Detail Notulen Rapat</h3>
          <button @click="selectedNotulen = null" class="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon class="w-6 h-6" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-10 py-10 space-y-8">
          <div>
            <div class="flex items-center gap-2 mb-2">
               <span class="px-3 py-1 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Arsip Resmi</span>
               <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ formatDate(selectedNotulen.tanggal_rapat) }}</span>
            </div>
            <h2 class="text-3xl font-black text-slate-800 leading-tight">{{ selectedNotulen.judul_rapat }}</h2>
            <div class="flex items-center gap-4 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
               <div class="flex items-center gap-1.5"><MapPinIcon class="w-4 h-4 text-primary-500" /> {{ selectedNotulen.lokasi }}</div>
               <div class="flex items-center gap-1.5"><UserIcon class="w-4 h-4 text-primary-500" /> {{ selectedNotulen.pimpinan_rapat }}</div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="space-y-3">
              <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div class="w-1 h-1 bg-primary-500 rounded-full"></div> Pembahasan
              </h4>
              <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-[2rem] border border-slate-100">{{ selectedNotulen.pembahasan }}</p>
            </div>
            
            <div class="space-y-3 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-xl shadow-indigo-500/20">
              <h4 class="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                <div class="w-1 h-1 bg-white rounded-full"></div> Hasil Keputusan
              </h4>
              <p class="text-base font-bold leading-relaxed">{{ selectedNotulen.keputusan }}</p>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div class="w-1 h-1 bg-primary-500 rounded-full"></div> Peserta Hadir ({{ selectedNotulen.peserta?.length || 0 }})
              </h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="p in selectedNotulen.peserta" :key="p" class="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-600 shadow-sm">{{ p }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="selectedNotulen = null" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Kembali</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { 
  Search as SearchIcon, FileText as FileTextIcon, 
  MapPin as MapPinIcon, User as UserIcon, X as XIcon,
  Settings as SettingsIcon, Book as BookIcon
} from 'lucide-vue-next'
import type { Notulen } from '@/types'

const authStore = useAuthStore()
const notulens = ref<Notulen[]>([])
const loading = ref(true)
const search = ref('')
const orderBy = ref<'terbaru' | 'terlama'>('terbaru')
const selectedNotulen = ref<Notulen | null>(null)

const isOfficer = computed(() => {
  return ['bendahara', 'sekretaris', 'ketua'].includes(authStore.profile?.role || '')
})

const filteredNotulen = computed(() => {
  let list = notulens.value.filter(n => 
    n.judul_rapat.toLowerCase().includes(search.value.toLowerCase()) ||
    n.keputusan.toLowerCase().includes(search.value.toLowerCase()) ||
    n.pembahasan.toLowerCase().includes(search.value.toLowerCase())
  )

  if (orderBy.value === 'terlama') {
    return list.sort((a, b) => new Date(a.tanggal_rapat).getTime() - new Date(b.tanggal_rapat).getTime())
  }
  return list.sort((a, b) => new Date(b.tanggal_rapat).getTime() - new Date(a.tanggal_rapat).getTime())
})

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
    console.error('Fetch error:', e.message)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(date))
}

onMounted(fetchNotulen)
</script>
