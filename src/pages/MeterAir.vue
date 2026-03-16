<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Meter Air Bulanan</h2>
        <p class="text-slate-500 text-sm">Input data pemakaian air warga bulanan.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <select v-model="filterBulan" class="input-field w-32">
          <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
        </select>
        <select v-model="filterTahun" class="input-field w-32">
          <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
        </select>
        <button 
          @click="showReminderModal = true" 
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
        >
          <MessageCircleIcon class="w-4 h-4" />
          <span>Reminder WA</span>
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card flex items-center gap-4 border-l-4 border-green-500">
        <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">✅</div>
        <div>
          <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sudah Lapor</p>
          <p class="text-xl font-black text-slate-800">{{ meterList.filter(m => !!m.id).length }} Warga</p>
        </div>
      </div>
      <div class="card flex items-center gap-4 border-l-4 border-amber-500">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">⏳</div>
        <div>
          <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Belum Lapor</p>
          <p class="text-xl font-black text-slate-800">{{ meterList.filter(m => !m.id).length }} Warga</p>
        </div>
      </div>
      <div class="card flex items-center gap-4 border-l-4 border-primary-500">
        <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">💧</div>
        <div>
          <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Pemakaian</p>
          <p class="text-xl font-black text-slate-800">{{ meterList.reduce((a, b) => a + (b.pemakaian || 0), 0) }} m3</p>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden !p-0 border-slate-200 shadow-xl">
      <div class="p-4 border-b border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-600 flex items-start gap-3">
        <div class="mt-1 flex-shrink-0">ℹ️</div>
        <div>
          <p>Total biaya air hanya menghitung **kelebihan di atas 10m3**. Abodemen air sudah masuk di Tagihan utama.</p>
          <p class="text-red-600 font-bold mt-1">⚠️ Batas lapor tgl 15. Lewat tgl 15 otomatis dianggap Terlambat (Denda).</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th class="px-6 py-4">Warga</th>
              <th class="px-3 py-4 text-center">Awal</th>
              <th class="px-3 py-4 text-center">Akhir</th>
              <th class="px-3 py-4 text-center">Telat?</th>
              <th class="px-3 py-4 text-center">M3</th>
              <th class="px-3 py-4">Total</th>
              <th class="px-6 py-4 text-right sticky right-0 bg-slate-50 border-l border-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="7" class="px-6 py-4"><div class="h-10 bg-slate-50 rounded-xl w-full"></div></td>
            </tr>
            <tr v-else v-for="item in meterList" :key="item.warga_id" class="group hover:bg-slate-50/50 transition-all">
              <td class="px-6 py-4">
                <p class="font-black text-slate-800 leading-tight group-hover:text-primary-600 transition-colors">{{ item.warga?.nama_kepala_keluarga }}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{{ item.warga?.no_rumah }}</p>
              </td>
              <td class="px-2 py-4 text-center">
                <span class="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{{ item.meter_awal }}</span>
              </td>
              <td class="px-2 py-4">
                <input 
                  type="number" 
                  v-model.number="item.meter_akhir" 
                  @input="calculateTotal(item)"
                  class="w-20 bg-white border border-slate-200 rounded-xl p-2 text-sm font-black text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm transition-all" 
                  placeholder="0"
                />
              </td>
              <td class="px-2 py-4 text-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="item.is_late" 
                    class="sr-only peer" 
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 relative transition-all"></div>
                </label>
              </td>
              <td class="px-2 py-4 text-center">
                <span :class="[
                  'text-xs font-black px-2 py-1 rounded-lg',
                  item.meter_akhir !== null ? 'bg-primary-50 text-primary-600' : 'text-slate-300'
                ]">
                  {{ item.meter_akhir !== null ? (item.pemakaian || 0) : '-' }} m3
                </span>
              </td>
              <td class="px-3 py-4">
                <p class="font-black text-slate-800 text-xs">
                  {{ item.meter_akhir !== null ? formatCurrency(item.total || 0) : '-' }}
                </p>
              </td>
              <td class="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 border-l border-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    v-if="!item.id"
                    @click="sendWAReminder(item)"
                    class="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    title="Kirim Reminder WA"
                  >
                    <MessageCircleIcon class="w-4 h-4" />
                  </button>
                  <button 
                    v-else
                    @click="handleDelete(item)"
                    class="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Batalkan/Hapus"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleSave(item)" 
                    class="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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

    <!-- Reminder Modal -->
    <Teleport to="body">
      <div v-if="showReminderModal" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        @click.self="closeReminderModal"
      >
        <div class="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100" @click.stop>
          <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">Kirim Pengingat WA</h3>
              <p class="text-xs font-bold text-slate-400 uppercase mt-0.5">{{ meterList.filter(m => !m.id).length }} Warga Belum Melapor</p>
            </div>
            <button @click="closeReminderModal" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
              <XIcon class="w-5 h-5" />
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto px-8 py-8 space-y-4">
            <div v-if="meterList.filter(m => !m.id).length === 0" class="text-center py-10">
              <div class="text-4xl mb-4">🎉</div>
              <p class="text-slate-500 font-bold italic">Luar biasa! Semua warga sudah melaporkan meteran air.</p>
            </div>
            <div v-else v-for="w in meterList.filter(m => !m.id)" :key="'rem-'+w.warga_id" 
              class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-green-200 hover:bg-white transition-all"
            >
              <div>
                <p class="font-black text-slate-800 text-sm">{{ w.warga?.nama_kepala_keluarga }}</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{{ w.warga?.no_rumah }} • {{ w.warga?.no_hp || 'No HP Kosong' }}</p>
              </div>
              <button 
                @click="sendWAReminder(w)"
                class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md active:scale-95"
              >
                <MessageCircleIcon class="w-3.5 h-3.5" />
                <span>Ingatkan</span>
              </button>
            </div>
          </div>
          
          <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button @click="closeReminderModal" class="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Tutup Dialog</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import { useLogger } from '@/utils/logger'
