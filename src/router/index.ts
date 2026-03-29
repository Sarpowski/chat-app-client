import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: () => import('@/pages/ConversationsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/conversations/:id',
      name: 'chat',
      component: () => import('@/pages/ChatPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/requests',
      name: 'requests',
      component: () => import('@/pages/RequestsPage.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/', redirect: '/conversations' },
    { path: '/:pathMatch(.*)*', redirect: '/conversations' },
  ],
})

router.beforeEach((to) => {
  // useAuthStore must be called inside the guard (after Pinia is active),
  // but NOT with a dynamic import — Pinia is already mounted by the time
  // the guard runs because main.ts calls app.use(createPinia()) before app.use(router).
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresAuth === false && auth.isAuthenticated) {
    return { name: 'conversations' }
  }

  return true
})

export default router
