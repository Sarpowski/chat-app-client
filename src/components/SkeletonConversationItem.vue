<template>
  <div class="card skeleton"></div>
</template>

<script setup lang="ts"></script>

<style scoped>
.skeleton {
  min-height: 56px;
  background: linear-gradient(90deg, #f4e8d6, #fff6ea, #f4e8d6);
  background-size: 200% 100%;
  animation: pulse 1.4s infinite linear;
}

@keyframes pulse {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
