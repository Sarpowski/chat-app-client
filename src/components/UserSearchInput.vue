<template>
  <div class="search-shell">
    <label for="user-search">Find user</label>
    <input
      id="user-search"
      :value="modelValue"
      class="input"
      type="text"
      placeholder="Type username to search (coming soon)"
      @input="onInput"
    />
    <p class="note">Search endpoint is not available yet. Enter exact username below to start a chat.</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.search-shell {
  display: grid;
  gap: 0.4rem;
}

.note {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
