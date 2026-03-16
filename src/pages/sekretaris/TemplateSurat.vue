<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-slate-800">
      <div>
        <h2 class="text-2xl font-bold">Template Surat</h2>
        <p class="text-slate-500 text-sm">Kelola template surat keluar untuk mempermudah administrasi.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-5 h-5 text-indigo-400" />
        <span>Tambah Template</span>
      </button>
    </div>

    <!-- Template Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="card animate-pulse h-48 bg-slate-50"></div>
    </div>
    
    <div v-else-if="templates.length === 0" class="card flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
      <FileTextIcon class="w-12 h-12 opacity-20" />
      <p class="italic">Belum ada template surat.</p>
      <button @click="openAddModal" class="text-primary-600 font-bold text-sm hover:underline">Buat template pertama</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="item in templates" :key="item.id" class="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-primary-100 transition-all relative overflow-hidden flex flex-col h-full">
        <div class="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150 opacity-50"></div>
        
        <div class="relative">
          <div class="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileTextIcon class="w-6 h-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-black text-slate-800 leading-tight mb-2">{{ item.nama_template }}</h3>
          <p class="text-xs text-slate-500 line-clamp-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
            {{ stripHtml(item.konten_template) }}
          </p>
        </div>

        <div class="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div class="flex gap-4">
            <button @click="openEditModal(item)" class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors">
              Edit
            </button>
            <button @click="handleDelete(item.id)" class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
              Hapus
            </button>
          </div>
          <button @click="copyTemplate(item.konten_template)" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
            Salin Teks
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="text-xl font-black text-slate-800 tracking-tight">
            {{ editingId ? 'Edit Template Surat' : 'Buat Template Baru' }}
          </h3>
          <button @click="showModal = false" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-8 py-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Nama Template</label>
              <input v-model="form.nama_template" type="text" class="input-field w-full font-bold" required placeholder="Contoh: Surat Pengantar Domisili" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Isi Template</label>
              <div class="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-2">
                <p class="text-[10px] text-amber-700 leading-relaxed font-medium">
                  <strong>Tips:</strong> Gunakan variabel seperti {nama}, {alamat}, {tanggal} agar mudah diganti saat membuat surat asli.
                </p>
              </div>
              <textarea v-model="form.konten_template" class="input-field w-full h-80 font-serif leading-relaxed" required placeholder="Tulis kerangka surat di sini..."></textarea>
            </div>
          </form>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
            Batal
          </button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan Template' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useLogger } from '@/utils/logger'
import { Plus as PlusIcon, FileText as FileTextIcon, X as XIcon } from 'lucide-vue-next'
import type { SuratTemplate } from '@/types'

const { logActivity } = useLogger()

const templates = ref<SuratTemplate[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  nama_template: '',
  konten_template: ''
})

const fetchTemplates = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('surat_template')
      .select('*')
      .order('nama_template', { ascending: true })

    if (error) throw error
    templates.value = data || []
  } catch (e: any) {
    console.warn('Gagal mengambil template:', e.message)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    nama_template: '',
    konten_template: ''
  }
  showModal.value = true
}

const openEditModal = (item: SuratTemplate) => {
  editingId.value = item.id
  form.value = { ...item }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingId.value) {
      const { error } = await supabase
        .from('surat_template')
        .update(form.value)
        .eq('id', editingId.value)
      if (error) throw error
      await logActivity('UPDATE_TEMPLATE_SURAT', 'surat_template', form.value)
    } else {
      const { error } = await supabase
        .from('surat_template')
        .insert([form.value])
      if (error) throw error
      await logActivity('ADD_TEMPLATE_SURAT', 'surat_template', form.value)
    }

    showModal.value = false
    await fetchTemplates()
  } catch (e: any) {
    alert('Gagal menyimpan: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return

  try {
    const { error } = await supabase
      .from('surat_template')
      .delete()
      .eq('id', id)
    if (error) throw error
    await logActivity('DELETE_TEMPLATE_SURAT', 'surat_template', { id })
    await fetchTemplates()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  }
}

const copyTemplate = (text: string) => {
  navigator.clipboard.writeText(text)
  alert('Asiik! Template berhasil disalin ke clipboard.')
}

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

onMounted(fetchTemplates)
</script>
