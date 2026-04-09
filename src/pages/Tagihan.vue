<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Tagihan Bulanan</h2>
        <p class="text-slate-500 text-sm">Generate dan kelola tagihan iuran warga.</p>
      </div>
      <div class="flex gap-4">
        <select v-model="filterBulan" class="input-field w-32">
          <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
        </select>
        <select v-model="filterTahun" class="input-field w-32">
          <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
        </select>
        <button @click="handleGenerate" class="btn-primary" :disabled="generating">
          {{ generating ? 'Generating...' : 'Generate Tagihan' }}
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <p class="text-slate-500 text-sm">Total Tagihan</p>
        <p class="text-2xl font-bold">{{ tagihanList.length }}</p>
      </div>
      <div class="card">
        <p class="text-slate-500 text-sm text-green-600">Lunas</p>
        <p class="text-2xl font-bold">{{tagihanList.filter(t => t.status === 'lunas').length}}</p>
      </div>
      <div class="card">
        <p class="text-slate-500 text-sm text-red-600">Terhutang</p>
        <p class="text-2xl font-bold">{{tagihanList.filter(t => t.status === 'belum_bayar').length}}</p>
      </div>
      <div class="card">
        <p class="text-slate-500 text-sm text-primary-600">Total Nominal</p>
        <p class="text-2xl font-bold">{{ formatCurrency(totalNominal) }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">No. Rumah</th>
              <th class="px-6 py-4">Nama Warga</th>
              <th class="px-6 py-4 text-right">Pokok</th>
              <th class="px-6 py-4 text-right">Tunggakan</th>
              <th class="px-6 py-4 text-right">Deposit</th>
              <th class="px-6 py-4 text-right">Total</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="6" class="px-6 py-4">
                <div class="h-4 bg-slate-200 rounded w-full"></div>
              </td>
            </tr>
            <tr v-else-if="tagihanList.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500 italic">
                Belum ada tagihan untuk periode ini. Klik Generate Tagihan.
              </td>
            </tr>
            <tr v-else v-for="item in tagihanList" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900">{{ item.warga?.no_rumah }}</td>
              <td class="px-6 py-4">{{ item.warga?.nama_kepala_keluarga }}</td>
              <td class="px-6 py-4 text-right text-sm">
                {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => !d.keterangan_custom).reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
              </td>
              <td class="px-6 py-4 text-right text-sm text-orange-600">
                {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Tunggakan Bulan Sebelumnya').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
              </td>
              <td class="px-6 py-4 text-right text-sm text-red-600 font-medium">
                {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Potongan Saldo Deposit').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
              </td>
              <td class="px-6 py-4 font-bold text-primary-600 text-right">{{ formatCurrency(item.total) }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="[
                  'px-2 py-1 rounded-full text-[10px] font-bold uppercase block text-center',
                  item.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ item.status === 'lunas' ? 'Lunas' : 'Belum Bayar' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="viewDetail(item)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-semibold">Detail</button>
                <button @click="handleDeleteTagihan(item.id)"
                  class="text-red-500 hover:text-red-600 text-sm font-semibold">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-slate-800">Preview Nota</h3>
          <button @click="showDetailModal = false" class="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div v-if="selectedTagihan" class="space-y-6">
          <!-- Nota Design -->
          <div id="nota-canvas" style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2rem; border-radius: 0.5rem; color: #1e293b; font-family: sans-serif;">
            <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
              <h4 style="font-size: 1.5rem; font-weight: 900; color: #2563eb; margin: 0;">SIK-{{ settingsStore.settings.orgType.toUpperCase() }}</h4>
              <p style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-top: 0.25rem;">Kwitansi Tagihan Iuran Warga</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem; margin-bottom: 1.5rem;">
              <div>
                <p style="color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin: 0;">Warga / Kepala Keluarga</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">{{ selectedTagihan.warga?.nama_kepala_keluarga }}</p>
              </div>
              <div>
                <p style="color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin: 0;">No. Rumah</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">{{ selectedTagihan.warga?.no_rumah }}</p>
              </div>
              <div>
                <p style="color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin: 0;">Periode Iuran</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">{{ bulanNames[selectedTagihan.bulan - 1] }} {{ selectedTagihan.tahun }}</p>
              </div>
              <div>
                <p style="color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin: 0;">Status Pembayaran</p>
                <p :style="{ fontWeight: '700', textTransform: 'uppercase', margin: 0, color: selectedTagihan.status === 'lunas' ? '#16a34a' : '#dc2626' }">
                  {{ selectedTagihan.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS' }}
                </p>
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <p style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; margin-bottom: 0.75rem;">Rincian Iuran</p>
              <div class="space-y-2">
                <div v-for="d in tagihanDetails" :key="d.id" style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                  <span style="color: #475569; text-transform: capitalize; font-weight: 500;">
                    {{ d.jenis_iuran ? d.jenis_iuran.nama_iuran.replace('_', ' ') : d.keterangan_custom }}
                  </span>
                  <span :style="{ fontWeight: '700', color: d.jumlah < 0 ? '#dc2626' : '#1e293b' }">
                    {{ formatCurrency(d.jumlah) }}
                  </span>
                </div>
              </div>
              <div style="border-top: 2px dashed #e2e8f0; margin-top: 1rem; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 900; color: #1e293b; font-size: 1.125rem;">TOTAL TAGIHAN</span>
                <span style="font-weight: 900; color: #2563eb; font-size: 1.125rem;">{{ formatCurrency(selectedTagihan.total) }}</span>
              </div>
            </div>

            <div style="text-align: center; font-size: 0.65rem; color: #94a3b8; font-style: italic;">
              Nota ini dihasilkan secara otomatis oleh Sistem Keuangan {{ settingsStore.organizationLabel }}.<br/>
              Simpan nota ini sebagai bukti tagihan resmi.
            </div>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-3 gap-2">
            <button @click="handleDownload" class="bg-blue-600 text-white rounded-lg p-2 font-bold hover:bg-blue-700 transition-all flex flex-col items-center justify-center h-auto text-center shadow-sm shadow-blue-200">
              <span class="text-lg">💾</span>
              <span class="text-[9px] font-bold uppercase">Download</span>
            </button>
            <button @click="copyRincian" class="bg-white text-blue-600 border border-blue-200 rounded-lg p-2 font-bold hover:bg-blue-50 transition-all flex flex-col items-center justify-center h-auto text-center">
              <span class="text-lg">📋</span>
              <span class="text-[9px] font-bold uppercase">Salin Teks</span>
            </button>
            <button @click="sendWA(selectedTagihan)" class="bg-green-600 text-white rounded-lg p-2 font-bold hover:bg-green-700 transition-all flex flex-col items-center justify-center h-auto text-center shadow-sm shadow-green-200">
              <span class="text-lg">💬</span>
              <span class="text-[9px] font-bold uppercase">Kirim WA</span>
            </button>
          </div>

          <div v-if="selectedTagihan.status === 'belum_bayar'">
            <router-link :to="{ name: 'pembayaran', query: { tagihan_id: selectedTagihan.id } }"
              class="w-full btn-primary block text-center py-3">
              Proses Pembayaran Sekarang
            </router-link>
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
import { useLogger } from '@/utils/logger'
import type { Tagihan, TagihanDetail } from '@/types'
import { toPng } from 'html-to-image'

const settingsStore = useSettingsStore()
const { logActivity } = useLogger()

const tagihanList = ref<Tagihan[]>([])
const loading = ref(true)
const generating = ref(false)
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const showDetailModal = ref(false)
const selectedTagihan = ref<Tagihan | null>(null)
const tagihanDetails = ref<TagihanDetail[]>([])

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

const totalNominal = computed(() => {
  return tagihanList.value.reduce((acc, curr) => acc + Number(curr.total), 0)
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const fetchTagihan = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tagihan')
      .select('*, warga(*), tagihan_detail(*)')
      .eq('bulan', filterBulan.value)
      .eq('tahun', filterTahun.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    tagihanList.value = (data || []).sort((a, b) => (a.warga?.no_rumah || '').localeCompare(b.warga?.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
  } catch (err: any) {
    alert('Gagal mengambil data: ' + err.message)
  } finally {
    loading.value = false
  }
}

const handleGenerate = async () => {
  if (!confirm(`Generate tagihan untuk periode ${bulanNames[filterBulan.value - 1]} ${filterTahun.value}?`)) return
  generating.value = true
  try {
    const { data: warga, error: errorW } = await supabase.from('warga').select('*').eq('status', 'aktif')
    if (errorW) throw errorW

    const { data: iuran, error: errorI } = await supabase.from('jenis_iuran').select('*').eq('is_active', true)
    if (errorI) throw errorI

    const { data: meterAir, error: errorM } = await supabase.from('meter_air').select('*').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
    if (errorM) throw errorM
    const meterMap = new Map(meterAir?.map(m => [m.warga_id, m]) || [])

    const { data: customIurans, error: errorC } = await supabase.from('iuran_warga').select('*')
    if (errorC) throw errorC
    const customMap = new Map()
    customIurans?.forEach(ci => {
      if (!customMap.has(ci.warga_id)) customMap.set(ci.warga_id, [])
      customMap.get(ci.warga_id).push(ci)
    })

    const { data: existing } = await supabase.from('tagihan').select('warga_id').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
    const existingIds = new Set(existing?.map(e => e.warga_id))

    for (const w of warga) {
      if (existingIds.has(w.id)) continue

      let details: any[] = []
      let total = 0

      if (w.status_hunian === 'kosong') {
        const item = iuran.find(i => i.nama_iuran === 'iuran_rumah_kosong')
        if (item) {
          details.push({ jenis_iuran_id: item.id, jumlah: item.nominal_default })
          total = item.nominal_default
        }
      } else {
        const citizenCustom = customMap.get(w.id)
        if (citizenCustom && citizenCustom.length > 0) {
          citizenCustom.forEach((ci: any) => {
            // Cari info jenis iuran untuk cek namanya
            const jIuran = iuran.find(i => i.id === ci.jenis_iuran_id)
            // Lewati jika ini adalah iuran kelebihan air (karena akan dihitung dari meteran di bawah)
            if (jIuran && jIuran.nama_iuran === 'kelebihan_air') return

            details.push({ jenis_iuran_id: ci.jenis_iuran_id, jumlah: ci.nominal })
            total += ci.nominal
          })
        } else {
          // Defaults: exclude special ones
          iuran.filter(i => 
            i.nama_iuran !== 'iuran_rumah_kosong' && 
            i.nama_iuran !== 'denda_air' && 
            i.nama_iuran !== 'kelebihan_air'
          ).forEach(i => {
            details.push({ jenis_iuran_id: i.id, jumlah: i.nominal_default })
            total += i.nominal_default
          })
        }

        // --- Handle Kelebihan Air (untuk SEMUA warga aktif) ---
        // Kita kunci menggunakan nama_iuran: 'kelebihan_air'
        const waterIuran = iuran.find(i => i.nama_iuran === 'kelebihan_air')
        if (waterIuran) {
          const mData = meterMap.get(w.id)
          if (mData) {
            // Gunakan nominal_default dari waterIuran sebagai tarif global terbaru
            const tarifTerbaru = waterIuran.nominal_default
            const pemakaian = Math.max(0, (mData.meter_akhir || 0) - (mData.meter_awal || 0))
            const kelebihan = Math.max(0, pemakaian - 10)
            const amount = kelebihan * tarifTerbaru

            if (amount > 0) {
              details.push({ jenis_iuran_id: waterIuran.id, jumlah: amount })
              total += amount
            }
          }
        }

        const mData = meterMap.get(w.id)
        if (mData?.is_late) {
          const denda = iuran.find(i => i.nama_iuran === 'denda_air')
          if (denda) {
            details.push({ jenis_iuran_id: denda.id, jumlah: denda.nominal_default })
            total += denda.nominal_default
          }
        }
      }

      // --- LOGIKA TUNGGAKAN DAN DEPOSIT ---
      const { data: arrearsData } = await supabase
        .from('tagihan')
        .select('total')
        .eq('warga_id', w.id)
        .eq('status', 'belum_bayar')
        .or(`tahun.lt.${filterTahun.value},and(tahun.eq.${filterTahun.value},bulan.lt.${filterBulan.value})`)
      
      const totalArrears = arrearsData?.reduce((a, b) => a + Number(b.total), 0) || 0
      if (totalArrears > 0) {
        details.push({ keterangan_custom: `Tunggakan Bulan Sebelumnya`, jumlah: totalArrears })
        total += totalArrears
      }

      const deposit = Number(w.saldo_deposit || 0)
      if (deposit > 0) {
        const deducted = Math.min(deposit, total)
        if (deducted > 0) {
          details.push({ keterangan_custom: `Potongan Saldo Deposit`, jumlah: -deducted })
          total -= deducted
          await supabase.from('warga').update({ saldo_deposit: deposit - deducted }).eq('id', w.id)
        }
      }


      const { data: newT, error: errorT } = await supabase.from('tagihan').insert([{ warga_id: w.id, bulan: filterBulan.value, tahun: filterTahun.value, total: Math.max(0, total), status: total <= 0 ? 'lunas' : 'belum_bayar' }]).select().single()
      if (errorT) throw errorT
      if (details.length > 0) {
        await supabase.from('tagihan_detail').insert(details.map(d => ({ 
          tagihan_id: newT.id,
          jenis_iuran_id: d.jenis_iuran_id || null,
          keterangan_custom: d.keterangan_custom || null,
          jumlah: d.jumlah
        })))
      }
    }
    await fetchTagihan()
    await logActivity('GENERATE_TAGIHAN', 'tagihan', {
      periode: `${bulanNames[filterBulan.value - 1]} ${filterTahun.value}`,
      count: warga.length
    })
    alert('Tagihan berhasil digenerate.')
  } catch (err: any) {
    alert('Gagal: ' + err.message)
  } finally {
    generating.value = false
  }
}

const viewDetail = async (tagihan: Tagihan) => {
  selectedTagihan.value = tagihan
  const { data } = await supabase.from('tagihan_detail').select('*, jenis_iuran(*)').eq('tagihan_id', tagihan.id)
  tagihanDetails.value = data || []
  showDetailModal.value = true
}

const handleDeleteTagihan = async (id: string) => {
  if (!confirm('Hapus tagihan ini?')) return
  const { error } = await supabase.from('tagihan').delete().eq('id', id)
  if (!error) {
    await logActivity('DELETE_TAGIHAN', 'tagihan', { id })
    await fetchTagihan()
  } else {
    alert('Gagal menghapus: ' + error.message)
  }
}

const getPesanWA = (item: Tagihan) => {
  const rincian = tagihanDetails.value.map(d => {
    const label = d.jenis_iuran ? d.jenis_iuran.nama_iuran.replace('_', ' ') : d.keterangan_custom
    return `- ${label}: ${formatCurrency(d.jumlah)}`
  }).join('\n')
  return `Halo Bapak/Ibu ${item.warga?.nama_kepala_keluarga}, berikut rincian tagihan iuran periode ${bulanNames[item.bulan - 1]} ${item.tahun} untuk No. Rumah ${item.warga?.no_rumah}:

*RINCIAN:*
${rincian}

*TOTAL: ${formatCurrency(item.total)}*
Status: ${item.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR'}

📌 *Terima kasih atas partisipasinya dalam membayar iuran tepat waktu demi kelancaran kegiatan lingkungan kita.*

Terima kasih 🙏 - *Pengurus ${settingsStore.settings.orgType}*`
}

const sendWA = (item: Tagihan) => {
  const hp = item.warga?.no_hp
  if (!hp) return alert('No HP tidak ada')
  const formatted = hp.startsWith('0') ? '62' + hp.slice(1) : hp
  const pesan = getPesanWA(item)
  window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(pesan)}`, '_blank')
}

const copyRincian = () => {
  if (!selectedTagihan.value) return
  const pesan = getPesanWA(selectedTagihan.value)
  navigator.clipboard.writeText(pesan).then(() => {
    alert('Rincian teks berhasil dicopy ke clipboard!')
  })
}

const handleDownload = async () => {
  const node = document.getElementById('nota-canvas')
  if (!node) return
  
  try {
    const dataUrl = await toPng(node, { 
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        borderRadius: '0'
      }
    })
    const link = document.createElement('a')
    link.download = `Nota-${selectedTagihan.value?.warga?.no_rumah}-${bulanNames[(selectedTagihan.value?.bulan || 1) - 1]}.png`
    link.href = dataUrl
    link.click()
  } catch (err: any) {
    alert('Gagal mendownload gambar: ' + err.message)
  }
}

watch([filterBulan, filterTahun], fetchTagihan)
onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  fetchTagihan()
})
</script>
