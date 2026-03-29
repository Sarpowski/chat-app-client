<template>
  <form class="new-chat" @submit.prevent="submit">
    <label>
      Username
      <input v-model="username" class="input" type="text" placeholder="Exact username" />
    </label>
    <p class="note">User search is not available yet. Enter exact username.</p>
    <button class="btn btn-primary" type="submit">Start conversation</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (event: 'create', username: string): void
}>()

const username = ref('')

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
  gap: 0.65rem;
}

.note {
  margin: 0;
  color: var(--muted);
}
</style>
