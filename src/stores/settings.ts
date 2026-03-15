import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import { withTimeout } from '@/utils/promise'

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
  state: () => ({
    settings: {
      orgName: '05',
      orgType: 'RT' as const,
      structure: [
        { role: 'Ketua', name: '-' },
        { role: 'Sekretaris', name: '-' },
        { role: 'Bendahara', name: '-' }
      ]
    } as AppSettings,
    loading: false,
    initialized: false,
    fetchPromise: null as Promise<void> | null
  }),
  getters: {
    organizationLabel: (state) => {
      return state.settings.orgType === 'RT' ? `RT ${state.settings.orgName}` : state.settings.orgName
    },
    organizationType: (state) => state.settings.orgType
  },
  actions: {
    async fetchSettings() {
      if (this.fetchPromise) return this.fetchPromise
      
      this.fetchPromise = (async () => {
        this.loading = true
        try {
          const fetching = supabase
            .from('settings')
            .select('*')
            .eq('id', 'app_settings')
            .single()

          const { data, error } = await withTimeout(fetching as any, 5000) as any

          if (error) {
            if (error.code === 'PGRST116') {
              await this.saveSettings(this.settings)
            } else {
              console.error('Error fetching settings:', error)
            }
          } else if (data) {
            this.settings = {
              orgName: data.org_name,
              orgType: data.org_type,
              structure: data.structure
            }
          }
        } catch (e) {
          console.error('Failed to fetch settings (timeout or network):', e)
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
