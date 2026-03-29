<template>
  <span class="chip">{{ text }}</span>
</template>

<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<style scoped>
.chip {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-strong);
}
</style>
