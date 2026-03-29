<template>
  <main class="page-shell">
    <section class="card panel">
      <h2>Chat</h2>
      <p v-if="store.loading">Loading messages...</p>
      <p v-else-if="store.error">{{ store.error }}</p>
      <MessageList v-else ref="messageListRef" :messages="store.items" />
      <MessageInput @send="onSend" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MessageInput from '@/components/MessageInput.vue'
import MessageList from '@/components/MessageList.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useMessagesStore } from '@/stores/messages'
import { useWebSocketStore } from '@/stores/websocket'
import type { MessageDto } from '@/types/message'

const route = useRoute()
const store = useMessagesStore()
const wsStore = useWebSocketStore()
const ws = useWebSocket()

const conversationId = String(route.params.id)
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null)
let unsubscribe: (() => void) | null = null
let unwatchConnectionStatus: (() => void) | null = null

const isMessageDto = (value: unknown): value is MessageDto => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as Record<string, unknown>
  return (
    typeof payload.conversationId === 'string' &&
    typeof payload.messageId === 'string' &&
    typeof payload.senderId === 'string' &&
    typeof payload.content === 'string' &&
    typeof payload.createdAt === 'string'
  )
}

const scrollToBottom = async () => {
  await nextTick()
  const listElement = messageListRef.value?.$el as HTMLElement | undefined
  if (listElement) {
    listElement.scrollIntoView({ block: 'end' })
    return
  }

  window.scrollTo({ top: document.body.scrollHeight })
}

const subscribeToConversation = () => {
  unsubscribe?.()
  unsubscribe = ws.subscribe(`/topic/conversation.${conversationId}`, (message) => {
    try {
      const payload = JSON.parse(message.body) as unknown
      if (isMessageDto(payload)) {
        store.upsertIncoming(payload)
        void scrollToBottom()
        return
      }

      const withMessageId = payload as { messageId?: unknown }
      if (typeof withMessageId.messageId === 'string') {
        store.reconcileEcho(withMessageId.messageId)
      }
    } catch {
      // TODO: wire up when endpoint ships with full DTO payload.
    }
  })
}

onMounted(async () => {
  await store.fetchMessages(conversationId, 50)
  await scrollToBottom()

  ws.connect()
  const connected = await ws.awaitConnected()

  if (connected) {
    subscribeToConversation()
  }

  unwatchConnectionStatus = watch(
    () => wsStore.status,
    async (status, previousStatus) => {
      if (status === 'connected' && previousStatus !== 'connected') {
        await store.fetchMessages(conversationId, 50)
        await scrollToBottom()
        subscribeToConversation()
      }
    }
  )
})

onBeforeUnmount(() => {
  unsubscribe?.()
  unwatchConnectionStatus?.()
})

const onSend = (content: string) => {
  const messageId = crypto.randomUUID()
  store.addOptimistic({
    conversationId,
    messageId,
    senderId: 'self',
    content,
    createdAt: new Date().toISOString(),
  })

  void scrollToBottom()

  ws.send(`/app/conversation.${conversationId}.send`, {
    content,
    messageId,
  })
}
</script>

<style scoped>
.panel {
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}
</style>
