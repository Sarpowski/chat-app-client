<template>
  <main class="page-shell page-grid">
    <section class="card panel">
      <h2>Conversations</h2>
      <div v-if="store.loading" class="list">
        <SkeletonConversationItem v-for="index in 4" :key="index" />
      </div>
      <p v-else-if="store.error">{{ store.error }}</p>
      <EmptyState v-else-if="store.items.length === 0" message="You're not talking to anyone yet." />
      <div v-else class="list">
        <RouterLink
          v-for="conversation in store.items"
          :key="conversation.id"
          class="conversation-trigger"
          :to="{ name: 'chat', params: { id: conversation.id } }"
        >
          <ConversationListItem
            :title="resolveOtherParticipantLabel(conversation.user1Id, conversation.user2Id)"
            :created-at-label="new Date(conversation.createdAt).toLocaleString()"
          />
        </RouterLink>
      </div>
    </section>

    <section class="card panel">
      <h2>Start New Chat</h2>
      <NewChatForm @create="handleCreateRequest" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { searchUsers } from '@/api/users'
import ConversationListItem from '@/components/ConversationListItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import NewChatForm from '@/components/NewChatForm.vue'
import SkeletonConversationItem from '@/components/SkeletonConversationItem.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatRequestsStore } from '@/stores/chatRequests'
import { useConversationsStore } from '@/stores/conversations'
import { useToast } from '@/composables/useToast'
import type { UserDto } from '@/types/user'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

const store = useConversationsStore()
const authStore = useAuthStore()
const chatRequests = useChatRequestsStore()
const toast = useToast()
const usersById = ref<Record<string, string>>({})

onMounted(async () => {
  await Promise.all([store.fetchConversations(), fetchUsersLookup()])
})

const fetchUsersLookup = async () => {
  try {
    const users = await searchUsers()
    usersById.value = users.reduce<Record<string, string>>((acc, user: UserDto) => {
      acc[user.id] = user.username
      return acc
    }, {})
  } catch {
    usersById.value = {}
  }
}

const handleCreateRequest = async (receiverId: string) => {
  try {
    await chatRequests.createRequest(receiverId)
    toast.notifySuccess('Request sent')
  } catch (error: unknown) {
    toast.notifyError(resolveApiErrorMessage(error, 'chat-requests'))
  }
}

const resolveOtherParticipantLabel = (user1Id: string, user2Id: string) => {
  const otherUserId = authStore.user?.id === user1Id ? user2Id : user1Id
  return usersById.value[otherUserId] ?? otherUserId
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

.conversation-trigger {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-decoration: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.conversation-trigger:focus-visible {
  outline: 2px solid var(--ring);
  border-radius: 14px;
}

@media (max-width: 900px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
