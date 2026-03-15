<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-slate-800">Transparansi Keuangan {{ settingsStore.organizationLabel }}</h2>
      <p class="text-slate-500">Informasi keuangan terbuka untuk seluruh warga.</p>
    </div>

    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <p class="text-slate-500 text-sm font-medium">Saldo Kas Saat Ini</p>
        <h3 class="text-3xl font-bold mt-1" :class="saldo >= 0 ? 'text-primary-600' : 'text-red-600'">{{
          formatCurrency(saldo) }}</h3>
      </div>
      <div class="card">
        <p class="text-slate-500 text-sm font-medium">Total Pemasukan</p>
        <h3 class="text-3xl font-bold mt-1 text-green-600">{{ formatCurrency(totalMasuk) }}</h3>
      </div>
      <div class="card">
        <p class="text-slate-500 text-sm font-medium">Total Pengeluaran</p>
        <h3 class="text-3xl font-bold mt-1 text-red-600">{{ formatCurrency(totalKeluar) }}</h3>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-bold text-slate-800 mb-6">Distribusi Pemasukan</h3>
        <div class="h-64 flex items-center justify-center">
          <Doughnut v-if="loaded" :data="incomeDistData" :options="chartOptions" />
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold text-slate-800 mb-6">Distribusi Pengeluaran</h3>
        <div class="h-64 flex items-center justify-center">
          <Doughnut v-if="loaded" :data="expenseDistData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Latest Activities -->
    <div class="card px-2 overflow-hidden">
      <h3 class="font-bold text-slate-800 px-6 py-4 border-b border-slate-100">Riwayat Transaksi Terakhir</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th class="px-6 py-3">Tanggal</th>
              <th class="px-6 py-3">Kategori</th>
              <th class="px-6 py-3">Keterangan</th>
              <th class="px-6 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 italic">
            <tr v-for="t in recentTransactions" :key="t.id" class="hover:bg-slate-50">
              <td class="px-6 py-4 text-xs">{{ formatDate(t.tanggal) }}</td>
              <td class="px-6 py-4"><span class="text-xs font-bold uppercase">{{ t.kategori }}</span></td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ t.keterangan }}</td>
              <td class="px-6 py-4 text-right">
                <span :class="['font-bold text-sm', t.jenis === 'masuk' ? 'text-green-600' : 'text-red-600']">
                  {{ t.jenis === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.jumlah) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const settingsStore = useSettingsStore()
const loaded = ref(false)
const list = ref<any[]>([])
const rekeningList = ref<any[]>([])
const recentTransactions = ref<any[]>([])

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const totalMasuk = computed(() => list.value.filter(t => t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0))
const totalKeluar = computed(() => list.value.filter(t => t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0))
const totalSaldoAwal = computed(() => rekeningList.value.reduce((a, b) => a + Number(b.saldo_awal), 0))
const saldo = computed(() => totalSaldoAwal.value + totalMasuk.value - totalKeluar.value)

const incomeDistData = computed(() => {
  const categories = [...new Set(list.value.filter(t => t.jenis === 'masuk').map(t => t.kategori))]
  const data = categories.map(cat => list.value.filter(t => t.kategori === cat).reduce((a, b) => a + Number(b.jumlah), 0))
  return {
    labels: categories,
    datasets: [{
      backgroundColor: ['#0ea5e9', '#06b6d4', '#10b981', '#6366f1'],
      data
    }]
  }
})

const expenseDistData = computed(() => {
  const categories = [...new Set(list.value.filter(t => t.jenis === 'keluar').map(t => t.kategori))]
  const data = categories.map(cat => list.value.filter(t => t.kategori === cat).reduce((a, b) => a + Number(b.jumlah), 0))
  return {
    labels: categories,
    datasets: [{
      backgroundColor: ['#f43f5e', '#fb7185', '#fb923c', '#facc15'],
      data
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const }
  }
}

const fetchData = async () => {
  const [{ data: all }, { data: rekening }] = await Promise.all([
    supabase.from('kas_transaksi').select('*').order('tanggal', { ascending: false }),
    supabase.from('rekening_kas').select('saldo_awal')
  ])
  list.value = all || []
  rekeningList.value = rekening || []
  recentTransactions.value = list.value.slice(0, 10)
  loaded.value = true
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchData()
})
</script>
