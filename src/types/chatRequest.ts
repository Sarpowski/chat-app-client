export type ChatRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ChatRequestDto {
  id: string
  senderId: string
  receiverId: string
  status: ChatRequestStatus
  createdAt: string
  updatedAt: string | null
}
