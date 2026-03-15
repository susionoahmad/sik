export interface Warga {
  id: string
  no_rumah: string
  nama_kepala_keluarga: string
  alamat: string
  no_hp: string
  status: 'aktif' | 'non-aktif',
  status_hunian: 'sendiri' | 'kontrak' | 'kosong'
  created_at: string
}

export interface JenisIuran {
  id: string
  nama_iuran: string
  nominal_default: number
  is_active: boolean
  created_at: string
}

export interface IuranWarga {
  id: string
  warga_id: string
  jenis_iuran_id: string
  nominal: number
  created_at: string
}

export interface Tagihan {
  id: string
  warga_id: string
  bulan: number
  tahun: number
  total: number
  status: 'belum_bayar' | 'lunas'
  created_at: string
  warga?: Warga
  tagihan_detail?: TagihanDetail[]
}

export interface TagihanDetail {
  id: string
  tagihan_id: string
  jenis_iuran_id: string | null
  keterangan_custom?: string | null
  jumlah: number
  jenis_iuran?: JenisIuran
}

export interface RekeningKas {
  id: string
  nama_rekening: string
  jenis: 'tunai' | 'bank'
  saldo_awal: number
  created_at: string
}

export interface KasTransaksi {
  id: string
  tanggal: string
  jenis: 'masuk' | 'keluar'
  kategori: string
  keterangan: string
  jumlah: number
  rekening_id?: string
  transfer_ke_rekening_id?: string
  created_at: string
}

export interface PembayaranTagihan {
  id: string
  tagihan_id: string
  kas_transaksi_id: string
  tanggal: string
  jumlah: number
  metode_pembayaran: string
  bukti_transfer: string
  created_at: string
}

export interface MeterAir {
  id: string
  warga_id: string
  bulan: number
  tahun: number
  meter_awal: number
  meter_akhir: number
  pemakaian: number
  tarif_per_m3: number
  total: number
  is_late: boolean
  warga?: Warga
}
