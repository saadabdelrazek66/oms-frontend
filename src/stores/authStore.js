import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEYS = ['token', 'role', 'user_id', 'user']

function extractRoleString(roleValue) {
  if (!roleValue) return ''
  if (typeof roleValue === 'object' && 'value' in roleValue) {
    return String(roleValue.value || '')
  }
  return String(roleValue)
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuthStorage() {
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const storedRole = ref(localStorage.getItem('role') || '')
  const user = ref(readStoredUser())

  if (!storedRole.value && user.value?.role) {
    storedRole.value = extractRoleString(user.value.role)
  }
  if (!user.value && storedRole.value) {
    user.value = { role: storedRole.value }
  }

  const role = computed(() => {
    return extractRoleString(user.value?.role) || storedRole.value || ''
  })

  const isAuthenticated = computed(() => Boolean(token.value))
  const isManager = computed(() => role.value === 'manager')
  const isAccountManager = computed(() => user.value?.job_title === 'Account Manager')
  const isManagerOrAM = computed(() => isManager.value || isAccountManager.value)
  const isSales = computed(() => user.value?.job_title === 'Sales')

  const defaultDashboard = computed(() =>
    isManager.value ? '/manager/dashboard' : '/employee/dashboard'
  )

  const displayFirstName = computed(() => {
    const full = user.value?.name ? String(user.value.name).trim() : ''
    if (full) return full.split(/\s+/)[0]
    return isManager.value ? 'المدير' : 'الموظف'
  })

  const initials = computed(() => {
    const full = user.value?.name ? String(user.value.name).trim() : ''
    if (full) return full.charAt(0).toUpperCase()
    return isManager.value ? 'م' : 'و'
  })

  function setSession({ token: newToken, user: newUser }) {
    if (newToken) {
      token.value = newToken
      localStorage.setItem('token', newToken)
    }
    if (newUser) {
      setUser(newUser)
    }
  }

  function setUser(newUser) {
    user.value = newUser
    if (!newUser) return

    const resolvedRole = extractRoleString(newUser.role)
    if (resolvedRole) {
      storedRole.value = resolvedRole
      localStorage.setItem('role', resolvedRole)
    }
    if (newUser.id) {
      localStorage.setItem('user_id', String(newUser.id))
    }
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function syncFromStorage() {
    token.value = localStorage.getItem('token') || ''
    storedRole.value = localStorage.getItem('role') || ''
    user.value = readStoredUser()

    if (!storedRole.value && user.value?.role) {
      storedRole.value = extractRoleString(user.value.role)
    }
    if (!user.value && storedRole.value) {
      user.value = { role: storedRole.value }
    }
  }

  function clearSession() {
    token.value = ''
    storedRole.value = ''
    user.value = null
    clearAuthStorage()
  }

  async function refreshUser(apiClient) {
    if (!token.value) return null
    const res = await apiClient.get('/user')
    if (res?.data) {
      setUser(res.data)
    }
    return user.value
  }

  return {
    token,
    user,
    role,
    isAuthenticated,
    isManager,
    isAccountManager,
    isManagerOrAM,
    isSales,
    defaultDashboard,
    displayFirstName,
    initials,
    setSession,
    setUser,
    syncFromStorage,
    clearSession,
    refreshUser,
  }
})
