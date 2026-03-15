<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Log Aktivitas Pengurus</h2>
        <p class="text-slate-500 text-sm">Rekam jejak setiap aksi yang dilakukan oleh pengurus sistem.</p>
      </div>
      <button @click="fetchLogs" class="btn-secondary flex items-center gap-2">
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        Segarkan
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pengurus</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modul</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ formatDateTime(log.created_at) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="font-medium text-slate-700 text-sm">{{ log.user_name }}</span>
                  <span class="text-[10px] text-slate-400 font-bold uppercase">{{ log.user_role }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2 py-0.5 rounded text-[11px] font-bold uppercase',
                  getActionClass(log.action)
                ]">
                  {{ log.action.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 capitalize">
                {{ log.resource }}
              </td>
              <td class="px-6 py-4">
                <button 
                  @click="showDetail(log)"
                  class="text-xs text-primary-600 hover:underline font-medium"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
            <tr v-if="logs.length === 0 && !loading">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400 italic">
                Belum ada aktivitas yang tercatat.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedLog" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-slate-800">Detail Aktivitas</h3>
          <button @click="selectedLog = null" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-400 uppercase font-bold mb-1">Pengurus</p>
              <p class="text-slate-700">{{ selectedLog.user_name }} ({{ selectedLog.user_role }})</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-400 uppercase font-bold mb-1">Waktu</p>
              <p class="text-slate-700">{{ formatDateTime(selectedLog.created_at) }}</p>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(val, key) in selectedLog.details" :key="key">
                  <td class="px-4 py-3 bg-slate-50 font-bold text-slate-500 w-40 capitalize">
                    {{ translateKey(key.toString()) }}
                  </td>
                  <td class="px-4 py-3 text-slate-700">
                    <template v-if="Array.isArray(val)">
                      <ul class="list-disc list-inside space-y-1">
                        <li v-for="(item, i) in val" :key="i" class="text-xs">
                          {{ formatValue(item) }}
                        </li>
                      </ul>
                    </template>
                    <template v-else>
                      {{ formatValue(val, key.toString()) }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4">
            <button 
              @click="showRaw = !showRaw" 
              class="text-[10px] text-slate-400 hover:text-slate-600 uppercase font-bold tracking-widest"
            >
              {{ showRaw ? 'Sembunyikan' : 'Lihat' }} Data Mentah (JSON)
            </button>
            <div v-if="showRaw" class="mt-2 p-3 bg-slate-900 rounded text-[10px] text-emerald-400 font-mono overflow-x-auto">
              <pre>{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button @click="selectedLog = null" class="btn-primary px-8">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { RefreshCw } from 'lucide-vue-next'
import { withTimeout } from '@/utils/promise'

const logs = ref<any[]>([])
const rekeningList = ref<any[]>([])
const loading = ref(false)
const selectedLog = ref<any>(null)
const showRaw = ref(false)

const fetchRekening = async () => {
  const { data } = await supabase.from('rekening_kas').select('id, nama_rekening')
  rekeningList.value = data || []
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await withTimeout(
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100) as any,
      8000
    ) as any
    if (error) throw error
    logs.value = data || []
  } catch (e: any) {
    console.error('Failed to fetch logs:', e)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const translateKey = (key: string) => {
  const dict: any = {
    org_name: 'Nama Organisasi',
    org_type: 'Tipe',
    structure: 'Susunan Pengurus',
    target_user: 'Nama User',
    old_role: 'Peran Lama',
    new_role: 'Peran Baru',
    deleted_user_name: 'Nama',
    deleted_user_email: 'Email',
    deleted_user_role: 'Peran',
    periode: 'Periode',
    count: 'Jumlah Data',
    jumlah: 'Nominal/Jumlah',
    metode: 'Metode',
    warga_name: 'Nama Warga',
    no_rumah: 'No. Rumah',
    meter_awal: 'Meter Awal',
    meter_akhir: 'Meter Akhir',
    keterangan: 'Keterangan',
    kategori: 'Kategori',
    tanggal: 'Tanggal',
    rekening_id: 'Kas/Rekening',
    details: 'Detail Tambahan'
  }
  return dict[key] || key.replace(/_/g, ' ')
}

const formatValue = (val: any, key: string = '') => {
  if (val === null || val === undefined) return '-'
  
  // Custom mapping for rekening_id to name
  if (key === 'rekening_id') {
    const rek = rekeningList.value.find(r => r.id === val)
    return rek ? rek.nama_rekening : val
  }

  if (typeof val === 'object') {
    if (val.role && val.name) return `${val.role}: ${val.name}`
    if (val.nama_iuran) return `${val.nama_iuran}: ${formatCurrency(val.nominal || val.jumlah)}`
    return JSON.stringify(val)
  }
  if (key === 'jumlah' || key.includes('nominal')) return formatCurrency(val)
  return val
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const getActionClass = (action: string) => {
  if (action.includes('DELETE')) return 'bg-red-100 text-red-700'
  if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700'
  if (action.includes('INSERT') || action.includes('ADD')) return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-700'
}

const showDetail = (log: any) => {
  showRaw.value = false
  selectedLog.value = log
}

onMounted(() => {
  fetchLogs()
  fetchRekening()
})
</script>
