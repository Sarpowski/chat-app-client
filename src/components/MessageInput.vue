<template>
  <form class="compose" @submit.prevent="submit">
    <input v-model="content" class="input" type="text" placeholder="Write a message" />
    <button class="btn btn-primary" type="submit">Send</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (event: 'send', content: string): void
}>()

const content = ref('')

const submit = () => {
  const value = content.value.trim()
  if (!value) {
    return
  }

  emit('send', value)
  content.value = ''
}
</script>

<style scoped>
.compose {
  display: flex;
  gap: 0.5rem;
}
</style>
