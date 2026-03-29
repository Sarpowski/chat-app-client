<template>
  <section class="toast-wrap">
    <ToastItem
      v-for="item in toasts"
      :key="item.id"
      :text="item.text"
      :kind="item.kind"
      @close="dismiss(item.id)"
    />
  </section>
</template>

<script setup lang="ts">
import ToastItem from '@/components/ToastItem.vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  display: grid;
  gap: 0.45rem;
}
</style>
