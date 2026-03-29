<template>
  <div v-if="status !== 'connected'" class="banner">Connection: {{ status }}</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()
const { status } = storeToRefs(wsStore)
</script>

<style scoped>
.banner {
  text-align: center;
  padding: 0.45rem;
  background: var(--surface-strong);
  color: var(--muted);
}
</style>
