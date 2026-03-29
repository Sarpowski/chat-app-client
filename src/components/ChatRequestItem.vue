<template>
  <article class="card list-item">
    <p>Sender: {{ senderId }}</p>
    <p>Created: {{ createdAtLabel }}</p>
    <div class="actions">
      <button class="btn btn-primary" type="button" @click="$emit('accept')">Accept</button>
      <button class="btn" type="button" @click="$emit('reject')">Reject</button>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  senderId: string
  createdAtLabel: string
}>()

defineEmits<{
  (event: 'accept'): void
  (event: 'reject'): void
}>()
</script>

<style scoped>
.list-item {
  padding: 0.8rem;
}

p {
  margin: 0.25rem 0;
}

.actions {
  margin-top: 0.6rem;
  display: flex;
  gap: 0.5rem;
}
</style>
