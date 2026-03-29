<template>
  <main class="page-shell page-grid">
    <section class="card panel">
      <h2>Conversations</h2>
      <p v-if="store.loading">Loading conversations...</p>
      <p v-else-if="store.error">{{ store.error }}</p>
      <EmptyState v-else-if="store.items.length === 0" message="You're not talking to anyone yet." />
      <div v-else class="list">
        <button
          v-for="conversation in store.items"
          :key="conversation.id"
          class="unstyled"
          type="button"
          @click="goConversation(conversation.id)"
        >
          <ConversationListItem
            :title="resolveOtherParticipantLabel(conversation.user1Id, conversation.user2Id)"
            :created-at-label="new Date(conversation.createdAt).toLocaleString()"
          />
        </button>
      </div>
    </section>

    <section class="card panel">
      <h2>Start New Chat</h2>
      <NewChatForm @create="handleCreateRequest" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConversationListItem from '@/components/ConversationListItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import NewChatForm from '@/components/NewChatForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatRequestsStore } from '@/stores/chatRequests'
import { useConversationsStore } from '@/stores/conversations'
import { useToast } from '@/composables/useToast'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

const router = useRouter()
const store = useConversationsStore()
const authStore = useAuthStore()
const chatRequests = useChatRequestsStore()
const toast = useToast()

onMounted(async () => {
  await store.fetchConversations()
})

const goConversation = async (id: string) => {
  await router.push({ name: 'chat', params: { id } })
}

const handleCreateRequest = async (username: string) => {
  try {
    await chatRequests.createRequest(username)
    toast.notifySuccess('Request sent')
  } catch (error: unknown) {
    toast.notifyError(resolveApiErrorMessage(error, 'chat-requests'))
  }
}

const resolveOtherParticipantLabel = (user1Id: string, user2Id: string) => {
  if (authStore.user?.id === user1Id) {
    return user2Id
  }
  return user1Id
}
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1.5fr 1fr;
}

.panel {
  padding: 1rem;
}

.list {
  display: grid;
  gap: 0.6rem;
}

.unstyled {
  all: unset;
  cursor: pointer;
}

@media (max-width: 900px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
