<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-200">
        <h2 class="text-xl font-bold text-slate-800">Pengaturan Identitas</h2>
        <p class="text-sm text-slate-500 mt-1">Sesuaikan identitas sistem dengan organisasi Anda</p>
      </div>
      
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Tipe Organisasi</label>
            <select 
              v-model="form.orgType"
              class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="RT">RT (Rukun Tetangga)</option>
              <option value="Perumahan">Perumahan</option>
              <option value="Paguyuban">Paguyuban</option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Nama {{ form.orgType }}</label>
            <input 
              v-model="form.orgName"
              type="text"
              :placeholder="form.orgType === 'RT' ? 'Contoh: 05' : 'Contoh: Griya Indah'"
              class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div class="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <InfoIcon class="w-5 h-5" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">Preview Label</p>
            <p class="text-xs text-slate-500">
              Sistem akan menampilkan: <span class="font-bold text-primary-600">{{ previewLabel }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Struktur Organisasi</h2>
          <p class="text-sm text-slate-500 mt-1">Atur jabatan dan nama pengurus</p>
        </div>
        <button 
          @click="addStructure"
          class="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Jabatan
        </button>
      </div>

      <div class="p-6">
        <div class="space-y-4">
          <div 
            v-for="(item, index) in form.structure" 
            :key="index"
            class="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 relative group"
          >
            <div class="flex-1 space-y-2">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jabatan</label>
              <input 
                v-model="item.role"
                type="text"
                placeholder="Contoh: Ketua"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              />
            </div>
            <div class="flex-1 space-y-2">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Pengurus</label>
              <select 
                v-model="item.warga_id"
                @change="(e) => handleWargaChange(index, (e.target as HTMLSelectElement).value)"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              >
                <option value="">-- Pilih Warga --</option>
                <option v-for="w in wargaList" :key="w.id" :value="w.id">
                  {{ w.nama_kepala_keluarga }} ({{ w.no_rumah }})
                </option>
              </select>
            </div>
            <div class="md:self-end flex gap-1 mb-1">
              <button 
                @click="moveUp(index)"
                :disabled="index === 0"
                class="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                title="Pindahkan ke atas"
              >
                <ChevronUpIcon class="w-5 h-5" />
              </button>
              <button 
                @click="moveDown(index)"
                :disabled="index === form.structure.length - 1"
                class="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                title="Pindahkan ke bawah"
              >
                <ChevronDownIcon class="w-5 h-5" />
              </button>
              <button 
                @click="removeStructure(index)"
                class="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Hapus"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div v-if="form.structure.length === 0" class="text-center py-8 text-slate-400">
            Belum ada struktur organisasi yang ditambahkan.
          </div>
        </div>
      </div>

      <div class="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button 
          @click="saveSettings"
          :disabled="loading"
          class="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore, type AppSettings } from '@/stores/settings'
import { supabase } from '@/services/supabase'
import type { Warga } from '@/types'
import { useLogger } from '@/utils/logger'
import { 
  Info as InfoIcon, 
  Plus as PlusIcon, 
  Trash as TrashIcon, 
  ChevronUp as ChevronUpIcon, 
  ChevronDown as ChevronDownIcon 
} from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()
const loading = ref(false)

const wargaList = ref<Warga[]>([])

const form = ref<AppSettings>({
  orgName: '',
  orgType: 'RT',
  structure: []
})

const previewLabel = computed(() => {
  return form.value.orgType === 'RT' ? `RT ${form.value.orgName}` : form.value.orgName
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      settingsStore.fetchSettings(),
      fetchWarga()
    ])
    form.value = JSON.parse(JSON.stringify(settingsStore.settings))
  } catch (e) {
    console.error('Initial fetch failed:', e)
  } finally {
    loading.value = false
  }
})

const fetchWarga = async () => {
  const { data } = await supabase.from('warga').select('*').order('nama_kepala_keluarga')
  wargaList.value = data || []
}

const handleWargaChange = (index: number, wargaId: string) => {
  const selected = wargaList.value.find(w => w.id === wargaId)
  if (form.value.structure[index]) {
    form.value.structure[index].name = selected ? selected.nama_kepala_keluarga : ''
  }
}

const addStructure = () => {
  form.value.structure.push({ role: '', name: '' })
}

const removeStructure = (index: number) => {
  form.value.structure.splice(index, 1)
}

const moveUp = (index: number) => {
  if (index <= 0) return
  const item = form.value.structure[index]
  if (!item) return
  form.value.structure.splice(index, 1)
  form.value.structure.splice(index - 1, 0, item)
}

const moveDown = (index: number) => {
  if (index >= form.value.structure.length - 1) return
  const item = form.value.structure[index]
  if (!item) return
  form.value.structure.splice(index, 1)
  form.value.structure.splice(index + 1, 0, item)
}

const saveSettings = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await settingsStore.saveSettings(form.value)
    await logActivity('UPDATE_SETTINGS', 'settings', {
      org_name: form.value.orgName,
      org_type: form.value.orgType,
      structure: form.value.structure
    })
    alert('✅ Pengaturan berhasil disimpan!')
  } catch (e: any) {
    console.error('Detailed Save Error:', e)
    alert('❌ Gagal menyimpan: ' + (e.message || 'Izin ditolak (RLS) atau masalah koneksi'))
  } finally {
    loading.value = false
  }
}
</script>
