<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-slate-800">
      <div>
        <h2 class="text-2xl font-bold">Arsip Surat</h2>
        <p class="text-slate-500 text-sm">Manajemen arsip surat masuk dan surat keluar.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-5 h-5 text-indigo-400" />
        <span>Arsipkan Surat</span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-200">
      <button 
        @click="activeTab = 'masuk'"
        :class="[
          'px-6 py-3 font-medium text-sm transition-all border-b-2',
          activeTab === 'masuk' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        ]"
      >
        Surat Masuk
      </button>
      <button 
        @click="activeTab = 'keluar'"
        :class="[
          'px-6 py-3 font-medium text-sm transition-all border-b-2',
          activeTab === 'keluar' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        ]"
      >
        Surat Keluar
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="card flex flex-col md:flex-row gap-4 justify-between items-center">
      <div class="relative w-full md:max-w-sm">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="search" 
          type="text" 
          placeholder="Cari nomor, judul, atau pengirim..." 
          class="input-field pl-10 w-full" 
        />
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
        <label class="text-sm text-slate-500 whitespace-nowrap">Tahun:</label>
        <select v-model="filterYear" class="input-field py-1">
          <option :value="null">Semua</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Nomor Surat</th>
              <th class="px-6 py-4">Judul / Perihal</th>
              <th class="px-6 py-4">{{ activeTab === 'masuk' ? 'Pengirim' : 'Penerima' }}</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 italic">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="5" class="px-6 py-6">
                <div class="h-4 bg-slate-100 rounded w-full"></div>
              </td>
            </tr>
            <tr v-else-if="filteredSurat.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400 not-italic">
                Belum ada arsip surat {{ activeTab }}.
              </td>
            </tr>
            <tr v-else v-for="item in filteredSurat" :key="item.id" class="hover:bg-slate-50/50 transition-colors not-italic">
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ formatDate(item.tanggal_surat) }}
              </td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">
                {{ item.nomor_surat || '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="font-semibold text-slate-800">{{ item.judul_surat }}</div>
                <div class="text-xs text-slate-400 truncate max-w-xs">{{ item.perihal }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">
                {{ activeTab === 'masuk' ? item.pengirim : item.penerima }}
              </td>
              <td class="px-6 py-4 text-right space-x-3">
                <a v-if="item.file_url" :href="item.file_url" target="_blank" class="text-primary-600 hover:underline font-bold text-xs uppercase tracking-tight">
                  Lihat
                </a>
                <button @click="openEditModal(item)" class="text-slate-600 hover:text-primary-600 font-bold text-xs uppercase tracking-tight">
                  Edit
                </button>
                <button @click="handleDelete(item.id)" class="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-tight">
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="text-xl font-black text-slate-800 tracking-tight">
            {{ editingId ? 'Edit Arsip Surat' : 'Arsipkan Surat Baru' }}
          </h3>
          <button @click="showModal = false" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-8 py-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Kategori</label>
                <select v-model="form.kategori" class="input-field w-full" required>
                  <option value="masuk">Surat Masuk</option>
                  <option value="keluar">Surat Keluar</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Nomor Surat</label>
                <input v-model="form.nomor_surat" type="text" class="input-field w-full" placeholder="001/RT01/III/2024" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Judul Surat</label>
              <input v-model="form.judul_surat" type="text" class="input-field w-full font-bold" required placeholder="Judul ringkas surat" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Tanggal Surat</label>
                <input v-model="form.tanggal_surat" type="date" class="input-field w-full" required />
              </div>
              <div v-if="form.kategori === 'masuk'" class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Tanggal Diterima</label>
                <input v-model="form.tanggal_diterima" type="date" class="input-field w-full" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Pengirim</label>
                <input v-model="form.pengirim" type="text" class="input-field w-full" required />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Penerima</label>
                <input v-model="form.penerima" type="text" class="input-field w-full" required />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Perihal / Ringkasan</label>
              <textarea v-model="form.perihal" class="input-field w-full h-24 resize-none" placeholder="Ringkasan atau poin-poin penting isi surat..."></textarea>
            </div>

            <div class="space-y-1.5 pb-2">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">File Dokumen</label>
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300">
                <input type="file" @change="handleFileUpload" class="hidden" ref="fileInput" accept="image/*,application/pdf" />
                <button type="button" @click="openFileInput" class="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                  {{ form.file_url ? 'Ganti File' : 'Pilih Scan/Foto' }}
                </button>
                <div class="flex-1">
                  <span v-if="uploading" class="text-[10px] text-primary-500 font-bold uppercase animate-pulse">Mengunggah...</span>
                  <div v-else-if="form.file_url" class="flex items-center gap-1.5">
                    <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckIcon class="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span class="text-[10px] text-green-600 font-bold uppercase">Sudah diunggah</span>
                  </div>
                  <span v-else class="text-[10px] text-slate-400 font-medium">PNG, JPG atau PDF (Maks 5MB)</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
            Batal
          </button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting || uploading">
            {{ submitting ? 'Menyimpan...' : 'Simpan Arsip' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useLogger } from '@/utils/logger'
import { Plus as PlusIcon, Search as SearchIcon, X as XIcon, Check as CheckIcon } from 'lucide-vue-next'
import type { Surat } from '@/types'

const { logActivity } = useLogger()

const activeTab = ref<'masuk' | 'keluar'>('masuk')
const suratList = ref<Surat[]>([])
const loading = ref(true)
const submitting = ref(false)
const uploading = ref(false)
const showModal = ref(false)
const search = ref('')
const filterYear = ref<number | null>(new Date().getFullYear())
const editingId = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsArr = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearsArr.push(i)
  }
  return yearsArr
})

const form = ref({
  nomor_surat: '',
  judul_surat: '',
  tanggal_surat: new Date().toISOString().split('T')[0],
  tanggal_diterima: new Date().toISOString().split('T')[0],
  pengirim: '',
  penerima: '',
  perihal: '',
  kategori: 'masuk' as 'masuk' | 'keluar',
  file_url: ''
})

const filteredSurat = computed(() => {
  return suratList.value.filter(item => {
    const matchesTab = item.kategori === activeTab.value
    const matchesSearch = 
      item.judul_surat.toLowerCase().includes(search.value.toLowerCase()) ||
      (item.nomor_surat?.toLowerCase() || '').includes(search.value.toLowerCase()) ||
      item.pengirim.toLowerCase().includes(search.value.toLowerCase()) ||
      item.penerima.toLowerCase().includes(search.value.toLowerCase())
    
    const itemYear = new Date(item.tanggal_surat).getFullYear()
    const matchesYear = filterYear.value ? itemYear === filterYear.value : true

    return matchesTab && matchesSearch && matchesYear
  })
})

const fetchSurat = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('surat')
      .select('*')
      .order('tanggal_surat', { ascending: false })

    if (error) throw error
    suratList.value = data || []
  } catch (e: any) {
    console.warn('Gagal mengambil data surat:', e.message)
    // Don't alert here to prevent annoying popups if tables not ready yet
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    nomor_surat: '',
    judul_surat: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    tanggal_diterima: activeTab.value === 'masuk' ? new Date().toISOString().split('T')[0] : '',
    pengirim: activeTab.value === 'keluar' ? 'PENGURUS RT' : '',
    penerima: activeTab.value === 'masuk' ? 'KETUA RT / SEKRETARIS' : '',
    perihal: '',
    kategori: activeTab.value,
    file_url: ''
  }
  showModal.value = true
}

