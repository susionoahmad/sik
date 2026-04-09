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

export interface Surat {
  id: string
  nomor_surat: string
  judul_surat: string
  tanggal_surat: string
  tanggal_diterima?: string
  pengirim: string
  penerima: string
  perihal: string
  kategori: 'masuk' | 'keluar'
  file_url: string
  created_at: string
}

export interface SuratTemplate {
  id: string
  nama_template: string
  konten_template: string
  created_at: string
}

export interface Notulen {
  id: string
  agenda_id?: string
  judul_rapat: string
  tanggal_rapat: string
  lokasi: string
  pimpinan_rapat: string
  notulis: string
  peserta: string[] // Keep for backward compatibility if needed
  peserta_warga: string[] // Array of Warga IDs
  peserta_luar: string[] // Array of guest names
  agenda: string
  pembahasan: string
  keputusan: string
  file_url: string
  created_at: string
}

