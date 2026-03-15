import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/Dashboard.vue')
        },
        {
          path: 'warga',
          name: 'warga',
          component: () => import('@/pages/Warga.vue'),
          meta: { roles: ['bendahara', 'sekretaris', 'petugas_air'] }
        },
        {
          path: 'jenis-iuran',
          name: 'jenis-iuran',
          component: () => import('@/pages/JenisIuran.vue'),
          meta: { roles: ['bendahara'] }
        },
        {
          path: 'rekening-kas',
          name: 'rekening-kas',
          component: () => import('@/pages/RekeningKas.vue'),
          meta: { roles: ['bendahara'] }
        },
        {
          path: 'tagihan',
          name: 'tagihan',
          component: () => import('@/pages/Tagihan.vue')
        },
        {
          path: 'pembayaran',
          name: 'pembayaran',
          component: () => import('@/pages/Pembayaran.vue'),
          meta: { roles: ['bendahara'] }
        },
        {
          path: 'meter-air',
          name: 'meter-air',
          component: () => import('@/pages/MeterAir.vue'),
          meta: { roles: ['bendahara', 'petugas_air'] }
        },
        {
          path: 'kas-rt',
          name: 'kas-rt',
          component: () => import('@/pages/KasRT.vue')
        },
        {
          path: 'pengeluaran',
          name: 'pengeluaran',
          component: () => import('@/pages/Pengeluaran.vue'),
          meta: { roles: ['bendahara'] }
        },
        {
          path: 'laporan',
          name: 'laporan',
          component: () => import('@/pages/Laporan.vue'),
          meta: { roles: ['bendahara', 'ketua', 'sekretaris'] }
        },
        {
          path: 'transparansi',
          name: 'transparansi',
          component: () => import('@/pages/Transparency.vue')
        },
        {
          path: 'pengguna',
          name: 'users',
          component: () => import('@/pages/Users.vue'),
          meta: { roles: ['bendahara', 'ketua'] }
        },
        {
          path: 'logs',
          name: 'activity-logs',
          component: () => import('@/pages/ActivityLog.vue'),
          meta: { roles: ['bendahara', 'ketua'] }
        },
        {
          path: 'pengaturan',
          name: 'pengaturan',
          component: () => import('@/pages/Settings.vue'),
          meta: { roles: ['bendahara', 'ketua'] }
        }
      ]
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Re-verify session if it's a secured route
  if (to.meta.requiresAuth) {
    try {
      // Small timeout to prevent hanging forever on broken networks
      const initPromise = authStore.initialize()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session verify timeout')), 5000)
      )
      
      await Promise.race([initPromise, timeoutPromise])
    } catch (e) {
      console.error('Session verification failed, attempting to continue anyway...', e)
    }
  }

  const { isAuthenticated, profile } = authStore

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  if (to.meta.roles && isAuthenticated) {
    const allowedRoles = to.meta.roles as string[]
    if (!allowedRoles.includes(profile?.role || '')) {
      return next({ name: 'dashboard' })
    }
  }

  return next()
})

export default router
