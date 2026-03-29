<template>
  <article class="card bubble" :class="{ pending: message.pending, failed: message.failed }">
    <p>{{ message.content }}</p>
  </article>
</template>

<script setup lang="ts">
import type { LocalMessage } from '@/types/message'

defineProps<{
  message: LocalMessage
}>()
</script>

<style scoped>
.bubble {
  padding: 0.65rem 0.8rem;
}

.pending {
  opacity: 0.7;
}

.failed {
  border-color: var(--danger);
}

p {
  margin: 0;
}
</style>
