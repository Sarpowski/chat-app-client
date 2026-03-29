<template>
  <header class="app-header card">
    <div class="page-shell header-inner">
      <h1>Pine Chat</h1>
      <nav>
        <RouterLink to="/conversations">Conversations</RouterLink>
        <RouterLink to="/requests">Requests</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  border-radius: 0;
  z-index: 20;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav {
  display: flex;
  gap: 1rem;
}

a.router-link-active {
  color: var(--accent-strong);
  font-weight: 700;
}
</style>
