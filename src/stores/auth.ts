import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  name: string
  email: string
  role: 'bendahara' | 'ketua' | 'sekretaris' | 'warga' | 'petugas_air'
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const cachedProfile = localStorage.getItem('auth_profile')
    return {
      user: null as User | null,
      profile: cachedProfile ? JSON.parse(cachedProfile) : null as Profile | null,
      loading: true,
      initialized: false,
      initPromise: null as Promise<void> | null,
    }
  },
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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.error('Error fetching profile:', error)
          return null
        }
        
        this.profile = data as Profile
        // Update cache
        localStorage.setItem('auth_profile', JSON.stringify(this.profile))
        return data
      } catch (e) {
        console.error('Catch error fetching profile:', e)
        return null
      }
    },
    async initialize() {
      if (this.initPromise) return this.initPromise
      
      this.initPromise = (async () => {
        this.loading = true
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          
          this.user = session?.user ?? null
          if (this.user) {
            await this.fetchProfile(this.user.id)
          }
        } catch (e) {
          console.error('Auth initialization error:', e)
        } finally {
          this.loading = false
          this.initialized = true
          this.initPromise = null
        }
      })()

      return this.initPromise
    },
    async signOut() {
      try {
        await supabase.auth.signOut()
      } finally {
        this.user = null
        this.profile = null
        localStorage.removeItem('auth_profile')
        this.loading = false
        this.initPromise = null
      }
    },
    forceStopLoading() {
      this.loading = false
    }
  }
})
