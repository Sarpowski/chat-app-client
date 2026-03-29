import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getMessages } from '@/api/messages'
import type { LocalMessage, MessageDto } from '@/types/message'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

const pendingTimeoutMs = 5000

export const useMessagesStore = defineStore('messages', () => {
  const items = ref<LocalMessage[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const currentLimit = ref(50)
  const canLoadMore = ref(true)

  const fetchMessages = async (conversationId: string, limit = 50, appendMode = false) => {
    if (appendMode) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    error.value = null

    try {
      const data = await getMessages(conversationId, limit)
      currentLimit.value = limit
      canLoadMore.value = data.length >= limit
      items.value = [...data].reverse()
    } catch (requestError: unknown) {
      error.value = resolveApiErrorMessage(requestError, 'conversations')
    } finally {
      if (appendMode) {
        loadingMore.value = false
      } else {
        loading.value = false
      }
    }
  }

  const loadMore = async (conversationId: string, step = 50) => {
    if (loading.value || loadingMore.value || !canLoadMore.value) {
      return
    }

    await fetchMessages(conversationId, currentLimit.value + step, true)
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

  const markFailed = (messageId: string) => {
    const found = items.value.find((entry) => entry.messageId === messageId)
    if (found) {
      found.pending = false
      found.failed = true
    }
  }

  const reconcileEcho = (messageId: string) => {
    const found = items.value.find((entry) => entry.messageId === messageId)
    if (found) {
      found.pending = false
      found.failed = false
    }
  }

  const upsertIncoming = (message: MessageDto) => {
    const existing = items.value.find((entry) => entry.messageId === message.messageId)
    if (existing) {
      existing.content = message.content
      existing.createdAt = message.createdAt
      existing.senderId = message.senderId
      existing.pending = false
      existing.failed = false
      return
    }

    items.value.push(message)
  }

  return {
    items,
    loading,
    loadingMore,
    error,
    currentLimit,
    canLoadMore,
    fetchMessages,
    loadMore,
    addOptimistic,
    markFailed,
    reconcileEcho,
    upsertIncoming,
  }
})
