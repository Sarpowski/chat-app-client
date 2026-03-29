import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue') },
    { path: '/register', name: 'register', component: () => import('@/pages/RegisterPage.vue') },
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

router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (!to.meta.requiresAuth && auth.isAuthenticated) {
    return { name: 'conversations' }
  }

  return true
})

export default router
