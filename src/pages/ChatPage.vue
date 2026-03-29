<template>
  <main class="page-shell">
    <section class="card panel">
      <h2>Chat</h2>
      <p v-if="store.loading">Loading messages...</p>
      <p v-else-if="store.error">{{ store.error }}</p>
      <MessageList v-else :messages="store.items" />
      <MessageInput @send="onSend" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MessageInput from '@/components/MessageInput.vue'
import MessageList from '@/components/MessageList.vue'
import { useMessagesStore } from '@/stores/messages'
import { useWebSocket } from '@/composables/useWebSocket'

const route = useRoute()
const store = useMessagesStore()
const ws = useWebSocket()

const conversationId = String(route.params.id)
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await store.fetchMessages(conversationId, 50)
  ws.connect()

  unsubscribe = ws.subscribe(`/topic/conversation.${conversationId}`, (message) => {
    try {
      const payload = JSON.parse(message.body) as { messageId?: string }
      if (payload.messageId) {
        store.reconcileEcho(payload.messageId)
      }
    } catch {
      // TODO: wire up when endpoint ships with full DTO payload.
    }
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
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
