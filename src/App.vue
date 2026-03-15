<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  console.log('App starting, initializing auth...')
  
  // Set an emergency timeout to clear auth loading if it hangs too long
  const emergencyTimeout = setTimeout(() => {
    if (authStore.loading) {
      console.warn('Auth initialization taking too long (>10s), force stopping loading state.')
      authStore.forceStopLoading()
    }
  }, 10000)

  try {
    await authStore.initialize()
  } catch (e) {
    console.error('App-level auth init failed:', e)
  } finally {
    clearTimeout(emergencyTimeout)
  }
  
  // Refresh session on window focus to prevent stale connections
  window.addEventListener('focus', async () => {
    if (authStore.isAuthenticated) {
      console.log('Window focused, verifying session...')
      await authStore.initialize()
    }
  })
})
</script>
