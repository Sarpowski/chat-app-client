<template>
  <div class="card empty">{{ message }}</div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<style scoped>
.empty {
  padding: 1rem;
  text-align: center;
  color: var(--muted);
}
</style>
