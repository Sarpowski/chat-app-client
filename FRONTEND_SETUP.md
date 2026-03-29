# Pine Chat — Frontend Project Setup

> Vue 3 + TypeScript + Vite  
> Bu doküman projeyi sıfırdan kurmak için gereken tüm adımları içerir.

---

## Gereksinimler

| Araç | Minimum versiyon |
|------|-----------------|
| Node.js | 20.x |
| npm | 10.x |
| Git | herhangi |

---

## 1. Proje Oluşturma

```bash
npm create vue@latest pine-chat-frontend
```

Çıkan sorulara aşağıdaki gibi cevap ver:

```
✔ Add TypeScript?                → Yes
✔ Add JSX Support?               → No
✔ Add Vue Router?                → Yes
✔ Add Pinia?                     → Yes
✔ Add Vitest?                    → Yes
✔ Add an End-to-End Testing?     → No
✔ Add ESLint?                    → Yes
✔ Add Prettier?                  → Yes
✔ Add Vue DevTools?              → Yes
```

```bash
cd pine-chat-frontend
npm install
```

---

## 2. Ek Bağımlılıklar

```bash
# HTTP client
npm install axios

# WebSocket — STOMP over SockJS
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client

# Geliştirme araçları
npm install -D @types/node
```

---

## 3. tsconfig.json

`tsconfig.app.json` içine ekle:

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 4. vite.config.ts

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true  // WebSocket proxy için zorunlu
      }
    }
  }
})
```

---

## 5. Klasör Yapısı

```
src/
├── api/
│   ├── index.ts          # Axios instance + interceptor'lar
│   ├── auth.ts           # register, login, refresh, logout
│   ├── conversations.ts  # getConversations, getConversation
│   ├── messages.ts       # getMessages
│   ├── chatRequests.ts   # send, pending, accept, reject
│   └── users.ts          # stub — user search endpoint bekliyor
│
├── components/
│   ├── AppHeader.vue
│   ├── ConnectionBanner.vue
│   ├── ConversationListItem.vue
│   ├── ChatRequestItem.vue
│   ├── MessageList.vue
│   ├── MessageItem.vue
│   ├── MessageInput.vue
│   ├── NewChatForm.vue
│   ├── NewMessageChip.vue
│   ├── ToastContainer.vue
│   ├── ToastItem.vue
│   ├── EmptyState.vue
│   ├── SkeletonConversationItem.vue
│   ├── SkeletonMessageBubble.vue
│   └── UserSearchInput.vue
│
├── composables/
│   ├── useWebSocket.ts   # STOMP client — singleton
│   └── useToast.ts       # global toast sistemi
│
├── pages/
│   ├── LoginPage.vue
│   ├── RegisterPage.vue
│   ├── ConversationsPage.vue
│   ├── ChatPage.vue
│   └── RequestsPage.vue
│
├── router/
│   └── index.ts          # route tanımları + navigation guard
│
├── stores/
│   ├── auth.ts           # token, user, login/logout/refresh
│   ├── conversations.ts  # konuşma listesi
│   ├── messages.ts       # mesaj geçmişi + optimistic state
│   ├── chatRequests.ts   # bekleyen istekler
│   └── websocket.ts      # WsStatus state
│
├── types/
│   ├── auth.ts           # AuthResponse, UserSummary, LoginRequest, RegisterRequest
│   ├── conversation.ts   # ConversationDto
│   ├── message.ts        # MessageDto, LocalMessage
│   └── chatRequest.ts    # ChatRequestDto, ChatRequestStatus
│
├── utils/
│   └── errorMessages.ts  # HTTP status → Türkçe mesaj map
│
├── App.vue
└── main.ts
```

---

## 6. Temel Dosyalar

### src/main.ts

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

---

### src/types/auth.ts

```ts
export interface RegisterRequest {
  username: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface UserSummary {
  id: string
  username: string
  role: 'USER' | 'ADMIN' | 'DEVELOPER'
}

export interface AuthResponse {
  jwtToken: string
  refreshToken: string
  user: UserSummary
}
```

---

### src/types/conversation.ts

```ts
export interface ConversationDto {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
}
```

---

### src/types/message.ts

```ts
export interface MessageDto {
  conversationId: string
  messageId: string
  senderId: string
  content: string
  createdAt: string
}

export interface LocalMessage extends MessageDto {
  pending?: boolean
  failed?: boolean
  localId?: string
}
```

---

### src/types/chatRequest.ts

```ts
export type ChatRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ChatRequestDto {
  id: string
  senderId: string
  receiverId: string
  status: ChatRequestStatus
  createdAt: string
  updatedAt: string | null
}
```

---

### src/api/index.ts

```ts
import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true   // refresh token cookie için zorunlu
})

