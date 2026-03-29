import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export const useWebSocketStore = defineStore('websocket', () => {
  const status = ref<WsStatus>('disconnected')
  const isConnected = computed(() => status.value === 'connected')

  const setStatus = (next: WsStatus) => {
    status.value = next
  }

  return { status, isConnected, setStatus }
})
