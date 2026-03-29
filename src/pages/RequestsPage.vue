<template>
  <main class="page-shell">
    <section class="card panel">
      <h2>Incoming Requests</h2>
      <p v-if="store.loading">Loading requests...</p>
      <p v-else-if="store.error">{{ store.error }}</p>
      <EmptyState v-else-if="store.pending.length === 0" message="No pending requests" />
      <div v-else class="list">
        <ChatRequestItem
          v-for="request in store.pending"
          :key="request.id"
          :sender-id="request.senderId"
          :created-at-label="new Date(request.createdAt).toLocaleString()"
          @accept="onAccept(request.id)"
          @reject="onReject(request.id)"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ChatRequestItem from '@/components/ChatRequestItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useChatRequestsStore } from '@/stores/chatRequests'

const router = useRouter()
const store = useChatRequestsStore()

onMounted(async () => {
  await store.fetchPending()
})

const onAccept = async (requestId: string) => {
  const conversationId = await store.acceptRequest(requestId)
  await router.push({ name: 'chat', params: { id: conversationId } })
}

const onReject = async (requestId: string) => {
  await store.rejectRequestById(requestId)
}
</script>

<style scoped>
.panel {
  padding: 1rem;
}

.list {
  display: grid;
  gap: 0.6rem;
}
</style>
