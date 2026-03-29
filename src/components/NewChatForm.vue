<template>
  <div class="new-chat">
    <label>
      Search users
      <input
        v-model="query"
        class="input"
        type="text"
        placeholder="Type at least 2 characters"
        @input="onQueryInput"
      />
    </label>

    <p class="note">Search results exclude your own account.</p>

    <div v-if="loading" class="state-text">Searching...</div>
    <div v-else-if="error" class="state-text error-text">{{ error }}</div>
    <div v-else-if="query.trim().length > 0 && query.trim().length < 2" class="state-text">
      Keep typing to search users
    </div>

    <ul v-else-if="results.length > 0" class="user-list">
      <li
        v-for="user in results"
        :key="user.id"
        class="user-item card"
        :class="{ selected: selectedUser?.id === user.id }"
        @click="selectUser(user)"
      >
        <span class="username">{{ user.username }}</span>
        <span v-if="selectedUser?.id === user.id" class="check">✓</span>
      </li>
    </ul>

    <div v-else-if="query.trim().length >= 2" class="state-text">No users found</div>

    <button class="btn btn-primary" type="button" :disabled="!selectedUser" @click="submit">
      Send chat request
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchUsers } from '@/api/users'
import type { UserDto } from '@/types/user'
import { resolveApiErrorMessage } from '@/utils/apiErrors'

const emit = defineEmits<{
  (event: 'create', receiverId: string): void
}>()

const query = ref('')
const results = ref<UserDto[]>([])
const selectedUser = ref<UserDto | null>(null)
const loading = ref(false)
const error = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const fetchUsers = async (searchText: string) => {
  const normalized = searchText.trim()
  if (normalized.length < 2) {
    results.value = []
    loading.value = false
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    results.value = await searchUsers(normalized)
  } catch (requestError: unknown) {
    error.value = resolveApiErrorMessage(requestError, 'users')
    results.value = []
  } finally {
    loading.value = false
  }
}

const onQueryInput = () => {
  selectedUser.value = null

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = window.setTimeout(() => {
    void fetchUsers(query.value)
  }, 250)
}

const selectUser = (user: UserDto) => {
  selectedUser.value = selectedUser.value?.id === user.id ? null : user
}

const submit = () => {
  if (!selectedUser.value?.id) {
    error.value = 'Selected user is invalid. Please search and select again.'
    return
  }

  emit('create', selectedUser.value.id)
  query.value = ''
  selectedUser.value = null
  results.value = []
}
</script>

<style scoped>
.new-chat {
  display: grid;
  gap: 0.75rem;
}

.note {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.user-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
  max-height: 240px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.user-item:hover {
  background: var(--surface-strong);
}

.user-item.selected {
  background: var(--surface-strong);
  border-color: var(--accent);
}

.username {
  font-weight: 500;
}

.check {
  color: var(--accent-strong);
  font-weight: 700;
}

.state-text {
  color: var(--muted);
  font-size: 0.9rem;
}

.error-text {
  color: var(--danger);
}
</style>
