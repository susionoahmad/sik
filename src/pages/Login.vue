<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="card max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">SIK-{{ settingsStore.settings.orgType.toUpperCase() }}</h1>
        <p class="text-slate-500">Sistem Informasi Keuangan {{ settingsStore.organizationLabel }}</p>
      </div>

      <div class="flex gap-4 mb-6 p-1 bg-slate-100 rounded-lg">
        <button 
          @click="mode = 'login'"
          :class="['flex-1 py-2 text-sm font-bold rounded-md transition-all', mode === 'login' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
        >
          Masuk
        </button>
        <button 
          @click="mode = 'signup'" 
          :class="['flex-1 py-2 text-sm font-bold rounded-md transition-all', mode === 'signup' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
        >
          Daftar Akun
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="mode === 'signup'">
          <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
          <input 
            v-model="name" 
            type="text" 
            placeholder="Contoh: Bpk. Slamet" 
            class="input-field"
            :required="mode === 'signup'"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="Masukkan email" 
            class="input-field"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Masukkan password" 
            class="input-field"
            required
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="w-full btn-primary flex items-center justify-center gap-2"
          :disabled="loading"
        >
          <span v-if="loading">Loading...</span>
          <span v-else>{{ mode === 'login' ? 'Masuk' : 'Daftar Sekarang' }}</span>
        </button>
      </form>

      <div class="mt-8 pt-6 border-t border-slate-100 text-center">
        <p v-if="mode === 'signup'" class="text-xs text-slate-500 mb-4">
          Setelah daftar, Anda akan masuk dengan peran <strong>Warga</strong>. Hubungi pengurus untuk mengubah peran menjadi Sekretaris atau Ketua.
        </p>
        <p class="text-sm text-slate-500 italic">
          "Transparansi Keuangan untuk Kesejahteraan Warga"
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const email = ref('')
const password = ref('')
const name = ref('')
const mode = ref<'login' | 'signup'>('login')
const loading = ref(false)
const error = ref('')
const router = useRouter()

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (mode.value === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (authError) throw authError
    } else {
      // Sign Up
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            name: name.value
          }
        }
      })
      if (signUpError) throw signUpError
      alert('Pendaftaran berhasil! Silakan masuk dengan akun Anda.')
      mode.value = 'login'
      return
    }
    
    router.push({ name: 'dashboard' })
  } catch (e: any) {
    console.error('Auth Error:', e)
    error.value = e.message || 'Gagal memproses data. Periksa kembali input Anda.'
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  if (!settingsStore.initialized) {
    settingsStore.fetchSettings()
  }
})
</script>
