import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import { withTimeout } from '@/utils/promise'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  name: string
  email: string
  role: 'bendahara' | 'ketua' | 'sekretaris' | 'warga' | 'petugas_air'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    profile: null as Profile | null,
    loading: true,
    initialized: false,
    initPromise: null as Promise<void> | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => ['bendahara', 'ketua', 'sekretaris'].includes(state.profile?.role || ''),
    isBendahara: (state) => state.profile?.role === 'bendahara',
    isKetua: (state) => state.profile?.role === 'ketua',
    isSekretaris: (state) => state.profile?.role === 'sekretaris',
    isPetugasAir: (state) => state.profile?.role === 'petugas_air',
    isWarga: (state) => state.profile?.role === 'warga',
  },
  actions: {
    async fetchProfile(userId: string) {
      if (!userId) return null
      try {
        const fetching = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        const { data, error } = await withTimeout(fetching as any, 5000) as any
        
        if (error) {
          console.error('Error fetching profile:', error)
          return null
        }
        
        this.profile = data as Profile
        return data
      } catch (e) {
        console.error('Catch error fetching profile:', e)
        return null
      }
    },
    async initialize() {
      if (this.initPromise) return this.initPromise
      if (this.initialized && this.user && this.profile) return Promise.resolve()

      this.initPromise = (async () => {
        this.loading = true
        try {
          const { data: { session }, error } = await withTimeout(supabase.auth.getSession() as any, 5000) as any
          if (error) throw error
          
          this.user = session?.user ?? null
          if (this.user) {
            await this.fetchProfile(this.user.id)
          }
          this.initialized = true
        } catch (e) {
          console.error('Auth initialization error:', e)
        } finally {
          this.loading = false
          this.initPromise = null
        }
      })()

      // Set up listener only once per app lifecycle
      if (!(window as any).__auth_listener_set) {
        ;(window as any).__auth_listener_set = true
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event)
          this.user = session?.user ?? null
          if (this.user) {
            await this.fetchProfile(this.user.id)
          } else {
            this.profile = null
          }
        })
      }

      return this.initPromise
    },
    async signOut() {
      try {
        await supabase.auth.signOut()
      } finally {
        this.user = null
        this.profile = null
        this.loading = false
        this.initPromise = null
      }
    },
    forceStopLoading() {
      this.loading = false
    }
  }
})
