<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Manajemen {{ settingsStore.residentLabel }}</h2>
        <p class="text-slate-500 text-sm">Kelola data {{ settingsStore.residentLabel.toLowerCase() }} {{ settingsStore.organizationLabel }} Anda di sini.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <span>+ Tambah {{ settingsStore.residentLabel }}</span>
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card flex items-center gap-4">
        <div class="bg-primary-100 text-primary-600 p-3 rounded-lg text-xl">🏠</div>
        <div>
          <p class="text-slate-500 text-sm">Total {{ settingsStore.residentLabel }}</p>
          <p class="text-2xl font-bold">{{ wargaList.length }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden !p-0">
      <div class="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
        <input v-model="search" type="text" placeholder="Cari nama atau no rumah..." class="input-field max-w-sm" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">No. Rumah</th>
              <th class="px-6 py-4">Nama Kepala Keluarga</th>
              <th class="px-6 py-4">Alamat</th>
              <th class="px-6 py-4">No. HP</th>
              <th class="px-6 py-4">Status Warga</th>
              <th class="px-6 py-4">Status Hunian</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="6" class="px-6 py-4">
                <div class="h-4 bg-slate-200 rounded w-full"></div>
              </td>
            </tr>
            <tr v-else-if="filteredWarga.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500 italic">
                Data warga tidak ditemukan.
              </td>
            </tr>
            <tr v-else v-for="item in filteredWarga" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900">{{ item.no_rumah }}</td>
              <td class="px-6 py-4">{{ item.nama_kepala_keluarga }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ item.alamat }}</td>
              <td class="px-6 py-4 text-sm">{{ item.no_hp }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold uppercase',
                  item.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold uppercase',
                  item.status_hunian === 'sendiri' ? 'bg-blue-100 text-blue-700' :
                  item.status_hunian === 'kontrak' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                ]">
                  {{ item.status_hunian === 'sendiri' ? 'Milik Sendiri' : item.status_hunian === 'kontrak' ? 'Kontrak' : 'Kosong' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="openEditModal(item)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-semibold">Edit</button>
                <button @click="openIuranModal(item)"
                  class="text-amber-500 hover:text-amber-600 text-sm font-semibold whitespace-nowrap">Iuran Khusus</button>
                <button @click="handleDelete(item.id)"
                  class="text-red-500 hover:text-red-600 text-sm font-semibold">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Iuran Khusus -->
    <div v-if="showIuranModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-lg w-full max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-bold text-slate-800">Iuran Khusus (Keringanan)</h3>
        <p class="text-sm text-slate-500 mb-4">Warga: {{ selectedWarga?.nama_kepala_keluarga }} ({{ selectedWarga?.no_rumah }})</p>

        <div v-if="loadingIuran" class="p-8 text-center text-slate-500">
          Memuat data...
        </div>
        <form v-else @submit.prevent="handleIuranSubmit" class="space-y-4 overflow-y-auto flex-1 pr-2">
          <div v-if="iuranForm.length === 0" class="text-sm text-slate-500 italic text-center p-4">
            Tidak ada jenis iuran aktif.
          </div>
          <div v-for="item in iuranForm" :key="item.jenis_iuran_id" class="p-3 border rounded-lg bg-slate-50">
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="font-medium text-slate-700">{{ item.nama_iuran }}</span>
                <span class="text-xs px-2 py-1 bg-slate-200 rounded text-slate-600">Default: Rp {{ item.nominal_default.toLocaleString() }}</span>
              </div>
              <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mt-1">
                <input type="checkbox" v-model="item.isCustom" class="w-4 h-4 accent-primary-600 rounded" />
                <span>Gunakan Nominal Khusus</span>
              </label>
              <div v-if="item.isCustom" class="mt-2">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Nominal Khusus (Rp)</label>
                <input type="number" v-model.number="item.nominal" class="input-field" :required="item.isCustom" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t mt-4">
            <button type="button" @click="showIuranModal = false"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
            <button type="submit" class="btn-primary" :disabled="submittingIuran">
              {{ submittingIuran ? 'Menyimpan...' : 'Simpan Pengaturan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-lg w-full">
        <h3 class="text-xl font-bold mb-6 text-slate-800">{{ editingId ? 'Edit Data Warga' : 'Tambah Warga Baru' }}</h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">No. Rumah</label>
              <input v-model="form.no_rumah" type="text" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select v-model="form.status" class="input-field">
                <option value="aktif">Aktif</option>
                <option value="non-aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Status Hunian</label>
            <select v-model="form.status_hunian" class="input-field">
              <option value="sendiri">Milik Sendiri</option>
              <option value="kontrak">Kontrak</option>
              <option value="kosong">Kosong</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Kepala Keluarga</label>
            <input v-model="form.nama_kepala_keluarga" type="text" class="input-field" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">No. HP (WhatsApp)</label>
            <input v-model="form.no_hp" type="text" class="input-field" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
            <textarea v-model="form.alamat" class="input-field h-24" required></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModal = false"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan Data' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import { withTimeout } from '@/utils/promise'
import { useLogger } from '@/utils/logger'
import type { Warga, JenisIuran } from '@/types'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const wargaList = ref<Warga[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const search = ref('')
const editingId = ref<string | null>(null)

// State Iuran Khusus
const showIuranModal = ref(false)
const loadingIuran = ref(false)
const submittingIuran = ref(false)
const selectedWarga = ref<Warga | null>(null)
const iuranForm = ref<{
  jenis_iuran_id: string;
  nama_iuran: string;
  nominal_default: number;
  isCustom: boolean;
  nominal: number;
}[]>([])

const form = ref({
  no_rumah: '',
  nama_kepala_keluarga: '',
  alamat: '',
  no_hp: '',
  status: 'aktif' as 'aktif' | 'non-aktif',
  status_hunian: 'sendiri' as 'sendiri' | 'kontrak' | 'kosong'
})

const filteredWarga = computed(() => {
  return wargaList.value.filter(item =>
    item.nama_kepala_keluarga.toLowerCase().includes(search.value.toLowerCase()) ||
    item.no_rumah.toLowerCase().includes(search.value.toLowerCase())
  )
})

const fetchWarga = async () => {
  loading.value = true
  try {
    const fetching = supabase
      .from('warga')
      .select('*')
      .order('no_rumah', { ascending: true })

    const { data, error } = await withTimeout(fetching as any, 8000) as any

    if (error) {
      alert('Gagal mengambil data warga: ' + error.message)
    } else {
      wargaList.value = (data || []).sort((a: any, b: any) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
    }
  } catch (e: any) {
    console.error('Fetch warga timeout or error:', e)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    no_rumah: '',
    nama_kepala_keluarga: '',
    alamat: '',
    no_hp: '',
    status: 'aktif',
    status_hunian: 'sendiri'
  }
  showModal.value = true
}

const openEditModal = (item: Warga) => {
  editingId.value = item.id
  form.value = { ...item }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  console.log('Submitting warga form...', form.value)

  try {
    if (editingId.value) {
      console.log('Updating existing warga with ID:', editingId.value)
      const { error } = await supabase
        .from('warga')
        .update(form.value)
        .eq('id', editingId.value)
      if (error) {
        console.error('Supabase Update Error:', error)
        throw error
      }
    } else {
      console.log('Inserting new warga')
      const { error } = await supabase
        .from('warga')
        .insert([form.value])
      if (error) {
        console.error('Supabase Insert Error:', error)
        throw error
      }
    }

    console.log('Save successful, fetching updated list...')
    
    await logActivity(editingId.value ? 'UPDATE_WARGA' : 'ADD_WARGA', 'warga', {
      id: editingId.value,
      ...form.value
    })

    showModal.value = false
    await fetchWarga()
    console.log('Warga list refreshed')
  } catch (e: any) {
    console.error('Caught error in handleSubmit:', e)
    alert('Gagal menyimpan: ' + (e.message || e.details || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus data warga ini?')) return

  const { error } = await supabase
    .from('warga')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Gagal menghapus: ' + error.message)
  } else {
    await logActivity('DELETE_WARGA', 'warga', { id })
    await fetchWarga()
  }
}

// Iuran Khusus Logic
const openIuranModal = async (warga: Warga) => {
  selectedWarga.value = warga
  showIuranModal.value = true
  loadingIuran.value = true

  try {
    // 1. Fetch active jenis iuran
    const { data: iuranData, error: iuranErr } = await supabase
      .from('jenis_iuran')
      .select('*')
      .eq('is_active', true)
      .order('nama_iuran', { ascending: true })
    if (iuranErr) throw iuranErr

    // 2. Fetch existing custom iuran for this warga
    const { data: customData, error: customErr } = await supabase
      .from('iuran_warga')
      .select('*')
      .eq('warga_id', warga.id)
    if (customErr) throw customErr

    const customMap = new Map((customData || []).map(c => [c.jenis_iuran_id, c.nominal]))

    // 3. Build form
    iuranForm.value = (iuranData as JenisIuran[] || []).map(i => ({
      jenis_iuran_id: i.id,
      nama_iuran: i.nama_iuran,
      nominal_default: Number(i.nominal_default),
      isCustom: customMap.has(i.id),
      nominal: customMap.has(i.id) ? Number(customMap.get(i.id)) : Number(i.nominal_default)
    }))

  } catch (e: any) {
    alert('Gagal mengambil data iuran khusus: ' + (e.message || 'Unknown error'))
  } finally {
    loadingIuran.value = false
  }
}

const handleIuranSubmit = async () => {
  if (!selectedWarga.value) return
  submittingIuran.value = true

  try {
    const wId = selectedWarga.value.id
    const toInsert = []
    const toDeleteIds = []

    // 1. Determine what to keep/upsert and what to delete
    for (const item of iuranForm.value) {
      if (item.isCustom) {
        toInsert.push({
          warga_id: wId,
          jenis_iuran_id: item.jenis_iuran_id,
          nominal: item.nominal
        })
      } else {
        toDeleteIds.push(item.jenis_iuran_id)
      }
    }

    // 2. Delete non-customs (revert to default)
    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from('iuran_warga')
        .delete()
        .eq('warga_id', wId)
        .in('jenis_iuran_id', toDeleteIds)
      if (delErr) throw delErr
    }

    // 3. Upsert custom amounts
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase
        .from('iuran_warga')
        .upsert(toInsert, { onConflict: 'warga_id, jenis_iuran_id' })
      if (insErr) throw insErr
    }

    await logActivity('UPDATE_WARGA_IURAN', 'iuran_warga', {
      warga_id: selectedWarga.value?.id,
      warga_name: selectedWarga.value?.nama_kepala_keluarga,
      details: iuranForm.value.filter(f => f.isCustom)
    })
    alert('Pengaturan iuran khusus berhasil disimpan.')
    showIuranModal.value = false
  } catch (e: any) {
    alert('Gagal menyimpan pengaturan iuran khusus: ' + (e.message || 'Unknown error'))
  } finally {
    submittingIuran.value = false
  }
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchWarga()
})
</script>
