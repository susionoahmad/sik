<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Laporan & Rekapitulasi</h2>
        <p class="text-slate-500 text-sm">Cetak dan tinjau laporan keuangan serta kegiatan {{ settingsStore.organizationLabel }}.</p>
      </div>
      <div class="flex gap-2 flex-wrap items-center">
        <!-- Main Report Category -->
        <select v-model="selectedLaporan" class="input-field !py-1 w-64 font-bold">
          <optgroup label="KEUANGAN">
            <option value="kas">💰 Laporan Kas {{ settingsStore.organizationLabel }}</option>
            <option value="pemasukan">📈 Laporan Pemasukan</option>
            <option value="pengeluaran">📉 Laporan Pengeluaran</option>
            <option value="tagihan">🧾 Laporan Tagihan {{ settingsStore.residentLabel }}</option>
            <option value="meteran">💧 Laporan Meteran Air</option>
          </optgroup>
          <optgroup label="AGENDA & KEDISIPLINAN">
            <option value="rekap_rapat">📖 Rekapitulasi Rapat</option>
            <option value="pra_absensi">📝 Pra-Absensi Rapat</option>
            <option value="absensi_final">✅ Absensi Final Rapat</option>
            <option value="matriks_kehadiran">⚖️ Matriks Kehadiran (Disiplin)</option>
          </optgroup>
        </select>

        <!-- Dynamic Agenda Selector -->
        <select 
          v-if="['pra_absensi', 'absensi_final'].includes(selectedLaporan)"
          v-model="selectedAgendaId" 
          class="input-field !py-1 w-64 bg-indigo-50 border-indigo-200 text-indigo-700 font-bold animate-in fade-in duration-300"
        >
          <option value="">-- Pilih Agenda --</option>
          <option v-for="a in agendaOptions" :key="a.id" :value="a.id">
            {{ formatDateShort(a.tanggal) }} - {{ a.judul }}
          </option>
        </select>

        <div class="flex gap-2">
          <select v-model="filterBulan" class="input-field !py-1 w-32">
            <option v-for="(b, i) in bulanNames" :key="i" :value="i + 1">{{ b }}</option>
          </select>
          <select v-model="filterTahun" class="input-field !py-1 w-24">
            <option v-for="y in tahunRange" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button @click="handlePrint" class="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-all shadow-sm">
            <span>🖨️ Cetak</span>
          </button>
          <button @click="handleExport" class="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-sm">
            <span>📊 Excel</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Report View -->
    <div class="card !p-8 bg-white shadow-lg border border-slate-200 min-h-[600px] print:shadow-none print:border-none">
      <!-- Kop Surat -->
      <div class="text-center border-b-2 border-slate-800 pb-6 mb-8">
        <h1 class="text-2xl font-bold uppercase tracking-widest text-slate-900">Laporan {{ settingsStore.organizationLabel }}</h1>
        <p class="text-lg font-semibold text-slate-700 mt-1 uppercase">{{ laporanTitle }}</p>
        <p class="text-slate-500 italic text-sm mt-1">Periode: {{ bulanNames[filterBulan - 1] }} {{ filterTahun }}</p>
      </div>

      <!-- Specific Agenda Info Header -->
      <div v-if="selectedAgenda && ['pra_absensi', 'absensi_final'].includes(selectedLaporan)" class="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase">Judul Rapat</p>
          <p class="text-sm font-bold text-slate-800">{{ selectedAgenda.judul }}</p>
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase">Tanggal / Waktu</p>
          <p class="text-sm font-bold text-slate-800">{{ formatDate(selectedAgenda.tanggal) }} ({{ selectedAgenda.waktu }} WIB)</p>
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase">Lokasi</p>
          <p class="text-sm font-bold text-slate-800">{{ selectedAgenda.lokasi }}</p>
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase">Status Agenda</p>
          <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider" :class="selectedAgenda.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
            {{ selectedAgenda.status }}
          </span>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse border border-slate-300">
          <thead class="bg-slate-100 border-b border-slate-300">
            <!-- FINANCE HEADERS -->
            <tr v-if="selectedLaporan === 'kas'">
              <th class="border border-slate-300 px-4 py-2">Tanggal</th>
              <th class="border border-slate-300 px-4 py-2">Keterangan</th>
              <th class="border border-slate-300 px-4 py-2">Pemasukan</th>
              <th class="border border-slate-300 px-4 py-2">Pengeluaran</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'tagihan'">
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2">Nama {{ settingsStore.residentLabel }}</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Iuran Pokok</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Tunggakan</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Deposit</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Total Tagihan</th>
              <th class="border border-slate-300 px-4 py-2">Status</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'meteran'">
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2">Nama {{ settingsStore.residentLabel }}</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Awal</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Akhir</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Pakai (m³)</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Total (Rp)</th>
            </tr>
            
            <!-- AGENDA HEADERS -->
            <tr v-else-if="selectedLaporan === 'pra_absensi'">
              <th class="border border-slate-300 px-4 py-2 w-16">No</th>
              <th class="border border-slate-300 px-4 py-2">Nama {{ settingsStore.residentLabel }}</th>
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Rencana</th>
              <th class="border border-slate-300 px-4 py-2">Alasan / Aspirasi</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'absensi_final'">
              <th class="border border-slate-300 px-4 py-2 w-16">No</th>
              <th class="border border-slate-300 px-4 py-2">Nama {{ settingsStore.residentLabel }}</th>
              <th class="border border-slate-300 px-4 py-2">No. Rumah</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Status Kehadiran</th>
            </tr>
            <tr v-else-if="selectedLaporan === 'rekap_rapat'">
              <th class="border border-slate-300 px-4 py-2">Tanggal</th>
              <th class="border border-slate-300 px-4 py-2">Judul Agenda</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Rencana Hadir</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Realisasi Hadir</th>
              <th class="border border-slate-300 px-4 py-2 text-center">Aspirasi</th>
            </tr>

            <!-- MATRIKS HEADER (DYNAMIC) -->
            <tr v-else-if="selectedLaporan === 'matriks_kehadiran'">
              <th class="border border-slate-300 px-4 py-2 w-16">No</th>
              <th class="border border-slate-300 px-4 py-2">Warga / No. Rumah</th>
              <th 
                v-for="a in matrixAgendas" 
                :key="a.id" 
                class="border border-slate-300 px-2 py-2 text-[8px] text-center whitespace-normal w-12"
              >
                {{ formatDateShort(a.tanggal) }}
              </th>
              <th class="border border-slate-300 px-4 py-2 text-center text-red-600 bg-red-50">ALPHA</th>
              <th class="border border-slate-300 px-4 py-2">Keterangan</th>
            </tr>

            <!-- DEFAULT FINANCE HEADER -->
            <tr v-else>
              <th class="border border-slate-300 px-4 py-2">Tanggal</th>
              <th class="border border-slate-300 px-4 py-2">Kategori</th>
              <th class="border border-slate-300 px-4 py-2">Keterangan</th>
              <th class="border border-slate-300 px-4 py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="text-center py-12 text-slate-500 font-medium italic">Memuat data laporan...</td>
            </tr>
            <tr v-else-if="reportData.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-500 font-medium italic">
                {{ selectedLaporan === 'pra_absensi' || selectedLaporan === 'absensi_final' ? (selectedAgendaId ? 'Tidak ada data presensi.' : 'Silakan pilih agenda terlebih dahulu.') : 'Tidak ada data untuk periode ini.' }}
              </td>
            </tr>
            <tr v-else v-for="(item, idx) in reportData" :key="idx" class="even:bg-slate-50/50">
              <!-- KAS VIEW -->
              <template v-if="selectedLaporan === 'kas'">
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ formatDate(item.tanggal) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.keterangan }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-medium text-green-700">
                  {{ item.jenis === 'masuk' ? formatCurrency(item.jumlah) : '-' }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-medium text-red-700">
                  {{ item.jenis === 'keluar' ? formatCurrency(item.jumlah) : '-' }}
                </td>
              </template>

              <!-- TAGIHAN VIEW -->
              <template v-else-if="selectedLaporan === 'tagihan'">
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.warga?.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.warga?.nama_kepala_keluarga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => !d.keterangan_custom).reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right text-orange-600">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Tunggakan Bulan Sebelumnya').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right text-red-600 font-medium">
                  {{ formatCurrency((item.tagihan_detail || []).filter((d: TagihanDetail) => d.keterangan_custom === 'Potongan Saldo Deposit').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0)) }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold text-primary-600 text-right">{{ formatCurrency(item.total) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm uppercase font-bold text-center" :class="item.status === 'lunas' ? 'text-green-600' : 'text-red-600'">
                  {{ item.status === 'lunas' ? 'Lunas' : 'Belum Bayar' }}
                </td>
              </template>

              <!-- METERAN VIEW -->
              <template v-else-if="selectedLaporan === 'meteran'">
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.warga?.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.warga?.nama_kepala_keluarga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center">{{ item.meter_awal }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center">{{ item.meter_akhir }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-center font-bold">{{ item.pemakaian }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm text-right font-bold">{{ formatCurrency(item.total) }}</td>
              </template>

              <!-- PRA ABSENSI VIEW -->
              <template v-else-if="selectedLaporan === 'pra_absensi'">
                <td class="border border-slate-300 px-4 py-2 text-xs font-bold text-slate-400">{{ idx + 1 }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.nama_warga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-center">
                  <span :class="item.status === 'hadir' ? 'text-green-600 font-black' : 'text-amber-600 font-black'" class="text-[10px] uppercase">
                    {{ item.status }}
                  </span>
                </td>
                <td class="border border-slate-300 px-4 py-2 text-xs italic text-slate-500">
                  {{ item.status === 'tidak_hadir' ? (item.alasan || '-') : (item.masukan_aspirasi || '-') }}
                </td>
              </template>

              <!-- ABSENSI FINAL VIEW -->
              <template v-else-if="selectedLaporan === 'absensi_final'">
                <td class="border border-slate-300 px-4 py-2 text-xs font-bold text-slate-400">{{ idx + 1 }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ item.nama_warga }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.no_rumah }}</td>
                <td class="border border-slate-300 px-4 py-2 text-center">
                  <span v-if="item.is_final" class="bg-green-100 text-green-700 px-4 py-0.5 rounded-full text-[9px] font-black tracking-widest">
                    HADIR
                  </span>
                  <span v-else class="text-slate-300 font-bold text-[9px]">TIDAK HADIR</span>
                </td>
              </template>

              <!-- REKAPITULASI RAPAT VIEW -->
              <template v-else-if="selectedLaporan === 'rekap_rapat'">
                <td class="border border-slate-300 px-4 py-2 text-sm font-bold">{{ formatDate(item.tanggal) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.judul }}</td>
                <td class="border border-slate-300 px-4 py-2 text-center text-sm font-bold">{{ item.stats?.pra_hadir }} Orang</td>
                <td class="border border-slate-300 px-4 py-2 text-center text-sm font-bold text-indigo-700">{{ item.stats?.final_hadir }} Orang</td>
                <td class="border border-slate-300 px-4 py-2 text-center text-sm font-bold text-green-700">{{ item.stats?.aspirasi }}</td>
              </template>

              <!-- MATRIKS KEHADIRAN VIEW -->
              <template v-else-if="selectedLaporan === 'matriks_kehadiran'">
                <td class="border border-slate-300 px-4 py-2 text-xs font-bold text-slate-400">{{ idx + 1 }}</td>
                <td class="border border-slate-300 px-4 py-2">
                  <div class="text-xs font-black text-slate-800">{{ item.warga.nama_kepala_keluarga }}</div>
                  <div class="text-[9px] font-bold text-primary-500 uppercase">{{ item.warga.no_rumah }}</div>
                </td>
                <td 
                  v-for="a in matrixAgendas" 
                  :key="a.id"
                  class="border border-slate-300 px-1 py-2 text-center"
                >
                  <span v-if="getMatrixStatus(item, a.id) === 'HADIR'" class="text-green-600 font-black text-[10px]">✔</span>
                  <span v-else-if="getMatrixStatus(item, a.id) === 'IZIN'" class="text-amber-500 font-black text-[9px]">i</span>
                  <span v-else class="text-red-500 font-black text-[10px]">✘</span>
                </td>
                <td class="border border-slate-300 px-4 py-2 text-center font-black text-red-600 bg-red-50/30">
                  {{ item.alphaCount }}
                </td>
                <td class="border border-slate-300 px-4 py-2 text-[10px] italic text-slate-500">
                  <span v-if="item.alphaCount >= 3" class="text-red-600 font-bold uppercase">Critical: {{ item.alphaCount }}x Alpha</span>
                  <span v-else-if="item.alphaCount > 0">{{ item.alphaCount }}x Tanpa Konfirmasi</span>
                </td>
              </template>

              <!-- OTHER TRANSACTIONS VIEW -->
              <template v-else>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ formatDate(item.tanggal) }}</td>
                <td class="border border-slate-300 px-4 py-2 text-xs font-bold">{{ item.kategori }}</td>
                <td class="border border-slate-300 px-4 py-2 text-sm">{{ item.keterangan }}</td>
                <td class="border border-slate-300 px-4 py-2 text-right font-bold">{{ formatCurrency(item.jumlah) }}</td>
              </template>
            </tr>
          </tbody>

          <!-- TABLE FOOTERS -->
          <tfoot v-if="reportData.length > 0 && !loading" class="bg-slate-100 font-bold">
            <tr v-if="selectedLaporan === 'kas'">
              <td colspan="2" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Total Arus Kas</td>
              <td class="border border-slate-300 px-4 py-2 text-green-700 text-xs">{{ formatCurrency(totalMasuk) }}</td>
              <td class="border border-slate-300 px-4 py-2 text-red-700 text-xs">{{ formatCurrency(totalKeluar) }}</td>
            </tr>
            <tr v-else-if="selectedLaporan === 'tagihan'">
              <td colspan="5" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Total Penagihan</td>
              <td colspan="2" class="border border-slate-300 px-4 py-2 text-primary-700 text-right text-xs">{{ formatCurrency(totalTagihan) }}</td>
            </tr>
            <tr v-else-if="selectedLaporan === 'meteran'">
              <td colspan="4" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Total Pemakaian</td>
              <td class="border border-slate-300 px-4 py-2 text-center text-xs">{{ reportData.reduce((a, b) => a + Number(b.pemakaian || 0), 0) }} m³</td>
              <td class="border border-slate-300 px-4 py-2 text-right text-xs">{{ formatCurrency(reportData.reduce((a, b) => a + Number(b.total || 0), 0)) }}</td>
            </tr>
            <tr v-else-if="['pra_absensi', 'absensi_final'].includes(selectedLaporan)">
              <td :colspan="selectedLaporan === 'pra_absensi' ? 3 : 2" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Total Partisipasi</td>
              <td colspan="2" class="border border-slate-300 px-4 py-2 text-indigo-700 text-xs text-center font-black">
                {{ reportData.filter(i => selectedLaporan === 'pra_absensi' ? i.status === 'hadir' : i.is_final).length }} Peserta Hadir
              </td>
            </tr>
            <tr v-else-if="selectedLaporan === 'rekap_rapat'">
               <td colspan="2" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Rata-rata Kehadiran</td>
               <td class="border border-slate-300 px-4 py-2 text-center text-xs">
                 {{ reportData.length ? (reportData.reduce((a,b) => a + b.stats.pra_hadir, 0) / reportData.length).toFixed(1) : 0 }} Orang
               </td>
               <td class="border border-slate-300 px-4 py-2 text-center text-xs text-indigo-700">
                 {{ reportData.length ? (reportData.reduce((a,b) => a + b.stats.final_hadir, 0) / reportData.length).toFixed(1) : 0 }} Orang (Final)
               </td>
               <td class="border border-slate-300 px-4 py-2 text-center text-xs">{{ reportData.reduce((a,b) => a + b.stats.aspirasi, 0) }} Pesan</td>
            </tr>
            <tr v-else-if="selectedLaporan === 'matriks_kehadiran'">
              <td :colspan="2 + matrixAgendas.length" class="border border-slate-300 px-4 py-2 text-right uppercase text-[10px]">Rata-rata Tingkat Pelanggaran (Alpha)</td>
              <td class="border border-slate-300 px-4 py-2 text-center text-red-600 bg-red-50 text-[10px]">
                {{ reportData.length ? (reportData.reduce((a, b) => a + b.alphaCount, 0) / reportData.length).toFixed(1) : 0 }}
              </td>
              <td class="border border-slate-300 px-4 py-2"></td>
            </tr>
            <tr v-else>
              <td colspan="3" class="border border-slate-300 px-4 py-2 text-right uppercase text-xs">Total Keseluruhan</td>
              <td class="border border-slate-300 px-4 py-2 text-right text-xs">{{ formatCurrency(totalGeneral) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- RECAPS FOR DIFFERENT REPORTS -->
      <!-- Ringkasan Kehadiran Matriks -->
      <div v-if="selectedLaporan === 'matriks_kehadiran' && !loading && reportData.length > 0" class="mt-8 space-y-4 border-t-2 border-slate-800 pt-6 print:mt-6 print:break-inside-avoid">
         <h3 class="font-bold text-slate-900 uppercase underline mb-4 print:text-sm">Legenda & Ringkasan Kedisiplinan</h3>
         <div class="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">
            <div class="flex items-center gap-2">
              <span class="text-green-600 text-lg">✔</span> Hadir (Terkonfirmasi)
            </div>
            <div class="flex items-center gap-2">
              <span class="text-amber-500 text-lg">i</span> Izin (Dengan Konfirmasi)
            </div>
            <div class="flex items-center gap-2">
              <span class="text-red-500 text-lg">✘</span> Alpha (Tanpa Konfirmasi)
            </div>
         </div>
         <div class="bg-red-50 p-6 rounded-2xl border border-red-100 flex justify-between items-center sm:w-1/2">
            <div>
              <p class="text-[10px] font-black text-red-500 uppercase tracking-widest">Warga Paling Sering Alpha (>=3x)</p>
              <p class="text-2xl font-black text-red-700 mt-1">{{ reportData.filter(i => i.alphaCount >= 3).length }} Rumah</p>
            </div>
            <div class="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center text-red-700">
               <AlertOctagonIcon class="w-6 h-6" />
            </div>
         </div>
         <p class="text-[10px] italic text-slate-400 mt-4 leading-relaxed">* Dasar penilaian adalah pengisian pra-absensi dan absensi final. Warga yang tidak merespon sama sekali dianggap Alpha tanpa konfirmasi.</p>
      </div>

      <!-- Ringkasan Kas (Recap) -->
      <div v-if="selectedLaporan === 'kas' && !loading && reportData.length > 0" class="mt-8 space-y-4 border-t-2 border-slate-800 pt-6 print:mt-6 print:break-inside-avoid">
        <h3 class="font-bold text-slate-900 uppercase underline mb-4 print:text-sm">Ringkasan Kas (Rekapitulasi)</h3>
        
        <div class="space-y-4 print:space-y-2">
          <div v-for="summary in rekeningSummaries" :key="summary.id" class="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300 print:p-2">
            <h4 class="font-bold text-primary-700 mb-2 border-b border-primary-100 pb-1 print:text-slate-900 print:border-slate-800">{{ summary.nama }} ({{ summary.jenis }})</h4>
            <div class="grid grid-cols-3 gap-4 text-sm print:gap-2 print:text-xs">
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold print:text-slate-600">Saldo Awal</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(summary.saldoAwal) }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold text-green-600 print:text-slate-600">Arus Kas</span>
                <span class="font-bold" :class="summary.netto >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ (summary.netto >= 0 ? '+' : '') + formatCurrency(summary.netto) }}
                </span>
              </div>
              <div class="flex flex-col">
                <span class="text-slate-500 text-[10px] uppercase font-semibold text-primary-600 print:text-slate-600">Saldo Akhir</span>
                <span class="font-black text-primary-700 text-base print:text-slate-900 print:text-sm">{{ formatCurrency(summary.saldoAkhir) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Keseluruhan -->
        <div class="bg-slate-900 text-white p-4 rounded-lg shadow-inner flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-800 print:p-2 print:mt-4">
          <span class="font-bold uppercase tracking-wider print:text-xs">Total Kas Besar (Seluruh Rekening)</span>
          <span class="text-xl font-black text-primary-400 print:text-slate-900 print:text-base">{{ formatCurrency(totalKasBesar) }}</span>
        </div>
      </div>

      <!-- Tanda Tangan (Dynamic Roles) -->
      <div class="mt-20 flex flex-col items-center gap-y-12 px-8 print:mt-12 print:break-inside-avoid">
        <!-- Baris Atas: Dibuat Oleh (Either Bendahara or Sekretaris) -->
        <div class="flex justify-center w-full">
          <div v-for="(person, index) in makerTtd" :key="'m-'+index" class="text-center min-w-[200px]">
            <p class="text-sm mb-20 font-medium text-slate-800">
              Dibuat Oleh,<br/>
              {{ person.role }}
            </p>
            <p class="font-bold underline">{{ person.name }}</p>
          </div>
        </div>

        <!-- Baris Bawah: Mengetahui (Ketua) -->
        <div class="flex justify-around w-full max-w-3xl">
          <div v-for="(person, index) in ketuaTtd" :key="'k-'+index" class="text-center min-w-[200px]">
            <p class="text-sm mb-20 font-medium text-slate-800">
              Mengetahui,<br/>
              {{ person.role }}
            </p>
            <p class="font-bold underline">{{ person.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { agendaService } from '@/services/agendaService'
import { useSettingsStore } from '@/stores/settings'
import { AlertOctagon as AlertOctagonIcon } from 'lucide-vue-next'
import type { TagihanDetail } from '@/types'
import * as XLSX from 'xlsx'

const settingsStore = useSettingsStore()

const selectedLaporan = ref('kas')
const selectedAgendaId = ref('')
const agendaOptions = ref<any[]>([])
const matrixAgendas = ref<any[]>([]) // Agendas within selected month for matrix
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const reportData = ref<any[]>([])
const loading = ref(false)
const rekeningSummaries = ref<any[]>([])
const totalKasBesar = ref(0)

const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunRange = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

// Computed for current selected agenda object
const selectedAgenda = computed(() => {
  return agendaOptions.value.find(a => a.id === selectedAgendaId.value)
})

const laporanTitle = computed(() => {
  switch (selectedLaporan.value) {
    case 'kas': return `Laporan Kas Umum ${settingsStore.organizationLabel}`
    case 'pemasukan': return 'Laporan Rincian Pemasukan'
    case 'pengeluaran': return 'Laporan Rincian Pengeluaran'
    case 'tagihan': return `Laporan Status Tagihan ${settingsStore.residentLabel}`
    case 'meteran': return 'Laporan Pemakaian Meter Air'
    case 'rekap_rapat': return 'Laporan Rekapitulasi Rapat & Pertemuan'
    case 'pra_absensi': return 'Laporan Pra-Absensi Kehadiran Rapat'
    case 'absensi_final': return 'Laporan Absensi Final Kehadiran Rapat'
    case 'matriks_kehadiran': return 'Laporan Matriks Kedisplin Kehadiran Warga'
    default: return 'Laporan Kegiatan'
  }
})

// Signature Helpers: Dynamically pick Bendahara or Sekretaris
const makerTtd = computed(() => {
  if (!settingsStore.settings.structure) return []
  const isMeetingReport = ['rekap_rapat', 'pra_absensi', 'absensi_final', 'matriks_kehadiran'].includes(selectedLaporan.value)
  const targetRole = isMeetingReport ? 'sekretaris' : 'bendahara'
  return settingsStore.settings.structure.filter((p: any) => p.role.toLowerCase().includes(targetRole))
})

const ketuaTtd = computed(() => {
  if (!settingsStore.settings.structure) return []
  return settingsStore.settings.structure.filter((p: any) => p.role.toLowerCase().includes('ketua') || p.role.toLowerCase().includes('manager'))
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date))
}

const formatDateShort = (date: string) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(new Date(date))
}

const totalMasuk = computed(() => reportData.value.filter(t => t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah || 0), 0))
const totalKeluar = computed(() => reportData.value.filter(t => t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah || 0), 0))
const totalTagihan = computed(() => (reportData.value || []).reduce((a, b) => a + Number(b.total || 0), 0))
const totalGeneral = computed(() => (reportData.value || []).reduce((a, b) => a + Number(b.jumlah || 0), 0))

const fetchAgendasForSelector = async () => {
  try {
    const agendas = await agendaService.getAgendas()
    // Sort by date descending
    agendaOptions.value = (agendas || []).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  } catch (e) {
    console.warn('Failed to load agendas for selector')
  }
}

const getMatrixStatus = (item: any, agendaId: string) => {
  const record = item.absensiRecords.find((r: any) => r.agenda_id === agendaId)
  if (!record) return 'ALPHA'
  if (record.is_final) return 'HADIR'
  if (record.status === 'tidak_hadir' && record.alasan) return 'IZIN'
  return 'ALPHA'
}

const fetchReport = async () => {
  loading.value = true
  try {
    const startDay = `${filterTahun.value}-${String(filterBulan.value).padStart(2, '0')}-01`
    const lastDay = new Date(filterTahun.value, filterBulan.value, 0).toISOString().split('T')[0]
    
    // AGENDA SPECIFIC REPORTS
    if (selectedLaporan.value === 'pra_absensi' || selectedLaporan.value === 'absensi_final') {
      if (!selectedAgendaId.value) {
        reportData.value = []
        return
      }
      const data = await agendaService.getAbsensiByAgenda(selectedAgendaId.value)
      reportData.value = (data || []).sort((a, b) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
    } 
    else if (selectedLaporan.value === 'rekap_rapat') {
      const { data, error } = await supabase
        .from('agenda_rapat')
        .select('*')
        .gte('tanggal', startDay)
        .lte('tanggal', lastDay)
        .order('tanggal', { ascending: true })
      
      if (error) throw error
      
      const rekap = await Promise.all((data || []).map(async (a) => {
         const absensi = await agendaService.getAbsensiByAgenda(a.id)
         return {
           ...a,
           stats: {
             pra_hadir: absensi.filter(x => x.status === 'hadir').length,
             final_hadir: absensi.filter(x => x.is_final).length,
             aspirasi: absensi.filter(x => x.masukan_aspirasi).length
           }
         }
      }))
      reportData.value = rekap
    }
    // MATRIKS KEHADIRAN (Resident Base)
    else if (selectedLaporan.value === 'matriks_kehadiran') {
      const [wargaRes, agendaRes] = await Promise.all([
        supabase.from('warga').select('*').eq('status', 'aktif').order('no_rumah'),
        supabase.from('agenda_rapat').select('*').gte('tanggal', startDay).lte('tanggal', lastDay).order('tanggal')
      ])

      const listWarga = (wargaRes.data || []).sort((a, b) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
      const listAgenda = agendaRes.data || []
      matrixAgendas.value = listAgenda

      if (listAgenda.length === 0) {
        reportData.value = []
        return
      }

      // Fetch ALL absensi for THESE agendas
      const { data: allAbsensi } = await supabase
        .from('absensi_rapat')
        .select('*')
        .in('agenda_id', listAgenda.map(a => a.id))

      const matrix = listWarga.map(w => {
        const myAbsensi = (allAbsensi || []).filter(a => a.warga_id === w.id)
        let alphaCount = 0
        
        listAgenda.forEach(a => {
          const rec = myAbsensi.find(ra => ra.agenda_id === a.id)
          const isAlpha = !rec || (!rec.is_final && !(rec.status === 'tidak_hadir' && rec.alasan))
          if (isAlpha) alphaCount++
        })

        return {
          warga: w,
          absensiRecords: myAbsensi,
          alphaCount
        }
      })
      reportData.value = matrix
    }
    // FINANCE REPORTS
    else if (selectedLaporan.value === 'tagihan') {
      const { data, error } = await supabase.from('tagihan').select('*, warga(*), tagihan_detail(*)').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
      if (error) throw error
      reportData.value = (data || []).sort((a, b) => (a.warga?.no_rumah || '').localeCompare(b.warga?.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
    } 
    else if (selectedLaporan.value === 'meteran') {
      const { data, error } = await supabase.from('meter_air').select('*, warga(*)').eq('bulan', filterBulan.value).eq('tahun', filterTahun.value)
      if (error) throw error
      reportData.value = (data || []).sort((a, b) => (a.warga?.no_rumah || '').localeCompare(b.warga?.no_rumah || '', undefined, { numeric: true, sensitivity: 'base' }))
    } 
    else {
      let query = supabase.from('kas_transaksi')
        .select('*')
        .gte('tanggal', startDay)
        .lte('tanggal', lastDay)
      
      if (selectedLaporan.value === 'pemasukan') query = query.eq('jenis', 'masuk')
      if (selectedLaporan.value === 'pengeluaran') query = query.eq('jenis', 'keluar')

      if (selectedLaporan.value === 'kas') {
        const [rekRes, prevTransRes, currentTransRes] = await Promise.all([
          supabase.from('rekening_kas').select('*'),
          supabase.from('kas_transaksi').select('rekening_id, jenis, jumlah').lt('tanggal', startDay),
          supabase.from('kas_transaksi').select('rekening_id, jenis, jumlah').gte('tanggal', startDay).lte('tanggal', lastDay)
        ])

        const reks = rekRes.data || []
        const prevs = prevTransRes.data || []
        const currents = currentTransRes.data || []

        rekeningSummaries.value = reks.map(r => {
          const pM = prevs.filter(t => t.rekening_id === r.id && t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)
          const pK = prevs.filter(t => t.rekening_id === r.id && t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)
          const sAwal = Number(r.saldo_awal) + pM - pK

          const cM = currents.filter(t => t.rekening_id === r.id && t.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)
          const cK = currents.filter(t => t.rekening_id === r.id && t.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)

          return {
            id: r.id,
            nama: r.nama_rekening,
            jenis: r.jenis,
            saldoAwal: sAwal,
            masuk: cM,
            keluar: cK,
            netto: cM - cK,
            saldoAkhir: sAwal + cM - cK
          }
        })
        totalKasBesar.value = rekeningSummaries.value.reduce((a, b) => a + b.saldoAkhir, 0)
      }
      
      const { data, error } = await query.order('tanggal', { ascending: true })
      if (error) throw error
      reportData.value = data || []
    }
  } catch (e: any) {
    alert('Gagal mengambil data: ' + e.message)
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

const handleExport = () => {
  if (reportData.value.length === 0) return alert('Tidak ada data untuk diekspor')

  let dataToExport = []
  
  if (selectedLaporan.value === 'kas') {
    dataToExport = reportData.value.map(item => ({
      Tanggal: formatDate(item.tanggal),
      Keterangan: item.keterangan,
      Pemasukan: item.jenis === 'masuk' ? item.jumlah : 0,
      Pengeluaran: item.jenis === 'keluar' ? item.jumlah : 0
    }))
  } else if (selectedLaporan.value === 'tagihan') {
    dataToExport = reportData.value.map(item => {
      const details = (item.tagihan_detail || []) as TagihanDetail[]
      return {
        'No. Rumah': item.warga?.no_rumah,
        'Nama Warga': item.warga?.nama_kepala_keluarga,
        'Bulan': bulanNames[item.bulan - 1],
        'Tahun': item.tahun,
        'Iuran Pokok': details.filter((d: TagihanDetail) => !d.keterangan_custom).reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0),
        'Tunggakan': details.filter((d: TagihanDetail) => d.keterangan_custom === 'Tunggakan Bulan Sebelumnya').reduce((a: number, b: TagihanDetail) => a + Number(b.jumlah), 0),
        'Total Tagihan': item.total,
        'Status': item.status.toUpperCase()
      }
    })
  } else if (selectedLaporan.value === 'matriks_kehadiran') {
    dataToExport = reportData.value.map(item => {
      const row: any = {
        'Nama Warga': item.warga.nama_kepala_keluarga,
        'No. Rumah': item.warga.no_rumah
      }
      matrixAgendas.value.forEach(a => {
        row[formatDateShort(a.tanggal)] = getMatrixStatus(item, a.id)
      })
      row['TOTAL ALPHA'] = item.alphaCount
      row['KETERANGAN'] = item.alphaCount >= 3 ? 'Kritis' : ''
      return row
    })
  } else if (selectedLaporan.value === 'pra_absensi') {
    dataToExport = reportData.value.map(item => ({
      'Nama Warga': item.nama_warga,
      'No House': item.no_rumah,
      'Status': item.status,
      'Alasan/Aspirasi': item.status === 'tidak_hadir' ? item.alasan : item.masukan_aspirasi
    }))
  } else if (selectedLaporan.value === 'rekap_rapat') {
    dataToExport = reportData.value.map(item => ({
      'Tanggal': formatDate(item.tanggal),
      'Judul': item.judul,
      'Pra-Hadir': item.stats.pra_hadir,
      'Final-Hadir': item.stats.final_hadir,
      'Aspirasi': item.stats.aspirasi
    }))
  } else {
    dataToExport = reportData.value.map(item => ({
      Tanggal: formatDate(item.tanggal),
      Kategori: item.kategori,
      Keterangan: item.keterangan,
      Jumlah: item.jumlah
    }))
  }

  const ws = XLSX.utils.json_to_sheet(dataToExport)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Laporan")
  XLSX.writeFile(wb, `${laporanTitle.value}_${bulanNames[filterBulan.value - 1]}_${filterTahun.value}.xlsx`)
}

watch([selectedLaporan, filterBulan, filterTahun, selectedAgendaId], fetchReport)
onMounted(async () => {
  if (!settingsStore.initialized) {
    await settingsStore.fetchSettings()
  }
  await fetchAgendasForSelector()
  await fetchReport()
})
</script>

<style>
@media print {
  @page { size: A4 landscape; margin: 1cm; }
  header, aside, nav, button, .no-print, [class*="sidebar"], select, .input-field { display: none !important; }
  html, body, #app, #app > div { display: block !important; position: static !important; overflow: visible !important; }
  th, td { padding: 4px !important; font-size: 8px !important; border: 1px solid #333 !important; }
}
.animate-in { animation-duration: 0.3s; animation-fill-mode: both; }
</style>
