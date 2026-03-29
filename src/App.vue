<template>
  <div class="app-root">
    <AppHeader />
    <ConnectionBanner />
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ConnectionBanner from '@/components/ConnectionBanner.vue'
import ToastContainer from '@/components/ToastContainer.vue'
</script>

<style scoped>
.app-root {
  min-height: 100vh;
}
</style>
