import { api } from '@/api'
import type { MessageDto } from '@/types/message'

export const getMessages = async (conversationId: string, limit: number) => {
  const { data } = await api.get<MessageDto[]>(`/conversations/${conversationId}/messages?limit=${limit}`)
  return data
}
