<template>
  <header class="app-header card">
    <div class="page-shell header-inner">
      <h1>Pine Chat</h1>
      <nav v-if="auth.isAuthenticated">
        <RouterLink to="/conversations">Conversations</RouterLink>
        <RouterLink to="/requests">Requests</RouterLink>
        <button class="btn" type="button" @click="handleLogout">Logout</button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await auth.logout()
  await router.push({ name: 'login' })
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
