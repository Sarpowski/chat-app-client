import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@/styles.css'

const bootstrap = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore(pinia)
  try {
    await authStore.bootstrapAuth()
  } catch (error: unknown) {
    console.error('[bootstrap] auth bootstrap failed, continuing with app mount', error)
  }

  app.use(router)
  app.mount('#app')
}

void bootstrap()
