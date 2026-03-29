<template>
  <form class="new-chat" @submit.prevent="submit">
    <UserSearchInput v-model="searchQuery" />
    <label>
      Username
      <input v-model="username" class="input" type="text" placeholder="Exact username" />
    </label>
    <button class="btn btn-primary" type="submit">Start conversation</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserSearchInput from '@/components/UserSearchInput.vue'

const emit = defineEmits<{
  (event: 'create', username: string): void
}>()

const username = ref('')
const searchQuery = ref('')

const submit = () => {
  const value = username.value.trim()
  if (!value) {
    return
  }

  emit('create', value)
  username.value = ''
}
</script>

<style scoped>
.new-chat {
  display: grid;
  gap: 0.8rem;
}
</style>
