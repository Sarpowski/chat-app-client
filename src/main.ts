import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import '@/styles.css'

const app = createApp(App)

// IMPORTANT: Pinia MUST be installed before router, because the navigation
// guard inside router/index.ts calls useAuthStore() synchronously.
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')
