import { ref } from 'vue'
import { defineStore } from 'pinia'
import { acceptChatRequest, getPendingRequests, rejectChatRequest, sendChatRequest } from '@/api/chatRequests'
import type { ChatRequestDto } from '@/types/chatRequest'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

export const useChatRequestsStore = defineStore('chatRequests', () => {
  const pending = ref<ChatRequestDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPending = async () => {
    loading.value = true
    error.value = null

    try {
      pending.value = await getPendingRequests()
    } catch (requestError: unknown) {
      error.value = resolveApiErrorMessage(requestError, 'chat-requests')
    } finally {
      loading.value = false
    }
  }

  const createRequest = async (receiverId: string) => {
    await sendChatRequest(receiverId)
  }

  const acceptRequest = async (requestId: string) => {
    const response = await acceptChatRequest(requestId)
    pending.value = pending.value.filter((item) => item.id !== requestId)
    return response.conversationId
  }

  const rejectRequestById = async (requestId: string) => {
    await rejectChatRequest(requestId)
    pending.value = pending.value.filter((item) => item.id !== requestId)
  }

  return { pending, loading, error, fetchPending, createRequest, acceptRequest, rejectRequestById }
})
