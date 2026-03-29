export interface MessageDto {
  conversationId: string
  messageId: string
  senderId: string
  content: string
  createdAt: string
}

export interface LocalMessage extends MessageDto {
  pending?: boolean
  failed?: boolean
  localId?: string
}
