
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data: trans, error } = await supabase.from('kas_transaksi').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error(error)
    return
  }
  console.log('--- Transactions (Last 10) ---')
  trans.slice(0, 10).forEach(t => {
    console.log(`${t.tanggal} | ${t.jenis} | ${t.kategori} | ${t.jumlah} | ${t.keterangan}`)
  })

  const { data: rek, error: rErr } = await supabase.from('rekening_kas').select('*')
  console.log('\n--- Rekening ---')
  rek.forEach(r => {
    console.log(`${r.id} | ${r.nama_rekening} | Saldo Awal: ${r.saldo_awal}`)
  })
}

check()