const openEditModal = (item: Surat) => {
  editingId.value = item.id
  form.value = { ...item } as any
  showModal.value = true
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `surat/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('dokumen')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('dokumen')
      .getPublicUrl(filePath)

    form.value.file_url = data.publicUrl
  } catch (error: any) {
    alert('Error uploading file: ' + error.message)
  } finally {
    uploading.value = false
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const dataToSave: any = { ...form.value }
    if (dataToSave.kategori === 'keluar') {
      delete dataToSave.tanggal_diterima
    }

    if (editingId.value) {
      const { error } = await supabase
        .from('surat')
        .update(dataToSave)
        .eq('id', editingId.value)
      if (error) throw error
      await logActivity('UPDATE_SURAT', 'surat', dataToSave)
    } else {
      const { error } = await supabase
        .from('surat')
        .insert([dataToSave])
      if (error) throw error
      await logActivity('ADD_SURAT', 'surat', dataToSave)
    }

    showModal.value = false
    await fetchSurat()
  } catch (e: any) {
    alert('Gagal menyimpan: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus arsip surat ini?')) return

  try {
    const { error } = await supabase
      .from('surat')
      .delete()
      .eq('id', id)
    if (error) throw error
    await logActivity('DELETE_SURAT', 'surat', { id })
    await fetchSurat()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  }
}

const formatDate = (date: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
  } catch {
    return date
  }
}

onMounted(fetchSurat)

watch(activeTab, () => {
  // Reset search or other states if needed
})

const openFileInput = () => {
  fileInput.value?.click()
}
</script>
