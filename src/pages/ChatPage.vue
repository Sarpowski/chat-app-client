<template>
  <main class="page-shell">
    <section class="card panel">
      <h2>Chat</h2>

      <div class="toolbar">
        <button class="btn" type="button" :disabled="store.loadingMore || !store.canLoadMore" @click="onLoadMore">
          {{ store.loadingMore ? 'Loading...' : 'Load more' }}
        </button>
      </div>

      <div v-if="store.loading" class="skeleton-stack">
        <SkeletonMessageBubble v-for="index in 6" :key="index" />
      </div>

      <div v-else-if="store.error" class="error-block">
        {{ store.error }}
      </div>

      <div v-else ref="messagePaneRef" class="message-pane" @scroll="onMessagePaneScroll">
        <MessageList :messages="store.items" />
      </div>

      <button
        v-if="unreadCount > 0"
        class="unread-chip-btn"
        type="button"
        @click="jumpToLatest"
      >
        <NewMessageChip :text="`${unreadCount} new message${unreadCount > 1 ? 's' : ''}`" />
      </button>

      <MessageInput :disabled="wsStore.status !== 'connected'" @send="onSend" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MessageInput from '@/components/MessageInput.vue'
import MessageList from '@/components/MessageList.vue'
import NewMessageChip from '@/components/NewMessageChip.vue'
import SkeletonMessageBubble from '@/components/SkeletonMessageBubble.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useWebSocketStore } from '@/stores/websocket'
import type { MessageDto } from '@/types/message'

const route = useRoute()
const authStore = useAuthStore()
const store = useMessagesStore()
const wsStore = useWebSocketStore()
const ws = useWebSocket()

const conversationId = String(route.params.id)
const messagePaneRef = ref<HTMLElement | null>(null)
const unreadCount = ref(0)
const autoScrollEnabled = ref(true)

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

const isNearBottom = () => {
  const pane = messagePaneRef.value
  if (!pane) {
    return true
  }

  const threshold = 24
  const distance = pane.scrollHeight - pane.scrollTop - pane.clientHeight
  return distance <= threshold
}

const scrollToBottom = async () => {
  await nextTick()
  const pane = messagePaneRef.value
  if (!pane) {
    return
  }

  pane.scrollTop = pane.scrollHeight
  autoScrollEnabled.value = true
  unreadCount.value = 0
}

const onMessagePaneScroll = () => {
  const nearBottom = isNearBottom()
  autoScrollEnabled.value = nearBottom
  if (nearBottom) {
    unreadCount.value = 0
  }
}

const jumpToLatest = async () => {
  await scrollToBottom()
}

const handleIncomingMessage = async (message: MessageDto) => {
  const nearBottomBeforeUpdate = isNearBottom()
  const isOwnMessage = message.senderId === authStore.user?.id

  store.upsertIncoming(message)

  if (isOwnMessage || nearBottomBeforeUpdate || autoScrollEnabled.value) {
    await scrollToBottom()
    return
  }

  unreadCount.value += 1
}

const subscribeToConversation = () => {
  unsubscribe?.()
  unsubscribe = ws.subscribe(`/topic/conversation.${conversationId}`, (message) => {
    try {
      const payload = JSON.parse(message.body) as unknown
      if (isMessageDto(payload)) {
        void handleIncomingMessage(payload)
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
        await store.fetchMessages(conversationId, store.currentLimit)
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

const onLoadMore = async () => {
  const pane = messagePaneRef.value
  const previousScrollHeight = pane?.scrollHeight ?? 0
  const previousScrollTop = pane?.scrollTop ?? 0

  await store.loadMore(conversationId, 50)

  await nextTick()
  if (pane) {
    const newScrollHeight = pane.scrollHeight
    pane.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight)
  }
}

const onSend = (content: string) => {
  const messageId = crypto.randomUUID()
  store.addOptimistic({
    conversationId,
    messageId,
    senderId: authStore.user?.id ?? 'self',
    content,
    createdAt: new Date().toISOString(),
  })

  void scrollToBottom()

  const sent = ws.send(`/app/conversation.${conversationId}.send`, {
    content,
    messageId,
  })

  if (!sent) {
    store.markFailed(messageId)
  }
}
</script>

<style scoped>
.panel {
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
}

.message-pane {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  max-height: 55vh;
  overflow-y: auto;
  background: var(--surface);
}

.unread-chip-btn {
  width: fit-content;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.error-block {
  color: var(--danger);
}

.skeleton-stack {
  display: grid;
  gap: 0.6rem;
}
</style>
