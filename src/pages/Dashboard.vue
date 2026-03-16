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

    <!-- Organizational Structure & Minutes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Organizational Structure -->
      <div v-if="settingsStore.settings.structure && settingsStore.settings.structure.length > 0" class="card">
        <h3 class="font-bold text-slate-800 mb-8 flex items-center gap-2">
          <span>Struktur Organisasi {{ settingsStore.organizationLabel }}</span>
        </h3>
        
        <div class="relative py-4 overflow-x-auto">
          <div class="flex flex-col items-center min-w-[300px]">
            <!-- Structure Flowchart (simplified for dashboard) -->
            <div class="flex flex-col items-center gap-4">
              <div v-for="member in settingsStore.settings.structure.slice(0, 5)" :key="member.name"
                class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-full flex justify-between items-center group hover:border-primary-200 transition-all">
                <p class="text-[10px] uppercase font-black tracking-widest text-primary-600 opacity-80">{{ member.role }}</p>
                <p class="font-bold text-slate-800 text-sm">{{ member.name }}</p>
              </div>
            </div>
            <router-link to="/struktur-organisasi" class="mt-4 text-xs font-bold text-slate-400 hover:text-primary-600 uppercase tracking-widest">Detail Struktur</router-link>
          </div>
        </div>
      </div>

      <!-- Recent Notulen -->
      <div class="card flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">📝</span>
            Notulen Rapat Terbaru
          </h3>
          <router-link to="/notulen" class="text-primary-600 text-sm font-semibold hover:underline">Semua</router-link>
        </div>
        
        <div v-if="!loaded" class="space-y-4 animate-pulse">
          <div v-for="i in 2" :key="i" class="h-20 bg-slate-50 rounded-2xl"></div>
        </div>
        <div v-else-if="recentNotulens.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm py-10">
          Belum ada catatan rapat.
        </div>
        <div v-else class="space-y-4 flex-1">
          <div v-for="n in recentNotulens" :key="n.id" 
            class="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-primary-500/5 transition-all group cursor-pointer"
            @click="selectedNotulen = n"
          >
            <div class="flex justify-between items-start mb-1">
              <h4 class="font-black text-slate-800 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">{{ n.judul_rapat }}</h4>
              <span class="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2 uppercase">{{ formatDate(n.tanggal_rapat) }}</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">"{{ n.keputusan }}"</p>
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

    <!-- Modal View Notulen -->
    <div v-if="selectedNotulen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100">
        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="text-lg font-black text-slate-800 tracking-tight">Detail Notulen Rapat</h3>
          <button @click="selectedNotulen = null" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1">Judul Rapat</p>
            <h2 class="text-2xl font-black text-slate-800 leading-tight">{{ selectedNotulen.judul_rapat }}</h2>
            <p class="text-sm font-bold text-slate-400 mt-1 uppercase">{{ formatDate(selectedNotulen.tanggal_rapat) }} • {{ selectedNotulen.lokasi }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pimpinan</p>
              <p class="text-sm font-bold text-slate-700">{{ selectedNotulen.pimpinan_rapat }}</p>
            </div>
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Notulis</p>
              <p class="text-sm font-bold text-slate-700">{{ selectedNotulen.notulis }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Pembahasan</p>
              <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ selectedNotulen.pembahasan }}</p>
            </div>
            <div class="space-y-1 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
              <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Hasil Keputusan</p>
              <p class="text-sm font-bold text-slate-800 leading-relaxed">{{ selectedNotulen.keputusan }}</p>
            </div>
            <div class="space-y-2">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Peserta Hadir ({{ selectedNotulen.peserta?.length || 0 }})</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="p in selectedNotulen.peserta" :key="p" class="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{{ p }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="selectedNotulen = null" class="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Tutup</button>
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
const recentNotulens = ref<any[]>([])
const selectedNotulen = ref<any>(null)

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
        .limit(5),
      
      // 6. Recent Notulen
      supabase.from('notulen')
        .select('*')
        .order('tanggal_rapat', { ascending: false })
        .limit(3)
    ])

    const [monthKasRes, allKasRes, allRekeningRes, billsRes, recentRes, notulenRes] = await withTimeout(fetching as any, 8000) as any[]

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
    recentNotulens.value = notulenRes.data || []
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
