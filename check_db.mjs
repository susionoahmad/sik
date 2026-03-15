import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://duuxdckmvvqmnomscbmm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dXhkY2ttdnZxbW5vbXNjYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDMwMzUsImV4cCI6MjA4ODgxOTAzNX0.fwYROJvkdnEbT6tW5o8OhHWaO3I-OBjo-AjBygFZQxw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: trans, error } = await supabase.from('kas_transaksi').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error(error)
    return
  }
  console.log('--- Transactions ---')
  trans.forEach(t => {
    console.log(`${t.tanggal} | ${t.id.slice(0,5)}... | ${t.jenis} | ${t.kategori} | ${t.jumlah} | ${t.rekening_id} | ${t.keterangan}`)
  })

  const { data: rek, error: rErr } = await supabase.from('rekening_kas').select('*')
  console.log('\n--- Rekening ---')
  rek.forEach(r => {
    console.log(`${r.id} | ${r.nama_rekening} | Saldo Awal: ${r.saldo_awal}`)
  })
}

check()
