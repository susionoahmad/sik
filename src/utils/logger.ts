import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

export const useLogger = () => {
  const authStore = useAuthStore()

  const logActivity = async (action: string, resource: string, details: any = {}) => {
    if (!authStore.user) return

    try {
      const { error } = await supabase.from('activity_logs').insert({
        user_id: authStore.user.id,
        user_name: authStore.profile?.name || authStore.user.email,
        user_role: authStore.profile?.role || 'unknown',
        action,
        resource,
        details
      })

      if (error) console.error('Failed to save log:', error)
    } catch (e) {
      console.error('Logger error:', e)
    }
  }

  return { logActivity }
}
