import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getMessages } from '@/api/messages'
import type { LocalMessage, MessageDto } from '@/types/message'

const pendingTimeoutMs = 5000

export const useMessagesStore = defineStore('messages', () => {
  const items = ref<LocalMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMessages = async (conversationId: string, limit = 50) => {
    loading.value = true
    error.value = null

    try {
      const data = await getMessages(conversationId, limit)
      items.value = [...data].reverse()
    } catch {
      error.value = 'Failed to load messages'
    } finally {
      loading.value = false
    }
  }

  const addOptimistic = (message: MessageDto) => {
    items.value.push({ ...message, pending: true })

    window.setTimeout(() => {
      const found = items.value.find((entry) => entry.messageId === message.messageId)
      if (found?.pending) {
        found.pending = false
        found.failed = true
      }
    }, pendingTimeoutMs)
  }

  const reconcileEcho = (messageId: string) => {
    const found = items.value.find((entry) => entry.messageId === messageId)
    if (found) {
      found.pending = false
      found.failed = false
    }
  }

  return { items, loading, error, fetchMessages, addOptimistic, reconcileEcho }
})
