<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Manajemen Pengguna</h2>
        <p class="text-slate-500 text-sm">Atur hak akses dan peran pengurus untuk akses sistem.</p>
      </div>
    </div>

    <!-- User List -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Peran (Role)</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dibuat Pada</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                    {{ user.name[0]?.toUpperCase() }}
                  </div>
                  <span class="font-medium text-slate-700">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600 text-sm">{{ user.email }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2.5 py-1 rounded-full text-xs font-bold uppercase',
                  getRoleBadgeClass(user.role)
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-sm">
                {{ new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-6 py-4 text-right space-x-4">
                <template v-if="user.id !== authStore.user?.id">
                  <button 
                    @click="openEditModal(user)"
                    class="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                  >
                    Ubah Peran
                  </button>
                  <button 
                    @click="confirmDelete(user)"
                    class="text-red-600 hover:text-red-700 font-semibold text-sm"
                  >
                    Hapus
                  </button>
                </template>
                <span v-else class="text-slate-400 text-xs italic">Anda (Aktif)</span>
              </td>
            </tr>
            <tr v-if="users.length === 0 && !loading">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                Belum ada data pengguna.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Role Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="card max-w-sm w-full">
        <h3 class="text-xl font-bold mb-6 text-slate-800">Ubah Peran Pengguna</h3>
        
        <div class="mb-6">
          <p class="text-sm text-slate-600 mb-1">Pengguna:</p>
          <p class="font-bold text-slate-800">{{ selectedUser?.name }}</p>
          <p class="text-xs text-slate-500">{{ selectedUser?.email }}</p>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">Pilih Peran Baru:</label>
          <div class="grid grid-cols-1 gap-2">
            <button 
              v-for="role in roles" 
              :key="role.value"
              @click="newRole = role.value"
              :class="[
                'flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left',
                newRole === role.value 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              ]"
            >
              <div>
                <p class="font-bold text-sm capitalize">{{ role.value }}</p>
                <p class="text-xs opacity-80">{{ role.desc }}</p>
              </div>
              <div v-if="newRole === role.value" class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white">
                <span class="text-[10px]">✓</span>
              </div>
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-8">
          <button @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
          <button 
            @click="updateRole" 
            class="btn-primary" 
            :disabled="submitting || newRole === selectedUser?.role"
          >
            {{ submitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { withTimeout } from '@/utils/promise'
import { useLogger } from '@/utils/logger'

interface Profile {
  id: string
  name: string
  email: string
  role: 'bendahara' | 'ketua' | 'sekretaris' | 'warga'
  created_at: string
}

const authStore = useAuthStore()
const { logActivity } = useLogger()
const users = ref<Profile[]>([])
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const selectedUser = ref<Profile | null>(null)
const newRole = ref<string>('')

const roles = [
  { value: 'petugas_air', desc: 'Akses khusus input meteran air & data warga.' },
  { value: 'warga', desc: 'Akses melihat dashboard & transparansi.' },
  { value: 'bendahara', desc: 'Akses penuh keuangan, iuran, & pengeluaran.' },
  { value: 'sekretaris', desc: 'Akses data warga & laporan.' },
  { value: 'ketua', desc: 'Akses melihat laporan & pengaturan sistem.' }
]

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'bendahara': return 'bg-red-100 text-red-700'
    case 'ketua': return 'bg-purple-100 text-purple-700'
    case 'sekretaris': return 'bg-blue-100 text-blue-700'
    case 'petugas_air': return 'bg-cyan-100 text-cyan-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').order('role', { ascending: true }) as any,
      8000
    ) as any
    if (error) throw error
    users.value = data || []
  } catch (e: any) {
    console.error('Failed to fetch users:', e)
  } finally {
    loading.value = false
  }
}

const openEditModal = (user: Profile) => {
  selectedUser.value = user
  newRole.value = user.role
  showModal.value = true
}

const updateRole = async () => {
  if (!selectedUser.value || submitting.value) return
  submitting.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole.value })
      .eq('id', selectedUser.value.id)
    
    if (error) throw error
    
    await logActivity('UPDATE_ROLE', 'profiles', {
      target_user: selectedUser.value.name,
      old_role: selectedUser.value.role,
      new_role: newRole.value
    })

    alert(`Berhasil mengubah peran ${selectedUser.value.name} menjadi ${newRole.value}`)
    showModal.value = false
    await fetchUsers()
  } catch (e: any) {
    alert('Gagal mengubah peran: ' + e.message)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async (user: Profile) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"? Tampilkan ini hanya akan menghapus profilnya agar tidak bisa masuk ke sistem pengurus.`)) return
  
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
    
    if (error) throw error
    
    await logActivity('DELETE_USER', 'profiles', {
      deleted_user_name: user.name,
      deleted_user_email: user.email,
      deleted_user_role: user.role
    })

    alert('User berhasil dihapus dari daftar pengurus.')
    await fetchUsers()
  } catch (e: any) {
    alert('Gagal menghapus user: ' + e.message)
  }
}

onMounted(fetchUsers)
</script>
