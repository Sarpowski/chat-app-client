import { api } from '@/api'
import type { ChatRequestDto } from '@/types/chatRequest'

export const sendChatRequest = async (receiverId: string) => {
  const { data } = await api.post<ChatRequestDto>('/chat-requests', { receiverId })
  return data
}

export const getPendingRequests = async () => {
  const { data } = await api.get<ChatRequestDto[]>('/chat-requests/pending')
  return data
}

export const acceptChatRequest = async (requestId: string) => {
  const { data } = await api.post<{ conversationId: string }>(`/chat-requests/${requestId}/accept`)
  return data
}

export const rejectChatRequest = async (requestId: string) => {
  await api.post(`/chat-requests/${requestId}/reject`)
}
