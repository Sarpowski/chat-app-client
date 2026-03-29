<template>
  <section class="list">
    <MessageItem v-for="item in messages" :key="item.localId ?? item.messageId" :message="item" />
  </section>
</template>

<script setup lang="ts">
import MessageItem from '@/components/MessageItem.vue'
import type { LocalMessage } from '@/types/message'

defineProps<{
  messages: LocalMessage[]
}>()
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 220px;
}
</style>
