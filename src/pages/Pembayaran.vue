<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Pembayaran Tagihan</h2>
        <p class="text-slate-500 text-sm">Proses pembayaran tagihan warga dan catat ke kas.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form Pembayaran -->
      <div class="lg:col-span-1 space-y-6">
        <div class="card">
          <h3 class="text-lg font-bold mb-4 text-slate-800">Input Pembayaran</h3>
          <div v-if="!selectedTagihan" class="text-center py-8 text-slate-500 italic">
            Pilih tagihan dari tabel di samping untuk memulai proses pembayaran.
          </div>
          <form v-else @submit.prevent="handlePayment" class="space-y-4">
            <div class="p-3 bg-primary-50 rounded-lg border border-primary-100 text-sm">
              <p class="text-primary-700 font-semibold uppercase text-xs mb-1">Tagihan Terpilih</p>
              <p class="text-slate-900 font-bold">{{ selectedTagihan.warga?.nama_kepala_keluarga }} ({{ selectedTagihan.warga?.no_rumah }})</p>
              <p class="text-slate-600">{{ bulanNames[selectedTagihan.bulan - 1] }} {{ selectedTagihan.tahun }}</p>
              <p class="text-primary-800 text-lg font-bold mt-1">{{ formatCurrency(selectedTagihan.total) }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal Bayar</label>
              <input v-model="form.tanggal" type="date" class="input-field" required />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran</label>
              <select v-model="form.metode_pembayaran" class="input-field">
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Masuk ke Kas/Rekening</label>
              <select v-model="form.rekening_id" class="input-field" required>
                <option v-for="rek in rekeningList" :key="rek.id" :value="rek.id">
                  {{ rek.nama_rekening }} ({{ rek.jenis }})
                </option>
              </select>
            </div>

            <div v-if="form.metode_pembayaran === 'Transfer'">
              <label class="block text-sm font-medium text-slate-700 mb-1">Bukti Transfer (Gambar)</label>
              <input type="file" @change="handleFileUpload" accept="image/*" class="input-field text-sm" />
              <div v-if="uploadingImg" class="mt-2 text-xs text-primary-600 animate-pulse">Uploading image...</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Jumlah Bayar (Rp)</label>
              <input v-model.number="form.jumlah_bayar" type="number" class="input-field font-bold text-lg text-primary-700" required />
              <p v-if="form.jumlah_bayar > selectedTagihan.total" class="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-wider">
                ✨ Kelebihan {{ formatCurrency(form.jumlah_bayar - selectedTagihan.total) }} akan masuk ke deposit warga
              </p>
            </div>

            <button type="submit" class="w-full btn-primary" :disabled="submitting">
              {{ submitting ? 'Memproses...' : 'Simpan Pembayaran' }}
            </button>
            <button type="button" @click="selectedTagihan = null" class="w-full text-slate-500 hover:text-slate-700 text-sm py-2">Batal</button>
          </form>
        </div>
      </div>

      <!-- Daftar Tagihan Belum Bayar -->
      <div class="lg:col-span-2">
        <div class="card !p-0 overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-bold text-slate-800">Tagihan Belum Lunas</h3>
            <div class="flex gap-2">
              <select v-model="filterBulan" class="input-field !py-1 !px-2 text-sm w-32">
                <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase font-semibold">
                <tr>
                  <th class="px-6 py-4">Warga</th>
                  <th class="px-6 py-4">Periode</th>
                  <th class="px-6 py-4">Total</th>
                  <th class="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
                  <td colspan="4" class="px-6 py-4 font-medium"><div class="h-4 bg-slate-200 rounded w-full"></div></td>
                </tr>
                <tr v-else-if="unpaidTagihan.length === 0">
                  <td colspan="4" class="px-6 py-12 text-center text-slate-500 italic">
                    Semua tagihan bulan ini sudah lunas atau belum ada tagihan.
                  </td>
                </tr>
                <tr v-else v-for="item in unpaidTagihan" :key="item.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-bold text-slate-900">{{ item.warga?.nama_kepala_keluarga }}</p>
                    <p class="text-xs text-slate-500">{{ item.warga?.no_rumah }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ bulanNames[item.bulan - 1] }} {{ item.tahun }}</td>
                  <td class="px-6 py-4 font-semibold text-primary-600">{{ formatCurrency(item.total) }}</td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      @click="selectedTagihan = item" 
                      class="bg-primary-50 text-primary-600 px-3 py-1 rounded-lg text-sm font-bold border border-primary-200 hover:bg-primary-600 hover:text-white transition-all"
                    >
                      Pilih
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useLogger } from '@/utils/logger'
import type { Tagihan, RekeningKas } from '@/types'

const route = useRoute()
const { logActivity } = useLogger()
const unpaidTagihan = ref<Tagihan[]>([])
const rekeningList = ref<RekeningKas[]>([])
const loading = ref(true)
const submitting = ref(false)
const uploadingImg = ref(false)
const selectedTagihan = ref<Tagihan | null>(null)

const filterBulan = ref(new Date().getMonth() + 1)
const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const form = ref({
  tanggal: new Date().toISOString().split('T')[0],
  metode_pembayaran: 'Tunai',
  bukti_transfer: '',
  rekening_id: '',
  jumlah_bayar: 0
})

