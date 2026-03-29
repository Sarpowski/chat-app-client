<template>
  <article class="card list-item">
    <p class="title">{{ title }}</p>
    <p class="meta">{{ createdAtLabel }}</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  createdAtLabel: string
}>()
</script>

<style scoped>
.list-item {
  padding: 0.8rem;
}

.title {
  margin: 0;
  font-weight: 600;
}

.meta {
  margin: 0.3rem 0 0;
  color: var(--muted);
}
</style>
