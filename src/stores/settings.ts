import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

export interface OrgStructure {
  role: string
  name: string
  warga_id?: string
}

export interface AppSettings {
  orgName: string
  orgType: 'RT' | 'Perumahan' | 'Paguyuban'
  structure: OrgStructure[]
}

export const useSettingsStore = defineStore('settings', {
  state: () => {
    const cached = localStorage.getItem('app_settings')
    let initialSettings = {
      orgName: '',
      orgType: 'RT' as const,
      structure: [
        { role: 'Ketua', name: '-' },
        { role: 'Sekretaris', name: '-' },
        { role: 'Bendahara', name: '-' }
      ]
    } as AppSettings

    if (cached) {
      try {
        initialSettings = JSON.parse(cached)
      } catch (e) {
        console.warn('Failed to parse cached settings')
      }
    }

    return {
      settings: initialSettings,
      loading: false,
      initialized: false,
      fetchPromise: null as Promise<void> | null
    }
  },
  getters: {
    organizationLabel: (state) => {
      const name = state.settings.orgName && state.settings.orgName !== '-' ? state.settings.orgName : ''
      if (state.settings.orgType === 'RT') {
        return name ? `RT ${name}` : ''
      }
      return name || ''
    },
    organizationTypeLabel: (state) => {
      return state.settings.orgType
    },
    residentLabel: () => 'Warga',
    appTitle: (state) => {
      const name = state.settings.orgName && state.settings.orgName !== '-' ? state.settings.orgName : ''
      return name ? `SIK-${name}` : 'SIK'
    }
  },
  actions: {
    async fetchSettings() {
      // Return existing promise if fetch is in progress to avoid concurrent locks
      if (this.fetchPromise) return this.fetchPromise
      
      this.fetchPromise = (async () => {
        this.loading = true
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'app_settings')
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              await this.saveSettings(this.settings)
            } else {
              console.error('Error fetching settings:', error)
            }
          } else if (data) {
            this.settings = {
              orgName: data.org_name || '',
              orgType: data.org_type || 'RT',
              structure: data.structure || []
            }
            // Update cache
            localStorage.setItem('app_settings', JSON.stringify(this.settings))
          }
        } catch (e) {
          console.error('Failed to fetch settings:', e)
        } finally {
          this.loading = false
          this.initialized = true
          this.fetchPromise = null
        }
      })()

      return this.fetchPromise
    },
    async saveSettings(newSettings: AppSettings) {
      this.loading = true
      try {
        console.log('Upserting settings to Supabase...', newSettings)
        const { error } = await supabase
          .from('settings')
          .upsert({
            id: 'app_settings',
            org_name: newSettings.orgName,
            org_type: newSettings.orgType,
            structure: newSettings.structure,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Supabase Upsert Error:', error)
          throw error
        }
        
        this.settings = JSON.parse(JSON.stringify(newSettings))
        console.log('Settings saved successfully')
      } catch (e) {
        console.error('Failed to save settings:', e)
        throw e
      } finally {
        this.loading = false
      }
    }
  }
})
