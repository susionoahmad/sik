<template>
  <div class="space-y-6">
    <!-- Header Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.label" class="card flex flex-col justify-between">
        <p class="text-slate-500 text-sm font-medium">{{ stat.label }}</p>
        <div class="flex items-end justify-between mt-2">
          <h3 class="text-2xl font-bold" :class="stat.color">{{ stat.value }}</h3>
          <span class="text-2xl">{{ stat.icon }}</span>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-bold text-slate-800 mb-6">Pemasukan vs Pengeluaran</h3>
        <div class="h-64 flex items-center justify-center">
          <Bar v-if="loaded" :data="barData" :options="chartOptions" />
          <div v-else class="animate-pulse flex space-x-4">Loading Chart...</div>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold text-slate-800 mb-6">Status Pembayaran Iuran Warga</h3>
        <div class="h-64 flex items-center justify-center">
          <Doughnut v-if="loaded" :data="doughnutData" :options="chartOptions" />
          <div v-else class="animate-pulse flex space-x-4">Loading Chart...</div>
        </div>
      </div>
    </div>

    <!-- Organizational Structure Flowchart -->
    <div v-if="settingsStore.settings.structure && settingsStore.settings.structure.length > 0" class="card">
      <h3 class="font-bold text-slate-800 mb-8 flex items-center gap-2">
        <span>Struktur Organisasi {{ settingsStore.organizationLabel }}</span>
      </h3>
      
      <div class="relative py-4 overflow-x-auto">
        <div class="flex flex-col items-center min-w-[600px]">
          <!-- Top Level (Ketua) -->
          <div class="flex gap-8 mb-12 relative">
            <div v-for="chief in settingsStore.settings.structure.filter((s: any) => s.role.toLowerCase().includes('ketua'))" :key="chief.name" 
              class="relative z-10 flex flex-col items-center">
              <div class="bg-primary-600 text-white p-4 rounded-xl shadow-lg border-2 border-primary-500 w-48 text-center transition-transform hover:scale-105">
                <p class="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">{{ chief.role }}</p>
                <p class="font-bold text-sm">{{ chief.name }}</p>
              </div>
              <!-- Connector Line Down -->
              <div class="h-12 w-0.5 bg-slate-200 mt-0"></div>
            </div>
          </div>

          <!-- Vertical Connector Line -->
          <div class="h-0.5 w-full max-w-2xl bg-slate-200 -mt-12 mb-0"></div>

          <!-- Middle Level (Staffs) -->
          <div class="flex flex-wrap justify-center gap-6 pt-0">
            <div v-for="staff in settingsStore.settings.structure.filter((s: any) => !s.role.toLowerCase().includes('ketua'))" :key="staff.name" 
              class="flex flex-col items-center">
              <!-- Connector Line Down -->
              <div class="h-8 w-0.5 bg-slate-200"></div>
              <div class="bg-white p-4 rounded-xl shadow-md border border-slate-200 w-44 text-center transition-all hover:shadow-lg hover:border-primary-200 group">
                <p class="text-[10px] uppercase font-black tracking-widest text-primary-600 mb-1 opacity-80">{{ staff.role }}</p>
                <p class="font-bold text-slate-800 text-sm group-hover:text-primary-700">{{ staff.name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-slate-800">Transaksi Terbaru</h3>
        <router-link to="/kas-rt" class="text-primary-600 text-sm font-semibold hover:underline">Lihat
          Semua</router-link>
      </div>
      <div class="space-y-4">
        <div v-for="t in recentTransactions" :key="t.id"
          class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center text-lg',
              t.jenis === 'masuk' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            ]">
              {{ t.jenis === 'masuk' ? '↓' : '↑' }}
            </div>
            <div>
              <p class="font-semibold text-slate-800">{{ t.keterangan }}</p>
              <p class="text-xs text-slate-500 italic">{{ t.kategori }} • {{ formatDate(t.tanggal) }}</p>
            </div>
          </div>
          <p :class="['font-bold', t.jenis === 'masuk' ? 'text-green-600' : 'text-red-600']">
            {{ t.jenis === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.jumlah) }}
          </p>
        </div>
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
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import { withTimeout } from '@/utils/promise'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const settingsStore = useSettingsStore()
const loaded = ref(false)
const totalPemasukanBulanIni = ref(0)
const totalPengeluaranBulanIni = ref(0)
const saldoKasRT = ref(0)
const unpaidBills = ref(0)
const paidBills = ref(0)
const recentTransactions = ref<any[]>([])

