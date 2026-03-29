<template>
  <section class="list">
    <MessageItem
      v-for="item in messages"
      :key="item.localId ?? item.messageId"
      :message="item"
      :is-own="item.senderId === auth.user?.id"
    />
  </section>
</template>

<script setup lang="ts">
import MessageItem from '@/components/MessageItem.vue'
import { useAuthStore } from '@/stores/auth'
import type { LocalMessage } from '@/types/message'

defineProps<{
  messages: LocalMessage[]
}>()

const auth = useAuthStore()
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 220px;
}
</style>
