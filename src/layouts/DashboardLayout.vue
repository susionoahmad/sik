<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden relative font-sans text-slate-900">
    <!-- Backdrop for mobile -->
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden transition-opacity"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-30 w-[260px] bg-[#0b1120] border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo Area -->
      <div class="h-20 flex items-center px-6 border-b border-slate-800/60 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/30">
            {{ settingsStore.settings.orgType[0]?.toUpperCase() || 'S' }}
          </div>
          <div class="flex flex-col">
            <h2 class="text-lg font-black text-white tracking-tight leading-tight uppercase">SIK-{{ settingsStore.settings.orgType }}</h2>
            <p class="text-[10px] uppercase font-bold text-primary-400 tracking-wider">Sistem Keuangan</p>
          </div>
        </div>
        <button @click="isSidebarOpen = false" class="ml-auto md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <router-link 
          v-for="item in menuItems" 
          :key="item.name"
          :to="item.path"
          @click="isSidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group relative overflow-hidden"
          :class="[
            $route.name === item.name 
              ? 'bg-primary-500/10 text-primary-400 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-8 before:bg-primary-500 before:rounded-r-full shadow-inner' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 hover:translate-x-1'
          ]"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 transition-transform duration-300" 
            :class="[
              $route.name === item.name ? 'text-primary-500 scale-110 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
            ]" 
          />
          <span class="text-sm truncate">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- User Profile Card -->
      <div class="p-4 mx-4 my-6 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/50 shadow-xl shrink-0">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-primary-300 font-bold border-2 border-slate-600 shadow-inner">
            {{ authStore.profile?.name?.[0]?.toUpperCase() || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate drop-shadow-sm">{{ authStore.profile?.name || 'User' }}</p>
            <p class="text-[11px] text-slate-400 capitalize font-medium tracking-wide">{{ authStore.profile?.role }}</p>
          </div>
        </div>
        <button 
          @click="handleLogout"
          class="w-full flex justify-center items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-red-500 text-sm font-bold shadow-sm"
        >
          <LogOutIcon class="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-slate-50">
      <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 h-20 shrink-0 sticky top-0 z-10 flex justify-between items-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = true" class="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
            <MenuIcon class="w-6 h-6" />
          </button>
          <h1 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight capitalize drop-shadow-sm">{{ currentRouteName }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-100/80 rounded-full border border-slate-200 shadow-sm/50">
            <CalendarIcon class="w-4 h-4 text-primary-500" />
            <span class="text-xs md:text-sm font-bold text-slate-600 tracking-wide">{{ today }}</span>
          </div>
        </div>
      </header>
      
      <div class="flex-1 overflow-y-auto p-4 md:p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { 
  Menu as MenuIcon, X as XIcon, LogOut as LogOutIcon, Calendar as CalendarIcon,
  LayoutDashboard, Eye, Users, FileText, Settings, History, 
  Droplet, Landmark, Wallet, FolderTree, Receipt, ArrowRightLeft, ShieldCheck,
  Mail, FileStack, BookOpenText, Network
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const isSidebarOpen = ref(false)

onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
})

const currentRouteName = computed(() => {
  if (route.name === 'kas-rt') return `Buku Kas ${settingsStore.settings.orgType}`
  if (route.name === 'activity-logs') return 'Log Aktivitas'
  if (route.name === 'jenis-iuran') return 'Jenis Iuran'
  if (route.name === 'rekening-kas') return 'Master Kas'
  return route.name?.toString().replace('-', ' ')
})

const today = computed(() => new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()))

const menuItems = computed(() => {
  const role = authStore.profile?.role || 'warga'
  const items = [
    { name: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'notulen-list', path: '/notulen', label: 'Notulen Rapat', icon: BookOpenText },
    { name: 'struktur-organisasi', path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Network },
    { name: 'transparansi', path: '/transparansi', label: 'Transparansi', icon: Eye }
  ]

  if (['bendahara', 'sekretaris'].includes(role)) {
    items.splice(1, 0, { name: 'warga', path: '/warga', label: 'Warga', icon: Users })
  }

  if (['bendahara'].includes(role)) {
    items.push(
      { name: 'tagihan', path: '/tagihan', label: 'Tagihan', icon: Receipt },
      { name: 'jenis-iuran', path: '/jenis-iuran', label: 'Jenis Iuran', icon: FolderTree },
      { name: 'rekening-kas', path: '/rekening-kas', label: 'Master Kas', icon: Landmark },
      { name: 'pembayaran', path: '/pembayaran', label: 'Pembayaran', icon: ArrowRightLeft },
      { name: 'meter-air', path: '/meter-air', label: 'Meter Air', icon: Droplet },
      { name: 'kas-rt', path: '/kas-rt', label: `Kas ${settingsStore.settings.orgType}`, icon: Wallet },
      { name: 'pengeluaran', path: '/pengeluaran', label: 'Pengeluaran', icon: ArrowRightLeft }
    )
  }

  if (['bendahara', 'ketua', 'sekretaris'].includes(role)) {
    items.push({ name: 'laporan', path: '/laporan', label: 'Laporan', icon: FileText })
  }

  if (['bendahara', 'ketua'].includes(role)) {
    items.push(
      { name: 'users', path: '/pengguna', label: 'Manajemen Pengguna', icon: ShieldCheck },
      { name: 'activity-logs', path: '/logs', label: 'Log Aktivitas', icon: History },
      { name: 'pengaturan', path: '/pengaturan', label: 'Pengaturan', icon: Settings }
    )
  }

  if (['bendahara', 'sekretaris', 'ketua'].includes(role)) {
    items.push(
      { name: 'arsip-surat', path: '/arsip-surat', label: 'Arsip Surat', icon: Mail },
      { name: 'template-surat', path: '/template-surat', label: 'Template Surat', icon: FileStack },
      { name: 'notulen', path: '/kelola-notulen', label: 'Kelola Notulen', icon: Settings }
    )
  }

  if (role === 'petugas_air') {
    items.push(
      { name: 'warga', path: '/warga', label: 'Data Warga', icon: Users },
      { name: 'meter-air', path: '/meter-air', label: 'Meter Air', icon: Droplet }
    )
  }

  return items
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push({ name: 'login' })
}
</script>
