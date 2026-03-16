<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Struktur Organisasi</h2>
        <p class="text-slate-500 font-medium">Susunan pengurus {{ settingsStore.organizationLabel }} periode saat ini.</p>
      </div>
      <div class="px-4 py-2 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-2">
        <UsersIcon class="w-5 h-5 text-primary-600" />
        <span class="text-sm font-bold text-primary-700">{{ settingsStore.settings.structure.length }} Jabatan Pengurus</span>
      </div>
    </div>

    <!-- Hierarchy Visualization -->
    <div class="card overflow-hidden !p-0 bg-slate-50/50 border-dashed border-2 border-slate-200">
      <div class="p-4 md:p-12 overflow-x-auto min-h-[400px] md:min-h-[500px]">
        <!-- Desktop View (Horizontal Tree) -->
        <div class="hidden md:flex flex-col items-center min-w-[800px] mx-auto">
          <!-- Level 1: Ketua -->
          <div class="flex justify-center gap-8 mb-16 relative">
            <div v-for="chief in structureByLevel.chiefs" :key="chief.name" class="relative z-10">
              <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 rounded-[2rem] shadow-2xl shadow-primary-500/20 border-4 border-white w-64 text-center transition-transform hover:scale-105">
                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <ShieldCheckIcon class="w-6 h-6 text-white" />
                </div>
                <p class="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-1">{{ chief.role }}</p>
                <p class="font-black text-lg leading-tight">{{ chief.name }}</p>
              </div>
              <div class="absolute top-full left-1/2 -translate-x-1/2 h-16 w-1 bg-gradient-to-b from-primary-600 to-slate-200"></div>
            </div>
          </div>

          <!-- Connector Horizontal Line for Level 2 -->
          <div v-if="structureByLevel.staffs.length > 1" class="h-1 bg-slate-200 w-full mb-0 rounded-full mx-auto" :style="{ maxWidth: (structureByLevel.staffs.length - 1) * 220 + 'px' }"></div>

          <!-- Level 2: Staff / Members -->
          <div class="flex flex-wrap justify-center gap-8 pt-0">
            <div v-for="staff in structureByLevel.staffs" :key="staff.name" class="flex flex-col items-center w-52">
              <div class="h-10 w-1 bg-slate-200"></div>
              <div class="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 w-full text-center transition-all hover:shadow-2xl hover:border-primary-200 group relative">
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center border-4 border-slate-50">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <p class="text-[10px] uppercase font-black tracking-widest text-primary-600 mb-2 opacity-80 decoration-primary-200 underline-offset-4">{{ staff.role }}</p>
                <p class="font-black text-slate-800 text-base group-hover:text-primary-700 transition-colors">{{ staff.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile View (Vertical Tree) -->
        <div class="md:hidden flex flex-col items-center py-4">
          <!-- Level 1: Ketua (Mobile) -->
          <div v-for="(chief, idx) in structureByLevel.chiefs" :key="'mob-'+chief.name" class="w-full flex flex-col items-center">
            <div class="w-full max-w-[260px] bg-gradient-to-br from-primary-600 to-primary-800 text-white p-4 rounded-2xl shadow-lg border-2 border-white text-center relative z-10 transition-transform active:scale-95">
              <p class="text-[7px] uppercase font-black tracking-widest opacity-70 mb-0.5">{{ chief.role }}</p>
              <p class="font-black text-sm leading-tight">{{ chief.name }}</p>
            </div>
            <!-- Line indicator -->
            <div v-if="idx < structureByLevel.chiefs.length - 1 || structureByLevel.staffs.length > 0" class="h-6 w-0.5 bg-primary-600"></div>
          </div>

          <!-- Level 2: Staff (Mobile 2-Column Grid) -->
          <div v-if="structureByLevel.staffs.length > 0" class="w-full px-2">
            <!-- Horizontal connector from chiefs to staff grid -->
            <div class="w-0.5 h-4 bg-primary-200 mx-auto"></div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="staff in structureByLevel.staffs" :key="'mob-'+staff.name" class="group bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all active:bg-primary-50">
                <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center mb-2 group-active:bg-white">
                  <UserIcon class="w-3.5 h-3.5 text-primary-500" />
                </div>
                <p class="text-[7px] uppercase font-black tracking-tighter text-primary-600 opacity-80 mb-0.5 leading-none">{{ staff.role }}</p>
                <p class="font-bold text-slate-800 text-[10px] leading-tight">{{ staff.name }}</p>
              </div>
            </div>
          </div>

          <div v-if="settingsStore.settings.structure.length === 0" class="py-10 text-center text-slate-400 italic text-sm">
            Belum ada struktur organisasi.
          </div>
        </div>
      </div>
    </div>

    <!-- Contact List Table View -->
    <div class="card">
      <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <div class="w-1.5 h-6 bg-primary-500 rounded-full"></div>
        Daftar Kontak Pengurus
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th class="px-6 py-4">Jabatan</th>
              <th class="px-6 py-4">Nama Pengurus</th>
              <th class="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in settingsStore.settings.structure" :key="item.name" class="group hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <span class="text-xs font-black text-primary-600 uppercase tracking-tight bg-primary-50 px-2 py-1 rounded-lg">{{ item.role }}</span>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800">{{ item.name }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span class="text-xs font-bold text-slate-500 uppercase">Aktif</span>
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
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Users as UsersIcon, ShieldCheck as ShieldCheckIcon } from 'lucide-vue-next'

const settingsStore = useSettingsStore()

const structureByLevel = computed(() => {
  const structure = settingsStore.settings.structure || []
  return {
    chiefs: structure.filter((s: any) => s.role.toLowerCase().includes('ketua')),
    staffs: structure.filter((s: any) => !s.role.toLowerCase().includes('ketua'))
  }
})
</script>