// Request interceptor — Bearer token ekle
api.interceptors.request.use(config => {
  // Auth store'u lazy import et — circular dependency önlemek için
  const token = sessionStorage.getItem('__pine_token__')  // sadece örnek — gerçekte Pinia store
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — 401 yakalama + token refresh
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.jwtToken
        // Store'u güncelle (gerçek implementasyonda useAuthStore().setToken(newToken))
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        router.push({ name: 'login' })
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
```

---

### src/stores/auth.ts

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import api from '@/api'
import type { AuthResponse, LoginRequest, RegisterRequest, UserSummary } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)   // memory only — asla localStorage'a yazma
  const user = ref<UserSummary | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  function setAuth(data: AuthResponse) {
    token.value = data.jwtToken
    user.value = data.user
    // Axios interceptor token'ı buradan okur
    api.defaults.headers.common['Authorization'] = `Bearer ${data.jwtToken}`
  }

  function clearAuth() {
    token.value = null
    user.value = null
    delete api.defaults.headers.common['Authorization']
  }

  async function register(payload: RegisterRequest) {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    setAuth(data)
  }

  async function login(payload: LoginRequest) {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    setAuth(data)
  }

  async function refresh() {
    const { data } = await api.post<AuthResponse>('/auth/refresh')
    setAuth(data)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuth()
    }
  }

  return { token, user, isAuthenticated, register, login, refresh, logout, setAuth, clearAuth }
})
```

---

### src/router/index.ts

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: () => import('@/pages/ConversationsPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/conversations/:id',
      name: 'chat',
      component: () => import('@/pages/ChatPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/requests',
      name: 'requests',
      component: () => import('@/pages/RequestsPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/conversations'
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/conversations'
    }
  ]
})

// Navigation guard
router.beforeEach(to => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (!to.meta.requiresAuth && auth.isAuthenticated) {
    return { name: 'conversations' }
  }
})

export default router
```

---

### src/composables/useWebSocket.ts

```ts
import { ref } from 'vue'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/stores/auth'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

// Singleton — tek bir bağlantı
let client: Client | null = null
const status = ref<WsStatus>('disconnected')

export function useWebSocket() {
  const authStore = useAuthStore()

  function connect() {
    if (client?.active) return

    status.value = 'connecting'

    client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${authStore.token}`
      },
      reconnectDelay: 5000,

      onConnect: () => {
        status.value = 'connected'
      },

      onDisconnect: () => {
        status.value = 'disconnected'
      },

      onStompError: () => {
        status.value = 'reconnecting'
      }
    })

    client.activate()
  }

  function disconnect() {
    client?.deactivate()
    client = null
    status.value = 'disconnected'
  }

  function subscribe(destination: string, callback: (msg: IMessage) => void) {
    if (!client?.active) {
      console.warn('[WS] subscribe çağrıldı ama client aktif değil')
      return () => {}
    }
    const sub = client.subscribe(destination, callback)
    return () => sub.unsubscribe()
  }

  function send(destination: string, body: object) {
    if (!client?.active) {
      console.warn('[WS] send çağrıldı ama client aktif değil')
      return
    }
    client.publish({
      destination,
      body: JSON.stringify(body)
    })
  }

  return { status, connect, disconnect, subscribe, send }
}
```

---

### src/utils/errorMessages.ts

```ts
export const HTTP_ERRORS: Record<number, string> = {
  400: 'Geçersiz istek',
  401: 'Oturum süresi doldu, tekrar giriş yapınız',
  403: 'Bu işlem için yetkiniz yok',
  404: 'Bulunamadı',
  409: 'Bu işlem zaten gerçekleştirilmiş',
  500: 'Sunucu hatası, lütfen tekrar deneyin',
}

export const ENDPOINT_ERRORS: Record<string, Partial<Record<number, string>>> = {
  'auth/register': {
    409: 'Bu kullanıcı adı zaten alınmış'
  },
  'auth/login': {
    401: 'Kullanıcı adı veya şifre hatalı'
  },
  'chat-requests': {
    409: 'Bu kişiye zaten istek gönderdin veya konuşma zaten var',
    404: 'Kullanıcı bulunamadı'
  }
}

export function getErrorMessage(status: number, endpoint?: string): string {
  if (endpoint) {
    const key = Object.keys(ENDPOINT_ERRORS).find(k => endpoint.includes(k))
    if (key && ENDPOINT_ERRORS[key][status]) {
      return ENDPOINT_ERRORS[key][status]!
    }
  }
  return HTTP_ERRORS[status] ?? 'Beklenmeyen bir hata oluştu'
}
```

---

## 7. ESLint & Prettier

`.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',    // any yasak
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'vue/component-api-style': ['error', ['script-setup']],  // Options API yasak
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/define-emits-declaration': ['error', 'type-based']
  }
}
```

`.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 8. package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.ts,.tsx --fix",
    "format": "prettier --write src/",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest"
  }
}
```

---

## 9. Backend Bağlantısı

Backend `localhost:8080`'de çalışıyor olmalı. Vite proxy sayesinde frontend'den `/api` ve `/ws` istekleri otomatik olarak backend'e yönlendirilir — CORS sorunu yaşanmaz.

Backend'i ayağa kaldırmak için Docker Compose gerekiyor (PostgreSQL + Cassandra). Backend reposunda `docker-compose.yml` yoksa önce onu oluştur.

---

## 10. Geliştirmeye Başlama

```bash
# 1. Backend ayağa kaldır (backend repo'sunda)
docker compose up -d

# 2. Backend'i başlat
./gradlew bootRun

# 3. Frontend'i başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

---

## Kontrol Listesi — İlk Commit'ten Önce

- [ ] `npm run type-check` hata vermeden geçiyor
- [ ] `npm run lint` hata vermeden geçiyor
- [ ] `tsconfig.json` içinde `"strict": true` var
- [ ] `src/api/index.ts` içinde `withCredentials: true` var
- [ ] Hiçbir yerde `localStorage` veya `sessionStorage` kullanılmıyor
- [ ] Hiçbir yerde `any` tipi yok
- [ ] Router guard tüm korumalı route'ları kapsıyor
- [ ] WebSocket client component içinde değil, composable içinde
