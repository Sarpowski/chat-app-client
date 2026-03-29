# Pine Chat — Frontend Rules

> These rules apply to every piece of frontend code written for this project.
> All AI assistance must follow this document before writing any code.

---

## Stack — non-negotiable

- **Framework**: Vue 3 (Composition API only — no Options API)
- **Language**: TypeScript for all logic, types, composables, and stores
- **Templates**: `.vue` SFC files with `<script setup lang="ts">`
- **Styling**: plain CSS or scoped `<style scoped>` — no Tailwind, no CSS-in-JS
- **HTTP**: Axios with a configured instance (see Auth rules)
- **WebSocket**: `@stomp/stompjs` + `sockjs-client`
- **State**: Pinia stores only — no Vuex, no plain reactive globals
- **Routing**: Vue Router 4

---

## Task list compliance

Before writing any code, check `PLAN.md` (task sheet).

- Tasks must be implemented in priority order: **P1 → P2 → P3**
- Do not implement a P2 or P3 task if any P1 task is incomplete
- Every new component or composable must map to a named task from the sheet
- If a task requires a backend endpoint that does not exist yet, build the UI shell and leave a `// TODO: wire up when endpoint ships` comment — do not fake data permanently

---

## Project structure

```
src/
  api/          # Axios instance + per-module API functions (auth.ts, conversations.ts, etc.)
  components/   # Reusable UI components
  composables/  # useWebSocket.ts, useAuth.ts, etc.
  pages/        # Route-level page components (LoginPage.vue, ConversationsPage.vue, etc.)
  router/       # index.ts — route definitions + navigation guards
  stores/       # Pinia stores (auth.ts, conversations.ts, messages.ts)
  types/        # Shared TypeScript interfaces and enums
  App.vue
  main.ts
```

---

## TypeScript rules

- Strict mode on — `"strict": true` in `tsconfig.json`
- No `any` — use `unknown` and narrow, or define a proper type
- All API responses must have a typed interface in `src/types/`
- All Pinia store state must be fully typed
- Props must always have explicit types via `defineProps<{...}>()`
- Emits must always have explicit types via `defineEmits<{...}>()`

```ts
// types/message.ts
export interface MessageDto {
  conversationId: string
  messageId: string
  senderId: string
  content: string
  createdAt: string
}
```

---

## Auth rules

JWT is stored in memory only — **never** `localStorage`, **never** `sessionStorage`.

```ts
// stores/auth.ts
const accessToken = ref<string | null>(null) // memory only
```

The refresh token is an HttpOnly cookie — the browser handles it automatically, the frontend never touches it directly.

The Axios instance must have a request interceptor that attaches the Bearer token, and a response interceptor that:
1. Catches 401 responses
2. Calls `POST /api/v1/auth/refresh`
3. Updates the in-memory token
4. Retries the original request
5. On refresh failure — clears auth state and redirects to `/login`

```ts
// api/index.ts
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      await authStore.refresh() // calls refresh endpoint, updates token
      err.config.headers.Authorization = `Bearer ${authStore.token}`
      return axiosInstance(err.config)
    }
    return Promise.reject(err)
  }
)
```

---

## WebSocket rules

Use `@stomp/stompjs` with `SockJS` as the transport.

- Connect once on app load (after login) — not per-page
- JWT goes in the STOMP CONNECT frame header — **not** as a URL query param

```ts
const client = new Client({
  webSocketFactory: () => new SockJS('/ws'),
  connectHeaders: { Authorization: `Bearer ${token}` },
})
```

- Subscribe to `/topic/conversation.{id}` when entering a chat view
- Unsubscribe when leaving
- Send to `/app/conversation.{id}.send` with payload `{ content: string }`
- Handle disconnects: show a subtle indicator, attempt reconnect with exponential backoff
- On reconnect, re-subscribe to the active conversation and fetch missed messages

The WebSocket client must live in a Pinia store or a singleton composable — never instantiated inside a component.

---

## Message rendering rules

Messages from `GET /api/v1/conversations/{id}/messages` arrive **newest-first** (Cassandra DESC clustering). Reverse the array before rendering so oldest messages appear at the top.

```ts
const messages = response.data.reverse()
```

Optimistic rendering for sent messages:
1. Append to local state immediately with a `pending: true` flag
2. When the server echo arrives via the topic subscription, find the message by `messageId` and remove the pending flag
3. If no match found within 5 seconds, mark as failed

---

## Component rules

- One component per file
- File name matches component name — PascalCase (`ConversationList.vue`)
- No logic in templates beyond simple conditionals — extract to `computed` or composables
- No direct API calls from components — use store actions or composables
- All async operations must handle loading and error states

```vue
<script setup lang="ts">
const props = defineProps<{ conversationId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>
```

---

## Router rules

Protected routes must use a navigation guard that checks for a valid auth state. If no token, redirect to `/login`.

```ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
})
```

Route names:

| Name | Path | Auth required |
|------|------|---------------|
| `login` | `/login` | No |
| `register` | `/register` | No |
| `conversations` | `/conversations` | Yes |
| `chat` | `/conversations/:id` | Yes |
| `requests` | `/requests` | Yes |

---

## Error handling rules

- All API errors must be caught and surfaced — never swallow errors silently
- Map backend error messages to user-friendly copy in a central `errorMessages.ts` file
- Use a global toast/notification system — not `alert()`
- Known backend error cases to handle explicitly:
  - `409 Conflict` on chat request — "You already have a pending request with this user"
  - `403 Forbidden` on message send — "You are not a participant of this conversation"
  - `401 Unauthorized` after refresh failure — redirect to login
  - `404 Not Found` on conversation — redirect to conversation list

---

## Known backend constraints

> Do not work around these silently — surface them clearly in the UI.

- **No user search endpoint exists** — chat requests require exact username input for now. Show a note in the UI. Build the search input ready for when the endpoint ships.
- **Messages paginate via `?limit=N`** — there is no cursor/offset pagination yet. "Load more" refetches with a higher limit for now.
- **Two backend bugs are unresolved** — conversation existence checks may behave oddly in edge cases (duplicate conversation detection). Handle unexpected 409 responses gracefully.

---

## What not to do

- No `any` types
- No `localStorage` or `sessionStorage` for tokens
- No Options API (`data()`, `methods:`, `computed:`)
- No direct `fetch()` calls — always use the configured Axios instance
- No WebSocket logic inside `.vue` components
- No implementing P2/P3 tasks before all P1 tasks are done
- No faking backend data with hardcoded mocks in production code (use `// TODO` instead)
