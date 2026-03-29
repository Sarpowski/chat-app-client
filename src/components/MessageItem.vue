<template>
  <article class="bubble-row" :class="{ own: isOwn }">
    <section class="bubble" :class="{ own: isOwn, pending: message.pending, failed: message.failed }">
      <p class="sender">{{ isOwn ? 'You' : 'Other' }}</p>
      <p class="content">{{ message.content }}</p>
      <footer class="meta">
        <time :datetime="message.createdAt">{{ formattedTime }}</time>
        <span v-if="message.failed" class="status status-failed">failed</span>
        <span v-else-if="message.pending" class="status">sending...</span>
      </footer>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LocalMessage } from '@/types/message'

const props = defineProps<{
  message: LocalMessage
  isOwn: boolean
}>()

const formattedTime = computed(() => new Date(props.message.createdAt).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
}))
</script>

<style scoped>
.bubble-row {
  display: flex;
  justify-content: flex-start;
}

.bubble-row.own {
  justify-content: flex-end;
}

.bubble {
  width: fit-content;
  max-width: min(78%, 680px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #ffffff;
  padding: 0.55rem 0.75rem 0.45rem;
  box-shadow: 0 2px 10px rgba(30, 26, 22, 0.06);
}

.bubble.own {
  background: #dcf8c6;
  border-color: #b9e4a2;
}

.sender {
  margin: 0 0 0.2rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted);
}

.pending {
  opacity: 0.85;
}

.failed {
  border-color: var(--danger);
}

.content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.meta {
  margin-top: 0.3rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: var(--muted);
}

.status {
  text-transform: lowercase;
}

.status-failed {
  color: var(--danger);
  font-weight: 700;
}
</style>
