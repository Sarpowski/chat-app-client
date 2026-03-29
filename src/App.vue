<template>
  <div class="app-root">
    <AppHeader />
    <ConnectionBanner v-if="auth.isAuthenticated" />
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ConnectionBanner from '@/components/ConnectionBanner.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.app-root {
  min-height: 100vh;
}
</style>
