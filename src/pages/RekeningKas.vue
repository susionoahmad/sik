<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Master Kas & Rekening</h2>
        <p class="text-slate-500 text-sm">Atur rekening, input saldo rekening koran, dan pantau selisih.</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <span>+ Tambah Rekening</span>
      </button>
    </div>

    <!-- Rekening Cards with Reconciliation -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="item in rekeningWithBalance"
        :key="item.id"
        :class="[
          'card border-l-4 space-y-3',
          item.jenis === 'tunai' ? 'border-amber-500' : 'border-blue-500'
        ]"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold text-slate-800">{{ item.nama_rekening }}</p>
            <span :class="[
              'text-xs px-2 py-0.5 rounded-full font-semibold',
              item.jenis === 'tunai' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            ]">{{ item.jenis }}</span>
          </div>
          <div class="flex gap-2 text-xs">
            <button @click="openEditModal(item)" class="text-primary-600 hover:text-primary-700 font-semibold">Edit</button>
            <button @click="handleDelete(item.id)" class="text-red-500 hover:text-red-600 font-semibold">Hapus</button>
          </div>
        </div>

        <!-- Saldo Sistem -->
        <div class="bg-slate-50 rounded-lg p-3 space-y-1 text-xs text-slate-600">
          <div class="flex justify-between"><span>Saldo Awal</span><span class="font-semibold">{{ formatCurrency(item.saldo_awal) }}</span></div>
          <div class="flex justify-between text-green-600"><span>+ Masuk</span><span class="font-semibold">{{ formatCurrency(item.totalMasuk) }}</span></div>
          <div class="flex justify-between text-red-600"><span>− Keluar</span><span class="font-semibold">{{ formatCurrency(item.totalKeluar) }}</span></div>
          <div class="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800">
            <span>Saldo Sistem</span><span>{{ formatCurrency(item.saldoSistem) }}</span>
          </div>
        </div>

        <!-- Rekonsiliasi (only for bank) -->
        <div v-if="item.jenis === 'bank'" class="space-y-2">
          <label class="text-xs font-semibold text-slate-600 block">Saldo Rekening Koran / m-Banking</label>
          <div class="flex gap-2">
            <input
              type="number"
              v-model.number="item.saldo_aktual_input"
              placeholder="Input saldo aktual..."
              class="input-field !py-1 text-sm flex-1"
              @keydown.enter="saveAktual(item)"
            />
            <button @click="saveAktual(item)" class="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-all font-semibold">
              Simpan
            </button>
          </div>
          <div v-if="item.saldo_aktual !== null && item.saldo_aktual !== undefined" class="flex justify-between text-xs rounded-lg p-2"
            :class="getSelisih(item) === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'"
          >
            <span>Selisih (Aktual vs Sistem)</span>
            <span class="font-bold">{{ getSelisih(item) === 0 ? '✅ Sesuai' : formatCurrency(Number(getSelisih(item))) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Info box -->
    <div class="card bg-blue-50 border border-blue-200 text-sm text-blue-800 space-y-1">
      <p class="font-bold">ℹ️ Tentang Rekonsiliasi Rekening</p>
      <p>Perbedaan <strong>Saldo Sistem</strong> vs <strong>Saldo Aktual</strong> bisa disebabkan oleh:</p>
      <ul class="list-disc list-inside text-xs space-y-0.5 ml-1">
        <li>Biaya administrasi bank bulanan</li>
        <li>Biaya transaksi ATM bank lain</li>
        <li>Potongan pajak bunga (20%)</li>
        <li>Pendapatan bunga tabungan</li>
      </ul>
      <p class="text-xs mt-1">Catat perbedaan ini sebagai transaksi di menu <strong>Pengeluaran</strong> (untuk biaya/potongan) atau <strong>Buku Kas {{ settingsStore.settings.orgType }}</strong> (untuk pendapatan bunga).</p>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full">
        <h3 class="text-xl font-bold mb-6 text-slate-800">{{ editingId ? 'Edit Rekening' : 'Tambah Rekening Baru' }}</h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Rekening/Bank</label>
            <input v-model="form.nama_rekening" type="text" class="input-field" placeholder="Contoh: Bank BCA, Kas Tunai Bendahara" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Jenis</label>
            <select v-model="form.jenis" class="input-field" required>
              <option value="tunai">Kas Tunai</option>
              <option value="bank">Rekening Bank</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Saldo Awal (Rp)</label>
            <input v-model.number="form.saldo_awal" type="number" class="input-field" required />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reconciliation Confirmation Modal -->
    <div v-if="rekonModal && rekonItem" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-md w-full space-y-4">
        <h3 class="text-xl font-bold text-slate-800">Konfirmasi Rekonsiliasi</h3>
        
        <div class="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-600">Rekening</span>
            <span class="font-bold">{{ rekonItem.nama_rekening }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Saldo Sistem</span>
            <span class="font-semibold">{{ formatCurrency(rekonItem.saldoSistem) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Saldo Rekening Koran</span>
            <span class="font-semibold">{{ formatCurrency(rekonItem.saldo_aktual_input ?? 0) }}</span>
          </div>
          <div class="flex justify-between border-t border-slate-200 pt-2 font-bold"
            :class="(rekonItem.saldo_aktual_input ?? 0) - rekonItem.saldoSistem > 0 ? 'text-green-600' : 'text-red-600'"
          >
            <span>Selisih</span>
            <span>{{ (rekonItem.saldo_aktual_input ?? 0) - rekonItem.saldoSistem > 0 ? '+' : '' }}{{ formatCurrency((rekonItem.saldo_aktual_input ?? 0) - rekonItem.saldoSistem) }}</span>
          </div>
        </div>

        <p class="text-sm text-slate-600">
          Selisih akan dicatat sebagai transaksi 
          <strong :class="(rekonItem.saldo_aktual_input ?? 0) - rekonItem.saldoSistem > 0 ? 'text-green-600' : 'text-red-600'">
            {{ (rekonItem.saldo_aktual_input ?? 0) - rekonItem.saldoSistem > 0 ? 'MASUK' : 'KELUAR' }}
          </strong>
          ke mutasi kas.
        </p>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan Penyesuaian</label>
          <input v-model="rekonKeterangan" type="text" class="input-field" placeholder="Contoh: Bunga tabungan Maret 2026" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="rekonModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
          <button @click="konfirmasiRekonsiliasi" class="btn-primary" :disabled="rekonSubmitting">
            {{ rekonSubmitting ? 'Memproses...' : 'Ya, Rekonsiliasi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'
import type { RekeningKas } from '@/types'

const settingsStore = useSettingsStore()

interface RekeningWithBalance extends RekeningKas {
  totalMasuk: number
  totalKeluar: number
  saldoSistem: number
  saldo_aktual: number | null
  saldo_aktual_input: number | null
}

const rekeningList = ref<RekeningKas[]>([])
const allTransactions = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  nama_rekening: '',
  jenis: 'bank' as 'tunai' | 'bank',
  saldo_awal: 0
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const rekeningWithBalance = computed<RekeningWithBalance[]>(() => {
  return rekeningList.value.map(rek => {
    const txs = allTransactions.value.filter(t => t.rekening_id === rek.id)
    const totalMasuk = txs.filter(t => t.jenis === 'masuk').reduce((a: number, b: any) => a + Number(b.jumlah), 0)
    const totalKeluar = txs.filter(t => t.jenis === 'keluar').reduce((a: number, b: any) => a + Number(b.jumlah), 0)
    const saldoSistem = Number(rek.saldo_awal) + totalMasuk - totalKeluar
    return {
      ...rek,
      totalMasuk,
      totalKeluar,
      saldoSistem,
      saldo_aktual: (rek as any).saldo_aktual ?? null,
      saldo_aktual_input: (rek as any).saldo_aktual ?? null
    }
  })
})

const getSelisih = (item: RekeningWithBalance) => {
  if (item.saldo_aktual === null) return null
  return item.saldo_aktual - item.saldoSistem
}

// Reconciliation modal state
const rekonModal = ref(false)
const rekonItem = ref<RekeningWithBalance | null>(null)
const rekonKeterangan = ref('')
const rekonSubmitting = ref(false)

const openRekonsiliasi = (item: RekeningWithBalance) => {
  rekonItem.value = item
  const selisih = (item.saldo_aktual_input ?? 0) - item.saldoSistem
  if (selisih === 0) {
    // Just save saldo_aktual, no adjustment needed
    saveAktualOnly(item)
    return
  }
  rekonKeterangan.value = selisih > 0 
    ? 'Penyesuaian rekening - pendapatan bunga/kredit bank'
    : 'Penyesuaian rekening - biaya adm/debet bank'
  rekonModal.value = true
}

const saveAktualOnly = async (item: RekeningWithBalance) => {
  const { error } = await supabase
    .from('rekening_kas')
    .update({ saldo_aktual: item.saldo_aktual_input })
    .eq('id', item.id)
  
  if (error) alert('Gagal menyimpan: ' + error.message)
  else {
    alert('✅ Saldo sesuai, rekonsiliasi berhasil.')
    await fetchRekening()
  }
}

const saveAktual = (item: RekeningWithBalance) => {
  openRekonsiliasi(item)
}

const konfirmasiRekonsiliasi = async () => {
  if (!rekonItem.value) return
  const item = rekonItem.value
  const selisih = (item.saldo_aktual_input ?? 0) - item.saldoSistem
  rekonSubmitting.value = true

  try {
    // 1. Create adjustment transaction
    const { error: txError } = await supabase.from('kas_transaksi').insert([{
      tanggal: new Date().toISOString().split('T')[0],
      jenis: selisih > 0 ? 'masuk' : 'keluar',
      kategori: 'Penyesuaian Bank',
      keterangan: rekonKeterangan.value || 'Penyesuaian rekening koran',
      jumlah: Math.abs(selisih),
      rekening_id: item.id
    }])
    if (txError) throw txError

    // 2. Save saldo_aktual
    const { error: rkError } = await supabase
      .from('rekening_kas')
      .update({ saldo_aktual: item.saldo_aktual_input })
      .eq('id', item.id)
    if (rkError) throw rkError

    rekonModal.value = false
    alert(`✅ Rekonsiliasi berhasil! Transaksi penyesuaian ${selisih > 0 ? 'masuk' : 'keluar'} Rp ${Math.abs(selisih).toLocaleString('id-ID')} telah dicatat ke mutasi kas.`)
    await Promise.all([fetchRekening(), fetchTransactions()])
  } catch (e: any) {
    alert('Gagal rekonsiliasi: ' + e.message)
  } finally {
    rekonSubmitting.value = false
  }
}

const fetchTransactions = async () => {
  const { data } = await supabase.from('kas_transaksi').select('rekening_id, jenis, jumlah')
  allTransactions.value = data || []
}

const fetchRekening = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('rekening_kas')
    .select('*')
    .order('nama_rekening', { ascending: true })
  
  if (error) {
    alert('Gagal mengambil data rekening: ' + error.message)
  } else {
    rekeningList.value = data || []
  }
  loading.value = false
}

const openAddModal = () => {
  editingId.value = null
  form.value = { nama_rekening: '', jenis: 'bank', saldo_awal: 0 }
  showModal.value = true
}

const openEditModal = (item: RekeningKas) => {
  editingId.value = item.id
  form.value = {
    nama_rekening: item.nama_rekening,
    jenis: item.jenis,
    saldo_awal: item.saldo_awal
  }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingId.value) {
      const { error } = await supabase.from('rekening_kas').update(form.value).eq('id', editingId.value)
      if (error) throw error
    } else {
      const { error } = await supabase.from('rekening_kas').insert([form.value])
      if (error) throw error
    }
    showModal.value = false
    await fetchRekening()
  } catch (e: any) {
    alert('Gagal menyimpan: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus rekening ini?')) return
  const { error } = await supabase.from('rekening_kas').delete().eq('id', id)
  if (error) alert('Gagal menghapus: ' + error.message)
  else await fetchRekening()
}

onMounted(async () => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
  await fetchRekening()
  await fetchTransactions()
})
</script>
