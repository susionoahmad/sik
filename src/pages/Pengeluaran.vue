<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Catatan Pengeluaran</h2>
        <p class="text-slate-500 text-sm">Catat pengeluaran kas {{ settingsStore.settings.orgType }} dan biaya-biaya operasional.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <span>+ Tambah Pengeluaran</span>
      </button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden !p-0">
      <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <h3 class="font-bold text-slate-800">Riwayat Pengeluaran</h3>
        <input v-model="search" type="text" placeholder="Cari keterangan..." class="input-field max-w-xs !py-1" />
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Dari Kas</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4">Keterangan</th>
              <th class="px-6 py-4">Jumlah</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="5" class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-full"></div></td>
            </tr>
            <tr v-else-if="filteredList.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">
                Belum ada data pengeluaran.
              </td>
            </tr>
            <tr v-else v-for="item in filteredList" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm">{{ formatDate(item.tanggal) }}</td>
              <td class="px-6 py-4 text-xs">
                <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                  {{ getRekeningName(item.rekening_id) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold uppercase">
                  {{ item.kategori }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ item.keterangan }}</td>
              <td class="px-6 py-4 font-bold text-red-600">-{{ formatCurrency(item.jumlah) }}</td>
              <td class="px-6 py-4 text-right">
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
        <h3 class="text-xl font-bold mb-6 text-slate-800">Tambah Pengeluaran</h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" class="input-field" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select v-model="form.kategori" class="input-field" required>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Listrik">Listrik &amp; Pompa</option>
              <option value="Operasional">Operasional {{ settingsStore.settings.orgType }}</option>
              <option value="Perawatan">Perawatan Infrastruktur</option>
              <option value="Biaya Adm Bank">Biaya Administrasi Bank</option>
              <option value="Biaya ATM">Biaya ATM / Transaksi Antar Bank</option>
              <option value="Pajak Tabungan">Potongan Pajak Bunga</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
            <input v-model="form.keterangan" type="text" class="input-field" placeholder="Masukkan rincian..." required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
            <input v-model.number="form.jumlah" type="number" class="input-field" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Dari Kas/Rekening</label>
            <select v-model="form.rekening_id" class="input-field" required>
              <option v-for="rek in rekeningList" :key="rek.id" :value="rek.id">
                {{ rek.nama_rekening }} ({{ rek.jenis }})
              </option>
            </select>
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
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import { useLogger } from '@/utils/logger'
import type { KasTransaksi, RekeningKas } from '@/types'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const list = ref<KasTransaksi[]>([])
const rekeningList = ref<RekeningKas[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const search = ref('')

const form = ref({
  tanggal: new Date().toISOString().split('T')[0],
  jenis: 'keluar' as const,
  kategori: 'Operasional',
  keterangan: '',
  jumlah: 0,
  rekening_id: ''
})

const filteredList = computed(() => {
  return list.value.filter(item => 
    item.keterangan.toLowerCase().includes(search.value.toLowerCase()) ||
    item.kategori.toLowerCase().includes(search.value.toLowerCase())
  )
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const fetchPengeluaran = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('kas_transaksi')
    .select('*')
    .eq('jenis', 'keluar')
    .order('tanggal', { ascending: false })
  
  if (error) {
    alert('Gagal mengambil data: ' + error.message)
  } else {
    list.value = data || []
  }
  loading.value = false
}

const openAddModal = () => {
  form.value = {
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'keluar',
    kategori: 'Operasional',
    keterangan: '',
    jumlah: 0,
    rekening_id: rekeningList.value[0]?.id ?? ''
  }
  showModal.value = true
}

const getRekeningName = (id?: string) => {
  if (!id) return 'Tidak diketahui'
  return rekeningList.value.find(r => r.id === id)?.nama_rekening ?? '-'
}

const fetchRekening = async () => {
  const { data } = await supabase.from('rekening_kas').select('*').order('nama_rekening', { ascending: true })
  rekeningList.value = data || []
  if ((rekeningList.value?.length ?? 0) > 0) {
    form.value.rekening_id = rekeningList.value[0]?.id ?? ''
  }
}

const handleSubmit = async () => {
  submitting.value = true
  const { error } = await supabase.from('kas_transaksi').insert([form.value])
  
  if (error) {
    alert('Gagal menyimpan: ' + error.message)
  } else {
    await logActivity('ADD_EXPENSE', 'kas_transaksi', { ...form.value })
    showModal.value = false
    await fetchPengeluaran()
  }
  submitting.value = false
}

const handleDelete = async (id: string) => {
  if (!confirm('Hapus catatan pengeluaran ini?')) return
  const { error } = await supabase.from('kas_transaksi').delete().eq('id', id)
  if (error) {
    alert('Gagal menghapus: ' + error.message)
  } else {
    await logActivity('DELETE_EXPENSE', 'kas_transaksi', { id })
    await fetchPengeluaran()
  }
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchPengeluaran()
  fetchRekening()
})
</script>