const stats = computed(() => [
  { label: `Saldo Kas ${settingsStore.settings.orgType}`, value: formatCurrency(saldoKasRT.value), color: 'text-primary-600', icon: '💰' },
  { label: 'Pemasukan Bulan Ini', value: formatCurrency(totalPemasukanBulanIni.value), color: 'text-green-600', icon: '📈' },
  { label: 'Pengeluaran Bulan Ini', value: formatCurrency(totalPengeluaranBulanIni.value), color: 'text-red-600', icon: '📉' },
  { label: 'Tagihan Belum Bayar', value: unpaidBills.value.toString(), color: 'text-amber-600', icon: '📋' }
])

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const barData = computed(() => ({
  labels: [bulanNames[new Date().getMonth()]],
  datasets: [
    { label: 'Pemasukan', backgroundColor: '#0ea5e9', data: [totalPemasukanBulanIni.value] },
    { label: 'Pengeluaran', backgroundColor: '#f43f5e', data: [totalPengeluaranBulanIni.value] }
  ]
}))

const doughnutData = computed(() => ({
  labels: ['Lunas', 'Belum Bayar'],
  datasets: [{
    backgroundColor: ['#10b981', '#f59e0b'],
    data: [paidBills.value || 0, unpaidBills.value || 0]
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const }
  }
}

const fetchDashboardData = async () => {
  try {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Use Promise.all with timeout to fetch data in parallel
    const fetching = Promise.all([
      // 1. Month Totals
      supabase.from('kas_transaksi')
        .select('jenis, jumlah')
        .gte('tanggal', currentMonthStart)
        .lte('tanggal', currentMonthEnd),
      
      // 2. All Time Totals (only needed columns)
      supabase.from('kas_transaksi').select('jenis, jumlah'),
      
      // 3. Initial Balance
      supabase.from('rekening_kas').select('saldo_awal'),
      
      // 4. Bill Status
      supabase.from('tagihan').select('status'),
      
      // 5. Recent Transactions
      supabase.from('kas_transaksi')
        .select('id, keterangan, kategori, tanggal, jenis, jumlah')
        .order('tanggal', { ascending: false })
        .limit(5)
    ])

    const [monthKasRes, allKasRes, allRekeningRes, billsRes, recentRes] = await withTimeout(fetching as any, 8000) as any[]

    // Process results
    const currentKas = (monthKasRes.data || []) as any[]
    totalPemasukanBulanIni.value = currentKas
      .filter((t: any) => t.jenis === 'masuk' && t.kategori !== 'Transfer Antar Kas')
      .reduce((a: number, b: any) => a + Number(b.jumlah), 0)
    totalPengeluaranBulanIni.value = currentKas
      .filter((t: any) => t.jenis === 'keluar' && t.kategori !== 'Transfer Antar Kas')
      .reduce((a: number, b: any) => a + Number(b.jumlah), 0)

    const allKas = (allKasRes.data || []) as any[]
    // Saldo kas RT should technically include everything to be accurate, but transfers sum to 0 anyway
    // so it doesn't matter if we include them or not for the overall balance.
    const totalM = allKas.filter((t: any) => t.jenis === 'masuk').reduce((a: number, b: any) => a + Number(b.jumlah), 0)
    const totalK = allKas.filter((t: any) => t.jenis === 'keluar').reduce((a: number, b: any) => a + Number(b.jumlah), 0)
    const totalSaldoAwal = (allRekeningRes.data || [] as any[]).reduce((a: number, b: any) => a + Number(b.saldo_awal), 0)

    saldoKasRT.value = totalSaldoAwal + totalM - totalK

    const bills = (billsRes.data || []) as any[]
    unpaidBills.value = bills.filter((b: any) => b.status === 'belum_bayar').length
    paidBills.value = bills.filter((b: any) => b.status === 'lunas').length

    recentTransactions.value = recentRes.data || []
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loaded.value = true
  }
}

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchDashboardData()
})
</script>
