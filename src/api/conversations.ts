import { api } from '@/api'
import type { ConversationDto } from '@/types/conversation'

export const getConversations = async () => {
  const { data } = await api.get<ConversationDto[]>('/conversations')
  return data
}
