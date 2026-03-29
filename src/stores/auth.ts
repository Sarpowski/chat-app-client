import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from '@/api/auth'
import { setAccessToken, setAuthHandlers } from '@/api'
import type { AuthResponse, LoginRequest, RegisterRequest, UserSummary } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<UserSummary | null>(null)
  const isRefreshing = ref(false)
  const isBootstrapped = ref(false)
  let bootstrapPromise: Promise<void> | null = null
  const isAuthenticated = computed(() => token.value !== null)

  const setAuth = (payload: AuthResponse) => {
    token.value = payload.jwtToken
    user.value = payload.user
    setAccessToken(payload.jwtToken)
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    setAccessToken(null)
  }

  const register = async (payload: RegisterRequest) => {
    const data = await registerRequest(payload)
    setAuth(data)
  }

  const login = async (payload: LoginRequest) => {
    const data = await loginRequest(payload)
    setAuth(data)
  }

  const refresh = async () => {
    if (isRefreshing.value) {
      return token.value
    }

    isRefreshing.value = true
    try {
      const data = await refreshRequest()
      setAuth(data)
      return token.value
    } finally {
      isRefreshing.value = false
    }
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      clearAuth()
    }
  }

  const bootstrapAuth = async () => {
    if (isBootstrapped.value) {
      return
    }

    if (bootstrapPromise) {
      return bootstrapPromise
    }

    bootstrapPromise = (async () => {
      try {
        await refresh()
      } catch {
        clearAuth()
      } finally {
        isBootstrapped.value = true
        bootstrapPromise = null
      }
    })()

    return bootstrapPromise
  }

  setAuthHandlers({
    refreshAccessToken: refresh,
    onRefreshFailed: async () => {
      clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    },
  })

  return {
    token,
    user,
    isRefreshing,
    isBootstrapped,
    isAuthenticated,
    setAuth,
    clearAuth,
    register,
    login,
    refresh,
    logout,
    bootstrapAuth,
  }
})
