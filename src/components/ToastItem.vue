<template>
  <article class="toast card" :class="kind">
    <p>{{ text }}</p>
    <button type="button" @click="$emit('close')">x</button>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  text: string
  kind: 'info' | 'success' | 'error'
}>()

defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.toast {
  padding: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.toast button {
  margin-left: auto;
}

.success {
  border-color: var(--ok);
}

.error {
  border-color: var(--danger);
}
</style>