import { MessageCircle as MessageCircleIcon, Trash2 as TrashIcon, X as XIcon } from 'lucide-vue-next'
import type { MeterAir } from '@/types'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const meterList = ref<(MeterAir & { saving?: boolean })[]>([])
const loading = ref(true)
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const showReminderModal = ref(false)

const closeReminderModal = () => {
  console.log('Explicitly closing reminder modal')
  showReminderModal.value = false
}

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const calculateTotal = (item: any) => {
  const pemakaian = Math.max(0, (item.meter_akhir || 0) - (item.meter_awal || 0))
  item.pemakaian = pemakaian
  // Rumus: (pemakaian - 10) * tarif, minimum 0
  const kelebihan = Math.max(0, pemakaian - 10)
  item.total = kelebihan * (item.tarif_per_m3 || 0)
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
  const defaultTariff = tariffRes.data?.nominal_default || 2000
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
    const prevEnd = lastMeterMap.get(w.id) || 0
    
    // Auto check if late (deadline is 15th of the current month)
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const isPastPeriod = filterTahun.value < currentYear || (filterTahun.value === currentYear && filterBulan.value < currentMonth)
    const isCurrentPeriodAndLate = filterBulan.value === currentMonth && filterTahun.value === currentYear && today.getDate() > 15
    
    const autoLate = isPastPeriod || isCurrentPeriodAndLate

    // LOGIKA MIGRASI: Jika record sudah ada di DB tapi meter_awal masih 0 sedangkan ada data bulan lalu,
    // maka kita gunakan data bulan lalu sebagai meter_awal.
    const meterAwal = (existing && (existing.meter_awal !== 0 || prevEnd === 0)) ? existing.meter_awal : prevEnd

    return {
      id: existing?.id,
      warga_id: w.id,
      bulan: filterBulan.value,
      tahun: filterTahun.value,
      meter_awal: meterAwal,
      // Jika data belum ada di DB, biarkan null agar input kosong (tidak mengisi otomatis)
      meter_akhir: existing ? existing.meter_akhir : null,
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

    // --- LOGIKA OTOMATIS KE BULAN BERIKUTNYA ---
    // Cari apakah ada record bulan berikutnya (yang paling dekat) untuk warga ini
    const { data: nextRecord } = await supabase
      .from('meter_air')
      .select('id')
      .eq('warga_id', item.warga_id)
      .or(`tahun.gt.${item.tahun},and(tahun.eq.${item.tahun},bulan.gt.${item.bulan})`)
      .order('tahun', { ascending: true })
      .order('bulan', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    // Jika ada bulan berikutnya, update nilai meter_awal-nya
    if (nextRecord) {
      await supabase.from('meter_air').update({
        meter_awal: item.meter_akhir
      }).eq('id', nextRecord.id)
    }
    
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
