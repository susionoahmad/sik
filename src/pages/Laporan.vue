<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
        <p class="text-slate-500 text-sm">Cetak dan tinjau laporan keuangan {{ settingsStore.organizationLabel }}.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <select v-model="selectedLaporan" class="input-field !py-1 w-48">
          <option value="kas">Laporan Kas {{ settingsStore.organizationLabel }}</option>
          <option value="pemasukan">Laporan Pemasukan</option>
          <option value="pengeluaran">Laporan Pengeluaran</option>
          <option value="tagihan">Laporan Tagihan Warga</option>
          <option value="meteran">Laporan Meteran Air</option>
        </select>
        <select v-model="filterBulan" class="input-field !py-1 w-32">
          <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
        </select>
        <select v-model="filterTahun" class="input-field !py-1 w-24">
          <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
        </select>
        <button @click="handlePrint" class="bg-slate-800 text-white px-4 py-1 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-all">
          <span>🖨️ Cetak</span>
        </button>
        <button @click="handleExport" class="bg-green-700 text-white px-4 py-1 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all">
          <span>📊 Excel</span>
        </button>
      </div>
    </div>

    <!-- Report View -->
    <div class="card !p-8 bg-white shadow-lg border border-slate-200 min-h-[600px] print:shadow-none print:border-none">
      <!-- Kop Surat -->
      <div class="text-center border-b-2 border-slate-800 pb-6 mb-8">
        <h1 class="text-2xl font-bold uppercase tracking-widest text-slate-900">Laporan Keuangan {{ settingsStore.organizationLabel }}</h1>
        <p class="text-lg font-semibold text-slate-700 mt-1">{{ laporanTitle }}</p>
        <p class="text-slate-500 italic text-sm mt-1">Periode: {{ bulanNames[filterBulan - 1] }} {{ filterTahun }}</p>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse border border-slate-300">
          <thead class="bg-slate-100 border-b border-slate-300">
            <tr v-if="selectedLaporan === 'kas'">
              <th class="border border-slate-300 px-4 py-2">Tanggal</th>
              <th class="border border-slate-300 px-4 py-2">Keterangan</th>
              <th class="border border-slate-300 px-4 py-2">Pemasukan</th>
              <th class="border border-slate-300 px-4 py-2">Pengeluaran</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'tagihan'">
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2">Nama Warga</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Iuran Pokok</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Tunggakan</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Deposit</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Total Tagihan</th>
              <th class="border border-slate-300 px-4 py-2">Status</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'meteran'">
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2">Nama Warga</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Awal</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Akhir</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Pakai (m³)</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Total (Rp)</th>
            </tr>
            <tr v-else>
              <th class="border border-slate-300 px-4 py-2">Tanggal</th>
              <th class="border border-slate-300 px-4 py-2">Kategori</th>
              <th class="border border-slate-300 px-4 py-2">Keterangan</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-12 text-slate-500">Memuat data laporan...</td>
            </tr>
            <tr v-else-if="reportData.length === 0">
              <td colspan="4" class="text-center py-12 text-slate-500">Tidak ada data untuk periode ini.</td>
            </tr>
            <tr v-else v-for="(item, idx) in reportData" :key="idx" class="even:bg-slate-50">
              <template v-if="selectedLaporan === 'kas'">
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ formatDate(item.tanggal) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.keterangan }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-medium text-green-700">
                  {{ item.jenis === 'masuk' ? formatCurrency(item.jumlah) : '-' }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-medium text-red-700">
                  {{ item.jenis === 'keluar' ? formatCurrency(item.jumlah) : '-' }}
                </td>
              </template>
              <template v-else-if="selectedLaporan === 'tagihan'">
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.warga?.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.warga?.nama_kepala_keluarga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => !d.keterangan_custom).reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right text-orange-600">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Tunggakan Bulan Sebelumnya').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right text-red-600 font-medium">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Potongan Saldo Deposit').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold text-primary-600 text-right">{{ formatCurrency(item.total) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm uppercase font-bold text-center" :class="item.status === 'lunas' ? 'text-green-600' : 'text-red-600'">
                  {{ item.status === 'lunas' ? 'Lunas' : 'Belum Bayar' }}
                </td>
              </template>
              <template v-else-if="selectedLaporan === 'meteran'">
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.warga?.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.warga?.nama_kepala_keluarga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center">{{ item.meter_awal }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center">{{ item.meter_akhir }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center font-bold">{{ item.pemakaian }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right font-bold">{{ formatCurrency(item.total) }}</td>
              </template>
              <template v-else>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ formatDate(item.tanggal) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-xs font-bold">{{ item.kategori }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.keterangan }}</td>
                <td class="border border-slate-300 px-4 py-2 text-right font-bold">{{ formatCurrency(item.jumlah) }}</td>
              </template>
            </tr>
          </tbody>
          <tfoot v-if="reportData.length > 0" class="bg-slate-100 font-bold">
            <tr v-if="selectedLaporan === 'kas'">
              <td colspan="2" class="border border-slate-300 px-4 py-2 text-right uppercase">Total</td>
              <td class="border border-slate-300 px-4 py-2 text-green-700">{{ formatCurrency(totalMasuk) }}</td>
              <td class="border border-slate-300 px-4 py-2 text-red-700">{{ formatCurrency(totalKeluar) }}</td>
            </tr>
            <tr v-else-if="selectedLaporan === 'tagihan'">
              <td colspan="5" class="border border-slate-300 px-4 py-2 text-right uppercase">Total Penagihan</td>
              <td colspan="2" class="border border-slate-300 px-4 py-2 text-primary-700 text-right">{{ formatCurrency(totalTagihan) }}</td>
            </tr>
            <tr v-else-if="selectedLaporan === 'meteran'">
              <td colspan="4" class="border border-slate-300 px-4 py-2 text-right uppercase">Total</td>
              <td class="border border-slate-300 px-4 py-2 text-center">{{ reportData.reduce((a, b) => a + Number(b.pemakaian || 0), 0) }} m³</td>
              <td class="border border-slate-300 px-4 py-2 text-right">{{ formatCurrency(reportData.reduce((a, b) => a + Number(b.total || 0), 0)) }}</td>
            </tr>
            <tr v-else>
              <td colspan="3" class="border border-slate-300 px-4 py-2 text-right uppercase">Total</td>
              <td class="border border-slate-300 px-4 py-2 text-right">{{ formatCurrency(totalGeneral) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Ringkasan Kas (Recap) -->
      <div v-if="selectedLaporan === 'kas' && !loading && reportData.length > 0" class="mt-8 space-y-4 border-t-2 border-slate-800 pt-6 print:mt-6 print:break-inside-avoid">
        <h3 class="font-bold text-slate-900 uppercase underline mb-4 print:text-sm">Ringkasan Kas (Rekapitulasi)</h3>
        
        <div class="space-y-4 print:space-y-2">
          <div v-for="summary in rekeningSummaries" :key="summary.id" class="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300 print:p-2">
            <h4 class="font-bold text-primary-700 mb-2 border-b border-primary-100 pb-1 print:text-slate-900 print:border-slate-800">{{ summary.nama }} ({{ summary.jenis }})</h4>
            <div class="grid grid-cols-3 gap-4 text-sm print:gap-2 print:text-xs">
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold print:text-slate-600">Saldo Awal</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(summary.saldoAwal) }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold text-green-600 print:text-slate-600">Arus Kas</span>
                <span class="font-bold" :class="summary.netto >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ (summary.netto >= 0 ? '+' : '') + formatCurrency(summary.netto) }}
                </span>
              </div>
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold text-primary-600 print:text-slate-600">Saldo Akhir</span>
                <span class="font-black text-primary-700 text-base print:text-slate-900 print:text-sm">{{ formatCurrency(summary.saldoAkhir) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Keseluruhan -->
        <div class="bg-slate-900 text-white p-4 rounded-lg shadow-inner flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-800 print:p-2 print:mt-4">
          <span class="font-bold uppercase tracking-wider print:text-xs">Total Kas Besar (Seluruh Rekening)</span>
          <span class="text-xl font-black text-primary-400 print:text-slate-900 print:text-base">{{ formatCurrency(totalKasBesar) }}</span>
        </div>
      </div>

      <!-- Ringkasan Tagihan (Recap) -->
      <div v-if="selectedLaporan === 'tagihan' && !loading && reportData.length > 0" class="mt-8 space-y-4 border-t-2 border-slate-800 pt-6 print:mt-6 print:break-inside-avoid">
        <h3 class="font-bold text-slate-900 uppercase underline mb-4 print:text-sm">Ringkasan Tagihan (Rekapitulasi)</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300 print:p-2">
            <div class="space-y-2 text-sm print:text-xs">
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500 font-semibold">Total Rumah/Tagihan</span>
                <span class="font-bold">{{ billSummary?.totalWarga }} Rumah</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-green-600 font-semibold">Tagihan Lunas ({{ billSummary?.lunasCount }})</span>
                <span class="font-bold text-green-700">{{ formatCurrency(billSummary?.lunasTotal || 0) }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-red-600 font-semibold">Tagihan Belum Lunas ({{ billSummary?.belumCount }})</span>
                <span class="font-bold text-red-700">{{ formatCurrency(billSummary?.belumTotal || 0) }}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-primary-900 text-white p-6 rounded-lg flex flex-col justify-center items-center print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-800 print:p-2">
            <span class="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Total Target Pendapatan</span>
            <span class="text-2xl font-black print:text-lg">{{ formatCurrency(billSummary?.totalNominal || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Ringkasan Meter Air (Recap) -->
      <div v-if="selectedLaporan === 'meteran' && !loading && reportData.length > 0" class="mt-8 space-y-4 border-t-2 border-slate-800 pt-6 print:mt-6 print:break-inside-avoid">
        <h3 class="font-bold text-slate-900 uppercase underline mb-4 print:text-sm">Ringkasan Meter Air (Rekapitulasi)</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300 print:p-2">
            <div class="space-y-2 text-sm print:text-xs">
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500 font-semibold">Total Rumah Melapor</span>
                <span class="font-bold">{{ reportData.length }} Rumah</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-blue-600 font-semibold">Total Konsumsi Air</span>
                <span class="font-bold text-blue-700">{{ reportData.reduce((a, b) => a + Number(b.pemakaian || 0), 0) }} m³</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1 font-bold pt-2">
                <span class="text-slate-700">Rata-rata Konsumsi</span>
                <span>{{ (reportData.reduce((a, b) => a + Number(b.pemakaian || 0), 0) / reportData.length).toFixed(1) }} m³/Rumah</span>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-900 text-white p-6 rounded-lg flex flex-col justify-center items-center print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-800 print:p-2">
            <span class="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Total Biaya Air</span>
            <span class="text-2xl font-black print:text-lg">{{ formatCurrency(reportData.reduce((a, b) => a + Number(b.total || 0), 0)) }}</span>
          </div>
        </div>
      </div>

      <!-- Tanda Tangan -->
      <div class="mt-20 flex flex-col items-center gap-y-12 px-8 print:mt-12 print:break-inside-avoid">
        
        <!-- Baris Atas: Dibuat Oleh -->
        <div class="flex justify-center w-full">
          <div v-for="(person, index) in bendaharaTtd" :key="'b-'+index" class="text-center min-w-[200px]">
            <p class="text-sm mb-20 font-medium text-slate-800">
              Dibuat Oleh,<br/>
              {{ person.role }}
            </p>
            <p class="font-bold underline">{{ person.name }}</p>
          </div>
        </div>

        <!-- Baris Bawah: Mengetahui (Sejajar) -->
        <div class="flex justify-around w-full max-w-3xl">
          <div v-for="(person, index) in ketuaTtd" :key="'k-'+index" class="text-center min-w-[200px]">
            <p class="text-sm mb-20 font-medium text-slate-800">
              Mengetahui,<br/>
              {{ person.role }}
            </p>
            <p class="font-bold underline">{{ person.name }}</p>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import type { TagihanDetail } from '@/types'
import * as XLSX from 'xlsx'

const settingsStore = useSettingsStore()

const selectedLaporan = ref('kas')
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const reportData = ref<any[]>([])
const loading = ref(false)
const rekeningSummaries = ref<any[]>([])
const totalKasBesar = ref(0)

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

const laporanTitle = computed(() => {
  switch (selectedLaporan.value) {
    case 'kas': return `Laporan Kas Umum ${settingsStore.organizationLabel}`
    case 'pemasukan': return 'Laporan Rincian Pemasukan'
    case 'pengeluaran': return 'Laporan Rincian Pengeluaran'
    case 'tagihan': return 'Laporan Status Tagihan Warga'
    case 'meteran': return 'Laporan Pemakaian Meter Air'
    default: return 'Laporan Keuangan'
  }
})

const bendaharaTtd = computed(() => {
  if (!settingsStore.settings.structure) return []
  return settingsStore.settings.structure.filter((p: any) => p.role.toLowerCase().includes('bendahara'))
})

const ketuaTtd = computed(() => {
  if (!settingsStore.settings.structure) return []
  return settingsStore.settings.structure.filter((p: any) => p.role.toLowerCase().includes('ketua') || p.role.toLowerCase().includes('manager'))
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const totalMasuk = computed(() => reportData.value.filter(t => t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah || 0), 0))
const totalKeluar = computed(() => reportData.value.filter(t => t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah || 0), 0))
const totalTagihan = computed(() => reportData.value.reduce((a, b) => a + Number(b.total || 0), 0))
const totalGeneral = computed(() => reportData.value.reduce((a, b) => a + Number(b.jumlah || 0), 0))

const billSummary = computed(() => {
  if (selectedLaporan.value !== 'tagihan') return null
  const lunas = reportData.value.filter(t => t.status === 'lunas')
  const belum = reportData.value.filter(t => t.status === 'belum_bayar')
  return {
    totalWarga: reportData.value.length,
    lunasCount: lunas.length,
    lunasTotal: lunas.reduce((a, b) => a + Number(b.total || 0), 0),
    belumCount: belum.length,
    belumTotal: belum.reduce((a, b) => a + Number(b.total || 0), 0),
    totalNominal: reportData.value.reduce((a, b) => a + Number(b.total || 0), 0)
  }
})

const fetchReport = async () => {
  loading.value = true
  try {
    let query: any
    const startDay = `${filterTahun.value}-${String(filterBulan.value).padStart(2, '0')}-01`
    const lastDay = new Date(filterTahun.value, filterBulan.value, 0).toISOString().split('T')[0]
    
    if (selectedLaporan.value === 'tagihan') {
      query = supabase.from('tagihan').select('*, warga(*), tagihan_detail(*)').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
    } else if (selectedLaporan.value === 'meteran') {
      query = supabase.from('meter_air').select('*, warga(*)').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
    } else {
      query = supabase.from('kas_transaksi')
        .select('*')
        .gte('tanggal', startDay)
        .lte('tanggal', lastDay)
      
      if (selectedLaporan.value === 'pemasukan') query = query.eq('jenis', 'masuk')
      if (selectedLaporan.value === 'pengeluaran') query = query.eq('jenis', 'keluar')

      // Fetch Per-Rekening Summary for Kas Report
      if (selectedLaporan.value === 'kas') {
        const [rekRes, prevTransRes, currentTransRes] = await Promise.all([
          supabase.from('rekening_kas').select('*'),
          supabase.from('kas_transaksi').select('rekening_id, jenis, jumlah').lt('tanggal', startDay),
          supabase.from('kas_transaksi').select('rekening_id, jenis, jumlah').gte('tanggal', startDay).lte('tanggal', lastDay)
        ])

        const reks = rekRes.data || []
        const prevs = prevTransRes.data || []
        const currents = currentTransRes.data || []

        rekeningSummaries.value = reks.map(r => {
          const pM = prevs.filter(t => t.rekening_id === r.id && t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)
          const pK = prevs.filter(t => t.rekening_id === r.id && t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)
          const sAwal = Number(r.saldo_awal) + pM - pK

          const cM = currents.filter(t => t.rekening_id === r.id && t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)
          const cK = currents.filter(t => t.rekening_id === r.id && t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)

          return {
            id: r.id,
            nama: r.nama_rekening,
            jenis: r.jenis,
            saldoAwal: sAwal,
            masuk: cM,
            keluar: cK,
            netto: cM - cK,
            saldoAkhir: sAwal + cM - cK
          }
        })
        
        totalKasBesar.value = rekeningSummaries.value.reduce((a, b) => a + b.saldoAkhir, 0)
      }
    }

    let orderBy = 'tanggal'
    if (selectedLaporan.value === 'tagihan') orderBy = 'created_at'
    if (selectedLaporan.value === 'meteran') orderBy = 'id' // meter_air doesn't have created_at/tanggal column

    const { data, error } = await query.order(orderBy, { ascending: true })
    if (error) throw error
    reportData.value = data || []
  } catch (e: any) {
    alert('Gagal mengambil data: ' + e.message)
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

const handleExport = () => {
  if (reportData.value.length === 0) return alert('Tidak ada data untuk diekspor')

  let dataToExport = []
  
  if (selectedLaporan.value === 'kas') {
    dataToExport = reportData.value.map(item => ({
      Tanggal: formatDate(item.tanggal),
      Keterangan: item.keterangan,
      Pemasukan: item.jenis === 'masuk' ? item.jumlah : 0,
      Pengeluaran: item.jenis === 'keluar' ? item.jumlah : 0
    }))
  } else if (selectedLaporan.value === 'tagihan') {
    dataToExport = reportData.value.map(item => {
      const details = (item.tagihan_detail || []) as TagihanDetail[]
      const iuranPokok = details.filter((d: TagihanDetail) => !d.keterangan_custom).reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)
      const tunggakan = details.filter((d: TagihanDetail) => d.keterangan_custom === 'Tunggakan Bulan Sebelumnya').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)
      const deposit = details.filter((d: TagihanDetail) => d.keterangan_custom === 'Potongan Saldo Deposit').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)
      
      return {
        'No. Rumah': item.warga?.no_rumah,
        'Nama Warga': item.warga?.nama_kepala_keluarga,
        'Bulan': bulanNames[item.bulan - 1],
        'Tahun': item.tahun,
        'Iuran Pokok': iuranPokok,
        'Tunggakan': tunggakan,
        'Deposit': deposit,
        'Total Tagihan': item.total,
        'Status': item.status.toUpperCase()
      }
    })
  } else if (selectedLaporan.value === 'meteran') {
    dataToExport = reportData.value.map(item => ({
      'No. Rumah': item.warga?.no_rumah,
      'Nama Warga': item.warga?.nama_kepala_keluarga,
      'Bulan': bulanNames[item.bulan - 1],
      'Tahun': item.tahun,
      'Meter Awal': item.meter_awal,
      'Meter Akhir': item.meter_akhir,
      'Pemakaian (m3)': item.pemakaian,
      'Total (Rp)': item.total
    }))
  } else {
    dataToExport = reportData.value.map(item => ({
      Tanggal: formatDate(item.tanggal),
      Kategori: item.kategori,
      Keterangan: item.keterangan,
      Jumlah: item.jumlah
    }))
  }

  const ws = XLSX.utils.json_to_sheet(dataToExport)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Laporan")
  
  const fileName = `${laporanTitle.value}_${bulanNames[filterBulan.value - 1]}_${filterTahun.value}.xlsx`
  XLSX.writeFile(wb, fileName)
}

watch([selectedLaporan, filterBulan, filterTahun], fetchReport)
onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchReport()
})
</script>

<style>
@media print {
  @page {
    size: A4;
    margin: 1cm; /* Margin wajar untuk kertas */
  }
  
  /* Sembunyikan semua elemen UI, navigasi, dan layout dengan prioritas tertinggi */
  header, aside, nav, button, .no-print, [class*="sidebar"], 
  select, .input-field, .btn-primary {
    display: none !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  /* Mengakali layout bawaan (h-screen, overflow-hidden) HANYA pada parent teratas */
  html, body, #app, #app > div {
    display: block !important;
    position: static !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    width: auto !important;
  }
  
  body {
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  main {
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    position: static !important;
    display: block !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
  }

  .card {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    display: block !important;
  }


  table {
    border-collapse: collapse !important;
    width: 100% !important;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  thead {
    display: table-header-group;
  }

  th, td {
    padding: 6px !important;
    font-size: 10px !important;
    border: 1px solid #333 !important;
  }

  .text-primary-600, .text-primary-700, .text-green-600, .text-green-700, .text-red-600, .text-red-700 {
    color: black !important;
  }

  /* Perbaikan krusial untuk mencegah elemen terpotong (page-break) */
  .print\:break-inside-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    display: block !important; /* Flex/Grid sering mengacaukan page-break di browser */
  }

  /* Supaya tanda tangan tetap sejajar walau diubah jadi block */
  .mt-20.flex.justify-around {
    display: flex !important; /* Khusus tanda tangan biarkan flex tapi bungkus container-nya */
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
</style>
