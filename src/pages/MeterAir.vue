<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Meter Air Bulanan</h2>
        <p class="text-slate-500 text-sm">Input data pemakaian air warga bulanan.</p>
      </div>
      <div class="flex gap-4">
        <select v-model="filterBulan" class="input-field w-32">
          <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
        </select>
        <select v-model="filterTahun" class="input-field w-32">
          <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <div class="card overflow-hidden !p-0">
      <div class="p-4 border-b border-slate-200 bg-slate-50 text-sm text-slate-600 italic">
        * Total biaya air di sini hanya menghitung **kelebihan pemakaian di atas 10m3**. Abodemen air (Rp 20.000) sudah ada di menu Jenis Iuran. 
        **Wajib lapor maksimal tanggal 15 setiap bulannya, telat lapor dikenakan denda Rp 25.000**.
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th class="px-4 py-3">Warga</th>
              <th class="px-3 py-3 text-center">Awal</th>
              <th class="px-3 py-3 text-center">Akhir</th>
              <th class="px-3 py-3 text-center">Tarif</th>
              <th class="px-3 py-3 text-center">Telat</th>
              <th class="px-3 py-3 text-center">M3</th>
              <th class="px-3 py-3">Total</th>
              <th class="px-3 py-3 text-right sticky right-0 bg-slate-50 border-l border-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="8" class="px-4 py-3"><div class="h-4 bg-slate-200 rounded w-full"></div></td>
            </tr>
            <tr v-else v-for="item in meterList" :key="item.warga_id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900 leading-tight">{{ item.warga?.nama_kepala_keluarga }}</p>
                <p class="text-[10px] text-slate-500 uppercase">{{ item.warga?.no_rumah }}</p>
              </td>
              <td class="px-2 py-3">
                <input 
                  type="number" 
                  v-model.number="item.meter_awal" 
                  class="w-16 border border-slate-200 rounded p-1 text-xs text-center bg-slate-50" 
                  readonly
                />
              </td>
              <td class="px-2 py-3">
                <input 
                  type="number" 
                  v-model.number="item.meter_akhir" 
                  class="w-16 border border-slate-300 rounded p-1 text-xs text-center focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </td>
              <td class="px-2 py-3">
                <input 
                  type="number" 
                  v-model.number="item.tarif_per_m3" 
                  class="w-16 border border-slate-300 rounded p-1 text-xs text-center focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </td>
              <td class="px-2 py-3 text-center">
                <input 
                  type="checkbox" 
                  v-model="item.is_late" 
                  class="w-4 h-4 accent-red-500 rounded cursor-pointer" 
                />
              </td>
              <td class="px-2 py-3 text-center font-medium text-slate-600 text-xs">{{ item.pemakaian || 0 }} m3</td>
              <td class="px-3 py-3 font-bold text-primary-600 text-xs whitespace-nowrap">{{ formatCurrency(item.total || 0) }}</td>
              <td class="px-3 py-3 text-right sticky right-0 bg-white border-l border-slate-100 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                <div class="flex flex-col gap-1 items-end">
                  <button 
                    v-if="!item.id"
                    @click="sendWAReminder(item)"
                    class="w-full bg-white text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-50 text-[10px] font-bold transition-all"
                  >
                    WA
                  </button>
                  <button 
                    v-else
                    @click="handleDelete(item)"
                    class="w-full bg-white text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-[10px] font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    @click="handleSave(item)" 
                    class="w-full bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                    :disabled="item.saving"
                  >
                    {{ item.saving ? '...' : 'Simpan' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import { useLogger } from '@/utils/logger'
import type { MeterAir } from '@/types'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const meterList = ref<(MeterAir & { saving?: boolean })[]>([])
const loading = ref(true)
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const sendWAReminder = (item: any) => {
  const noHp = item.warga?.no_hp
  if (!noHp) {
    alert('Nomor HP warga tidak ditemukan!')
    return
  }

  // Format phone number to 62...
  let formattedPhone = noHp.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1)
  }

  const nama = item.warga?.nama_kepala_keluarga
  const bulan = bulanNames[filterBulan.value - 1]
  const pesan = `Halo Bapak/Ibu ${nama}, mengingatkan kembali untuk mengirimkan laporan/foto meteran air periode ${bulan} ${filterTahun.value}. 

📌 *Batas akhir pelaporan maksimal tanggal 15 setiap bulannya.*
Keterlambatan akan dikenakan denda Rp 25.000 sesuai peraturan ${settingsStore.settings.orgType}.

Mohon segera dilaporkan. Terima kasih 🙏 - *Pengurus ${settingsStore.settings.orgType}*`

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pesan)}`
  window.open(url, '_blank')
}

const handleDelete = async (item: any) => {
  if (!confirm(`Batalkan simpan data meteran ${item.warga?.nama_kepala_keluarga}? Data di database akan dihapus.`)) return
  
  item.saving = true
  try {
    const { error } = await supabase.from('meter_air').delete().eq('id', item.id)
    if (error) throw error
    await fetchMeterAir()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  } finally {
    item.saving = false
  }
}

const fetchMeterAir = async () => {
  loading.value = true
  
  // Use Promise.all for parallel primary data fetching
  const [wargaRes, tariffRes, recordsRes, prevRes] = await Promise.all([
    // 1. Active Warga
    supabase.from('warga').select('*').eq('status', 'aktif'),
    
    // 1b. Default tariff
    supabase.from('jenis_iuran').select('nominal_default').eq('nama_iuran', 'kelebihan_air').maybeSingle(),
    
    // 2. Meters for current period
    supabase.from('meter_air').select('*').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value),
    
    // 3. Previous meter readings (only needed columns to build the map)
    supabase.from('meter_air')
      .select('warga_id, meter_akhir, bulan, tahun')
      .or(`tahun.lt.${filterTahun.value},and(tahun.eq.${filterTahun.value},bulan.lt.${filterBulan.value})`)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
  ])

  if (wargaRes.error) throw wargaRes.error
  const warga = wargaRes.data || []
  const defaultTariff = tariffRes.data?.nominal_default || 3500
  const records = recordsRes.data || []
  const allPrevRecords = prevRes.data || []

  // Create map for last meter readings
  const lastMeterMap = new Map()
  allPrevRecords.forEach(r => {
    if (!lastMeterMap.has(r.warga_id)) {
      lastMeterMap.set(r.warga_id, r.meter_akhir)
    }
  })

  const recordsMap = new Map(records.map(r => [r.warga_id, r]))

  meterList.value = warga.map(w => {
    const existing = recordsMap.get(w.id)
    
    // Auto check if late (deadline is 15th of the current month)
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const isPastPeriod = filterTahun.value < currentYear || (filterTahun.value === currentYear && filterBulan.value < currentMonth)
    const isCurrentPeriodAndLate = filterBulan.value === currentMonth && filterTahun.value === currentYear && today.getDate() > 15
    
    const autoLate = isPastPeriod || isCurrentPeriodAndLate

    return {
      id: existing?.id,
      warga_id: w.id,
      bulan: filterBulan.value,
      tahun: filterTahun.value,
      meter_awal: existing?.meter_awal ?? (lastMeterMap.get(w.id) || 0),
      meter_akhir: existing?.meter_akhir ?? (lastMeterMap.get(w.id) || 0),
      pemakaian: existing?.pemakaian ?? 0,
      tarif_per_m3: existing?.tarif_per_m3 ?? defaultTariff,
      is_late: existing?.is_late ?? autoLate,
      total: existing?.total ?? 0,
      warga: w,
      saving: false
    }
  })

  loading.value = false
}

const handleSave = async (item: any) => {
  item.saving = true
  try {
    const payload = {
      warga_id: item.warga_id,
      bulan: item.bulan,
      tahun: item.tahun,
      meter_awal: item.meter_awal,
      meter_akhir: item.meter_akhir,
      tarif_per_m3: item.tarif_per_m3,
      is_late: item.is_late
    }

    let error
    if (item.id) {
      const { error: err } = await supabase.from('meter_air').update(payload).eq('id', item.id)
      error = err
    } else {
      const { error: err } = await supabase.from('meter_air').insert([payload])
      error = err
    }

    if (error) throw error
    
    await logActivity(item.id ? 'UPDATE_METER_AIR' : 'ADD_METER_AIR', 'meter_air', {
      warga_name: item.warga?.nama_kepala_keluarga,
      no_rumah: item.warga?.no_rumah,
      meter_awal: item.meter_awal,
      meter_akhir: item.meter_akhir,
      periode: `${item.bulan}/${item.tahun}`
    })

    await fetchMeterAir()
  } catch (e: any) {
    alert('Gagal simpan: ' + e.message)
  } finally {
    item.saving = false
  }
}

watch([filterBulan, filterTahun], fetchMeterAir)
onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchMeterAir()
})
</script>