watch(() => selectedTagihan.value, (val) => {
  if (val) {
    form.value.jumlah_bayar = val.total
  }
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const fetchRekening = async () => {
  const { data } = await supabase.from('rekening_kas').select('*').order('nama_rekening', { ascending: true })
  rekeningList.value = data || []
  if ((rekeningList.value?.length ?? 0) > 0) {
    form.value.rekening_id = rekeningList.value[0]?.id ?? ''
  }
}

const fetchUnpaid = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('tagihan')
    .select('*, warga(*)')
    .eq('status', 'belum_bayar')
    .eq('bulan', filterBulan.value)
    .order('created_at', { ascending: false })
  
  if (error) {
    alert('Gagal mengambil data tagihan: ' + error.message)
  } else {
    unpaidTagihan.value = data || []
    
    // Check if redirect from detail tagihan
    const tagihanId = route.query.tagihan_id
    if (tagihanId) {
      const found = unpaidTagihan.value.find(t => t.id === tagihanId)
      if (found) selectedTagihan.value = found
    }
  }
  loading.value = false
}

const handleFileUpload = async (event: any) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingImg.value = true
  console.log('Uploading image...', file.name)
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `bukti-pembayaran/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('pembayaran')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Gagal upload bukti: ' + uploadError.message)
    } else {
      const { data } = supabase.storage.from('pembayaran').getPublicUrl(filePath)
      form.value.bukti_transfer = data.publicUrl
      console.log('Upload success, public URL:', data.publicUrl)
    }
  } catch (e: any) {
    console.error('Caught upload error:', e)
    alert('Gagal upload: ' + e.message)
  } finally {
    uploadingImg.value = false
  }
}

const handlePayment = async () => {
  if (!selectedTagihan.value) return
  if (!form.value.rekening_id) {
    alert('Silakan pilih rekening tujuan kas.')
    return
  }
  submitting.value = true
  console.log('Starting payment process for tagihan:', selectedTagihan.value.id)

  try {
    // 1. Create Kas Transaksi
    console.log('Step 1: Creating kas_transaksi...')
    const { data: kas, error: errorKas } = await supabase
      .from('kas_transaksi')
      .insert([{
        tanggal: form.value.tanggal,
        jenis: 'masuk',
        kategori: 'iuran_warga',
        keterangan: `Pembayaran iuran ${selectedTagihan.value.warga?.nama_kepala_keluarga} (${bulanNames[selectedTagihan.value.bulan - 1]} ${selectedTagihan.value.tahun})` + (form.value.jumlah_bayar > selectedTagihan.value.total ? ` + Deposit` : ''),
        jumlah: form.value.jumlah_bayar,
        rekening_id: form.value.rekening_id
      }])
      .select()
      .single()

    if (errorKas) {
      console.error('Kas insert error:', errorKas)
      throw errorKas
    }
    console.log('Kas transaksi created with ID:', kas.id)

    // 2. Create Pembayaran Tagihan
    console.log('Step 2: Creating pembayaran_tagihan...')
    const { error: errorPay } = await supabase
      .from('pembayaran_tagihan')
      .insert([{
        tagihan_id: selectedTagihan.value.id,
        kas_transaksi_id: kas.id,
        tanggal: form.value.tanggal,
        jumlah: selectedTagihan.value.total,
        metode_pembayaran: form.value.metode_pembayaran,
        bukti_transfer: form.value.bukti_transfer
      }])

    if (errorPay) {
      console.error('Pembayaran insert error:', errorPay)
      throw errorPay
    }
    console.log('Pembayaran tagihan record created')

    // 3. Update Tagihan Status
    console.log('Step 3: Updating tagihan status to lunas...')
    const { error: errorT } = await supabase
      .from('tagihan')
      .update({ status: 'lunas' })
      .eq('id', selectedTagihan.value.id)

    if (errorT) {
      console.error('Tagihan update error:', errorT)
      throw errorT
    }
    console.log('Tagihan status updated successfully')

    // 4. Update Citizen Deposit if overpaid
    const excess = form.value.jumlah_bayar - selectedTagihan.value.total
    if (excess > 0) {
      console.log('Step 4: Overpayment detected. Adding to deposit:', excess)
      // We use rpc call or direct update with existing value
      // Checking current deposit first (safer if column exists)
      const { data: currentW } = await supabase.from('warga').select('saldo_deposit').eq('id', selectedTagihan.value.warga_id).single()
      const newDeposit = (currentW?.saldo_deposit || 0) + excess
      
      const { error: errorDep } = await supabase
        .from('warga')
        .update({ saldo_deposit: newDeposit })
        .eq('id', selectedTagihan.value.warga_id)
      
      if (errorDep) {
        console.warn('Failed to update deposit (column might be missing):', errorDep)
        // We don't throw here to avoid failing the whole successful payment
      } else {
        console.log('Deposit updated successfully')
      }
    }

    alert('Pembayaran berhasil diproses.')
    await logActivity('PROCESS_PAYMENT', 'pembayaran_tagihan', {
      warga_name: selectedTagihan.value.warga?.nama_kepala_keluarga,
      no_rumah: selectedTagihan.value.warga?.no_rumah,
      periode: `${bulanNames[selectedTagihan.value.bulan - 1]} ${selectedTagihan.value.tahun}`,
      jumlah: form.value.jumlah_bayar,
      metode: form.value.metode_pembayaran
    })
    selectedTagihan.value = null
    await fetchUnpaid()
  } catch (e: any) {
    console.error('Caught error in handlePayment:', e)
    alert('Gagal memproses pembayaran: ' + (e.message || e.details || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

watch(filterBulan, fetchUnpaid)
onMounted(() => {
  fetchUnpaid()
  fetchRekening()
})
</script>
