<template>
  <header class="app-header card">
    <div class="page-shell header-inner">
      <h1>Pine Chat</h1>
      <nav v-if="auth.isAuthenticated">
        <RouterLink to="/conversations">Conversations</RouterLink>
        <RouterLink to="/requests">Requests</RouterLink>
        <button class="btn" type="button" :disabled="logoutLoading" @click="handleLogout">
          {{ logoutLoading ? 'Logging out...' : 'Logout' }}
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const logoutLoading = ref(false)

const handleLogout = async () => {
  if (logoutLoading.value) {
    return
  }

  logoutLoading.value = true
  try {
    const { useWebSocket } = await import('@/composables/useWebSocket')
    const ws = useWebSocket()
    await ws.disconnect()
    await auth.logout()
    toast.notifySuccess('Logged out')
    await router.push({ name: 'login' })
  } catch (error: unknown) {
    toast.notifyError(resolveApiErrorMessage(error, 'auth/logout'))
    await router.push({ name: 'login' })
  } finally {
    logoutLoading.value = false
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  border-radius: 0;
  z-index: 20;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

a.router-link-active {
  color: var(--accent-strong);
  font-weight: 700;
}
</style>
