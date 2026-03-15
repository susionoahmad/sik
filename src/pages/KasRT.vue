<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Buku Kas {{ settingsStore.settings.orgType }}</h2>
        <p class="text-slate-500 text-sm">Rekapitulasi transaksi kas dan rekening.</p>
      </div>
      <button @click="openTransferModal" class="btn-secondary flex items-center gap-2">
        <span>⇆ Transfer Antar Kas</span>
      </button>
    </div>

    <!-- Rekening Cards (per account summary) -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- Semua Rekening (gabungan) -->
      <div @click="filterRekening = null" :class="[
        'card cursor-pointer transition-all border-2',
        filterRekening === null ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-slate-300'
      ]">
        <p class="text-xs font-bold uppercase text-slate-500 mb-1">Gabungan Semua Kas</p>
        <div class="flex items-end justify-between mt-2">
          <div class="space-y-0.5 text-xs text-slate-500">
            <p>Saldo awal: <span class="font-semibold">{{ formatCurrency(totalSaldoAwalGabungan) }}</span></p>
            <p>+ Masuk: <span class="text-green-600 font-semibold">{{ formatCurrency(totalMasukGabungan) }}</span></p>
            <p>− Keluar: <span class="text-red-600 font-semibold">{{ formatCurrency(totalKeluarGabungan) }}</span></p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Saldo Akhir</p>
            <p class="text-xl font-bold" :class="saldoAkhirGabungan >= 0 ? 'text-primary-700' : 'text-red-600'">
              {{ formatCurrency(saldoAkhirGabungan) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Per Rekening -->
      <div v-for="rek in rekeningList" :key="rek.id" @click="filterRekening = rek.id" :class="[
        'card cursor-pointer transition-all border-2',
        filterRekening === rek.id ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-slate-300'
      ]">
        <div class="flex justify-between items-start mb-1">
          <p class="text-xs font-bold uppercase text-slate-500">{{ rek.nama_rekening }}</p>
          <span :class="[
            'text-xs px-2 py-0.5 rounded-full font-semibold',
            rek.jenis === 'tunai' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          ]">{{ rek.jenis }}</span>
        </div>
        <p class="text-xs text-slate-400 mb-2">Saldo awal: {{ formatCurrency(rek.saldo_awal) }}</p>
        <div class="flex items-end justify-between">
          <div class="space-y-0.5 text-xs text-slate-500">
            <p>+ Masuk: <span class="text-green-600 font-semibold">{{ formatCurrency(getRekeningMasuk(rek.id)) }}</span>
            </p>
            <p>− Keluar: <span class="text-red-600 font-semibold">{{ formatCurrency(getRekeningKeluar(rek.id)) }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Saldo Akhir</p>
            <p class="text-xl font-bold" :class="getSaldoAkhir(rek) >= 0 ? 'text-primary-700' : 'text-red-600'">
              {{ formatCurrency(getSaldoAkhir(rek)) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card flex flex-col md:flex-row gap-4 justify-between items-center">
      <div class="flex gap-2 flex-wrap">
        <select v-model="filterBulan" class="input-field !py-1 w-36">
          <option :value="0">Semua Bulan</option>
          <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
        </select>
        <select v-model="filterTahun" class="input-field !py-1 w-24">
          <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-1 text-green-600 font-bold">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          Masuk: {{ formatCurrency(totalMasuk) }}
        </div>
        <div class="flex items-center gap-1 text-red-600 font-bold">
          <span class="w-2 h-2 rounded-full bg-red-500"></span>
          Keluar: {{ formatCurrency(totalKeluar) }}
        </div>
        <div class="flex items-center gap-1 font-bold text-primary-700">
          Saldo Akhir Total: {{ formatCurrency(saldoAkhirGabungan) }}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Rekening</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4">Keterangan</th>
              <th class="px-6 py-4">Masuk</th>
              <th class="px-6 py-4">Keluar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td colspan="6" class="px-6 py-4">
                <div class="h-4 bg-slate-200 rounded w-full"></div>
              </td>
            </tr>
            <tr v-else-if="filteredList.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500 italic">
                Tidak ada riwayat transaksi untuk periode ini.
              </td>
            </tr>
            <tr v-else v-for="(item) in filteredList" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm">{{ formatDate(item.tanggal) }}</td>
              <td class="px-6 py-4 text-xs">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  item.jenis === 'masuk' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                ]">
                  {{ getRekeningName(item.rekening_id) }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-bold uppercase text-slate-500">{{ item.kategori }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{{ item.keterangan }}</td>
              <td class="px-6 py-4 text-green-600 font-medium">
                {{ item.jenis === 'masuk' ? formatCurrency(item.jumlah) : '-' }}
              </td>
              <td class="px-6 py-4 text-red-600 font-medium">
                {{ item.jenis === 'keluar' ? formatCurrency(item.jumlah) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Transfer -->
    <div v-if="showTransferModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full">
        <h3 class="text-xl font-bold mb-6 text-slate-800">Transfer Antar Kas</h3>

        <form @submit.prevent="handleTransferSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input v-model="transferForm.tanggal" type="date" class="input-field" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Dari Kas/Rekening</label>
              <select v-model="transferForm.rekening_sumber_id" class="input-field" required>
                <option disabled value="">Pilih rekening</option>
                <option v-for="rek in rekeningList" :key="rek.id" :value="rek.id">
                  {{ rek.nama_rekening }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Ke Kas/Rekening</label>
              <select v-model="transferForm.rekening_tujuan_id" class="input-field" required>
                <option disabled value="">Pilih rekening</option>
                <option v-for="rek in rekeningList" :key="rek.id" :value="rek.id">
                  {{ rek.nama_rekening }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
            <input v-model.number="transferForm.jumlah" type="number" class="input-field" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan (Opsional)</label>
            <input v-model="transferForm.keterangan" type="text" class="input-field"
              placeholder="Contoh: Pindah dana" />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showTransferModal = false"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
            <button type="submit" class="btn-primary" :disabled="transferSubmitting">
              {{ transferSubmitting ? 'Memproses...' : 'Simpan Transfer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import type { KasTransaksi, RekeningKas } from '@/types'

const settingsStore = useSettingsStore()

const allList = ref<KasTransaksi[]>([]) // period-filtered for the table
const allTimeList = ref<KasTransaksi[]>([]) // all transactions ever (for card summaries)
const rekeningList = ref<RekeningKas[]>([])
const loading = ref(true)
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const filterRekening = ref<string | null>(null)

// State for transfer modal
const showTransferModal = ref(false)
const transferSubmitting = ref(false)
const transferForm = ref({
  tanggal: new Date().toISOString().split('T')[0],
  rekening_sumber_id: '',
  rekening_tujuan_id: '',
  jumlah: 0,
  keterangan: ''
})

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const fetchKas = async () => {
  loading.value = true

  const startDay = `${filterTahun.value}-${String(filterBulan.value || 1).padStart(2, '0')}-01`
  const lastDayVal = filterBulan.value === 0
    ? `${filterTahun.value}-12-31`
    : new Date(filterTahun.value, filterBulan.value, 0).toISOString().split('T')[0]

  let query = supabase.from('kas_transaksi').select('*')

  if (filterBulan.value !== 0) {
    query = query.gte('tanggal', startDay).lte('tanggal', lastDayVal)
  } else {
    query = query.gte('tanggal', `${filterTahun.value}-01-01`).lte('tanggal', `${filterTahun.value}-12-31`)
  }

  const { data, error } = await query.order('tanggal', { ascending: true }).order('created_at', { ascending: true })

  if (error) {
    alert('Gagal mengambil data kas: ' + error.message)
  } else {
    allList.value = data || []
  }
  loading.value = false
}

const fetchAllTime = async () => {
  const { data } = await supabase
    .from('kas_transaksi')
    .select('*')
    .order('tanggal', { ascending: true })
  allTimeList.value = data || []
}

// All transactions for this period (for gabungan summary)
const totalMasukGabungan = computed(() => allTimeList.value.filter(t => t.jenis === 'masuk' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0))
const totalKeluarGabungan = computed(() => allTimeList.value.filter(t => t.jenis === 'keluar' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0))

// For saldo akhir, we MUST include transfers otherwise individual balances would be wrong if aggregated (although technically Gabungan saldo is immune to internal transfers since + and - cancel out, we'll keep the logic simple)
const totalMasukActualGabungan = computed(() => allTimeList.value.filter(t => t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0))
const totalKeluarActualGabungan = computed(() => allTimeList.value.filter(t => t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0))

const totalSaldoAwalGabungan = computed(() => rekeningList.value.reduce((a, b) => a + Number(b.saldo_awal), 0))
const saldoAkhirGabungan = computed(() => totalSaldoAwalGabungan.value + totalMasukActualGabungan.value - totalKeluarActualGabungan.value)

// Filtered by selected rekening
const list2 = computed(() => {
  if (filterRekening.value === null) return allList.value
  return allList.value.filter(t => t.rekening_id === filterRekening.value)
})

const totalMasuk = computed(() => list2.value.filter(t => t.jenis === 'masuk' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0))
const totalKeluar = computed(() => list2.value.filter(t => t.jenis === 'keluar' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0))

const filteredList = computed(() => [...list2.value].reverse())

// Per rekening helpers for cards (use allTimeList to get full balance)
// ONLY for displaying +Masuk and -Keluar badge: we ignore transfers
const getRekeningMasuk = (id: string) =>
  allTimeList.value.filter(t => t.rekening_id === id && t.jenis === 'masuk' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0)

const getRekeningKeluar = (id: string) =>
  allTimeList.value.filter(t => t.rekening_id === id && t.jenis === 'keluar' && t.kategori !== 'Transfer Antar Kas').reduce((a, b) => a + Number(b.jumlah), 0)

// For calculating ACTUAL BALANCE, we MUST INCLUDE the transfers
const getActualRekeningMasuk = (id: string) =>
  allTimeList.value.filter(t => t.rekening_id === id && t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)

const getActualRekeningKeluar = (id: string) =>
  allTimeList.value.filter(t => t.rekening_id === id && t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)

const getSaldoAkhir = (rek: RekeningKas) =>
  Number(rek.saldo_awal) + getActualRekeningMasuk(rek.id) - getActualRekeningKeluar(rek.id)


const getRekeningName = (id?: string) => {
  if (!id) return '-'
  return rekeningList.value.find(r => r.id === id)?.nama_rekening ?? '-'
}

const fetchRekening = async () => {
  const { data } = await supabase.from('rekening_kas').select('*').order('nama_rekening', { ascending: true })
  rekeningList.value = data || []
}

const openTransferModal = () => {
  transferForm.value = {
    tanggal: new Date().toISOString().split('T')[0],
    rekening_sumber_id: '',
    rekening_tujuan_id: '',
    jumlah: 0,
    keterangan: ''
  }
  showTransferModal.value = true
}

const handleTransferSubmit = async () => {
  if (transferForm.value.rekening_sumber_id === transferForm.value.rekening_tujuan_id) {
    alert('Rekening sumber dan tujuan tidak boleh sama.')
    return
  }
  if (transferForm.value.jumlah <= 0) {
    alert('Jumlah transfer harus lebih dari 0.')
    return
  }

  transferSubmitting.value = true
  try {
    const rekeningSumber = rekeningList.value.find(r => r.id === transferForm.value.rekening_sumber_id)
    const rekeningTujuan = rekeningList.value.find(r => r.id === transferForm.value.rekening_tujuan_id)

    const transactionsToInsert = [
      // Pengeluaran dari rekening sumber
      {
        tanggal: transferForm.value.tanggal,
        jenis: 'keluar',
        kategori: 'Transfer Antar Kas',
        keterangan: `Transfer ke ${rekeningTujuan?.nama_rekening}. ${transferForm.value.keterangan}`.trim(),
        jumlah: transferForm.value.jumlah,
        rekening_id: transferForm.value.rekening_sumber_id
      },
      // Pemasukan ke rekening tujuan
      {
        tanggal: transferForm.value.tanggal,
        jenis: 'masuk',
        kategori: 'Transfer Antar Kas',
        keterangan: `Transfer dari ${rekeningSumber?.nama_rekening}. ${transferForm.value.keterangan}`.trim(),
        jumlah: transferForm.value.jumlah,
        rekening_id: transferForm.value.rekening_tujuan_id
      }
    ]

    const { error } = await supabase.from('kas_transaksi').insert(transactionsToInsert)
    if (error) throw error

    alert('Transfer berhasil dicatat.')
    showTransferModal.value = false
    await Promise.all([fetchKas(), fetchAllTime()])
  } catch (e: any) {
    alert('Gagal melakukan transfer: ' + e.message)
  } finally {
    transferSubmitting.value = false
  }
}

watch([filterBulan, filterTahun], fetchKas)
watch(filterRekening, () => { }) // reactive trigger for list2

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchKas()
  fetchAllTime()
  fetchRekening()
})
</script>
