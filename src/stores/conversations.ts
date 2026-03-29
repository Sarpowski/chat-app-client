import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getConversations } from '@/api/conversations'
import type { ConversationDto } from '@/types/conversation'

export const useConversationsStore = defineStore('conversations', () => {
  const items = ref<ConversationDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchConversations = async () => {
    loading.value = true
    error.value = null

    try {
      items.value = await getConversations()
    } catch {
      error.value = 'Failed to load conversations'
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchConversations }
})
