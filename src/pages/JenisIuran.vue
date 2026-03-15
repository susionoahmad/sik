<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Jenis Iuran</h2>
        <p class="text-slate-500 text-sm">Atur jenis iuran bulanan yang berlaku.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <span>+ Tambah Jenis Iuran</span>
      </button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">Nama Iuran</th>
              <th class="px-6 py-4">Nominal Default</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="4" class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-full"></div></td>
            </tr>
            <tr v-else v-for="item in iuranList" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900 capitalize">{{ item.nama_iuran }}</td>
              <td class="px-6 py-4">{{ formatCurrency(item.nominal_default) }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold uppercase',
                  item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="openEditModal(item)" class="text-primary-600 hover:text-primary-700 text-sm font-semibold">Edit</button>
                <button @click="handleDelete(item.id)" class="text-red-500 hover:text-red-600 text-sm font-semibold">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full">
        <h3 class="text-xl font-bold mb-6 text-slate-800">{{ editingId ? 'Edit Jenis Iuran' : 'Tambah Jenis Iuran' }}</h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Iuran</label>
            <input v-model="form.nama_iuran" type="text" class="input-field" placeholder="Contoh: Kebersihan" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nominal Default (Rp)</label>
            <input v-model.number="form.nominal_default" type="number" class="input-field" required />
          </div>

          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" class="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
            <label for="is_active" class="text-sm font-medium text-slate-700">Aktifkan Iuran ini</label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { JenisIuran } from '@/types'

const iuranList = ref<JenisIuran[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  nama_iuran: '',
  nominal_default: 0,
  is_active: true
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const fetchIuran = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('jenis_iuran')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    alert('Gagal mengambil data: ' + error.message)
  } else {
    iuranList.value = data || []
  }
  loading.value = false
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    nama_iuran: '',
    nominal_default: 0,
    is_active: true
  }
  showModal.value = true
}

const openEditModal = (item: JenisIuran) => {
  editingId.value = item.id
  form.value = { 
    nama_iuran: item.nama_iuran,
    nominal_default: item.nominal_default,
    is_active: item.is_active
  }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  console.log('Submitting jenis iuran form...', form.value)
  try {
    if (editingId.value) {
      console.log('Updating existing iuran with ID:', editingId.value)
      const { error } = await supabase
        .from('jenis_iuran')
        .update(form.value)
        .eq('id', editingId.value)
      if (error) {
        console.error('Supabase Update Error:', error)
        throw error
      }
    } else {
      console.log('Inserting new iuran')
      const { error } = await supabase
        .from('jenis_iuran')
        .insert([form.value])
      if (error) {
        console.error('Supabase Insert Error:', error)
        throw error
      }
    }
    console.log('Save successful, fetching updated list...')
    showModal.value = false
    await fetchIuran()
    console.log('Iuran list refreshed')
  } catch (e: any) {
    console.error('Caught error in handleSubmit:', e)
    alert('Gagal menyimpan: ' + (e.message || e.details || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus jenis iuran ini?')) return
  const { error } = await supabase.from('jenis_iuran').delete().eq('id', id)
  if (error) alert('Gagal menghapus: ' + error.message)
  else await fetchIuran()
}

onMounted(fetchIuran)
</script>
