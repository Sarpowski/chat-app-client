# Pine Chat — Frontend Task Sheet

> This document describes all tasks required for Pine Chat frontend development in order of priority.
> All tasks must be implemented according to the rules defined in `FRONTEND_RULES.md`.

---

# Overview

| Priority | Number of tasks | Description |
|--------|--------|--------|
| P1 | 5 | Required for the application to function |
| P2 | 5 | Core user experience |
| P3 | 3 | Polishing and improvements |

---

# P1 — Mandatory Tasks

> P2 and P3 tasks must not be started until all P1 tasks are completed.

---

# P1-1 · Auth Pages — Login & Register

## Description

These pages allow users to log into the application or create a new account.
They can be implemented either as two separate routes (`/login`, `/register`) or as tabs on a single page.

## Behavior

- After a successful login/register, the JWT access token is stored in memory (Pinia store).
- The refresh token is managed automatically by the browser as an HttpOnly cookie — the frontend must never access it.
- After successful authentication, the user is redirected to `/conversations`.
- If a logged-in user tries to visit `/login`, they are redirected to `/conversations`.

## Form Validation

| Field | Rule |
|------|------|
| username | min 3, max 50 characters, required |
| password | min 8, max 72 characters, required |

Validation errors returned from the backend (400) must be displayed inline, not as a toast.

## API

POST /api/v1/auth/register
Body: { username: string, password: string }

Response:
{
  jwtToken: string,
  refreshToken: string,
  user: { id, username, role }
}

POST /api/v1/auth/login
Body: { username: string, password: string }

Response:
{
  jwtToken: string,
  refreshToken: string,
  user: { id, username, role }
}

## Files

src/pages/LoginPage.vue
src/pages/RegisterPage.vue
src/stores/auth.ts
src/api/auth.ts
src/types/auth.ts

## Error Cases

- 409 Conflict → "This username is already taken"
- 401 Unauthorized → "Incorrect username or password"
- Network error → "Connection failed, please try again"

---

# P1-2 · JWT Refresh Interceptor

## Description

An Axios interceptor that automatically refreshes the access token when it expires without logging the user out.

## Flow

API request is sent
→ If response is 401
→ POST /api/v1/auth/refresh
→ If successful → update token → retry original request
→ If failed → clear auth state → redirect to /login

## Important Rules

- Use a `_retry` flag to prevent infinite loops.
- If multiple requests receive 401 during refresh, they should be queued.
- After refresh completes, queued requests are retried.
- If refresh fails, all queued requests are rejected.

## API

POST /api/v1/auth/refresh
Cookie: refreshToken (automatic)

Response:
{
  jwtToken: string,
  refreshToken: string,
  user: {...}
}

## Files

src/api/index.ts
src/stores/auth.ts

---

# P1-3 · Conversation List

## Description

The main page that lists all conversations of the logged-in user.

## UI

Each row displays:

- Username of the other participant
- Conversation creation date

Clicking a conversation navigates to `/conversations/:id`.

If there are no conversations show:

"You're not talking to anyone yet."

A loading state must be displayed while fetching data.

## Resolving the Other User

Backend returns only `user1Id` and `user2Id`.

Example:

const otherUserId =
  conversation.user1Id === authStore.userId
    ? conversation.user2Id
    : conversation.user1Id

Later it can be resolved to username once the user endpoint exists.

## API

GET /api/v1/conversations

Response: ConversationDto[]

ConversationDto:

id
user1Id
user2Id
createdAt

## Files

src/pages/ConversationsPage.vue
src/components/ConversationListItem.vue
src/stores/conversations.ts
src/api/conversations.ts
src/types/conversation.ts

---

# P1-4 · Chat View — Real-time Messaging

## Description

Main chat interface where users send and receive messages in real time using WebSocket (STOMP over SockJS).

## Page Initialization

1. Fetch latest messages

GET /api/v1/conversations/{id}/messages?limit=50

2. Reverse messages (backend returns newest-first)
3. Subscribe to `/topic/conversation.{id}`
4. Scroll to bottom

## Sending Messages

1. Read input content
2. Add message locally with `pending: true` (optimistic rendering)
3. Send message via `/app/conversation.{id}.send`
4. When server echo arrives match using `messageId` and remove pending
5. If echo does not arrive in 5 seconds mark message as failed

## Leaving the Page

- Unsubscribe from topic
- Do not disconnect STOMP client

---

# P1-5 · Chat Request Flow

## Description

Users can send chat requests to each other and accept or reject incoming requests.

### Sending Request

UI contains:

- Username input
- "Start conversation" button

User must enter exact username.

Success toast:

"Request sent"

### Incoming Requests `/requests`

Each request shows:

- Sender UUID
- Date
- Accept / Reject buttons

Accept → redirect to `/conversations/:id`

Reject → remove from list.

## API

POST /api/v1/chat-requests
Body: { receiverId: string }

GET /api/v1/chat-requests/pending

POST /api/v1/chat-requests/{id}/accept
POST /api/v1/chat-requests/{id}/reject

ChatRequestDto:

id
senderId
receiverId
status
createdAt
updatedAt

status values:

PENDING
ACCEPTED
REJECTED

---

# P2 — Core UX Tasks

Do not start until P1 tasks are finished.

Includes:

- WebSocket connection state management
- Optimistic message rendering
- Message history pagination
- Logout flow
- Global error handling and toast notifications

---

# P3 — Polish and Improvements

Do not start until P1 and P2 tasks are finished.

Includes:

- User search UX
- Smart scroll-to-bottom
- Unread message indicator
- Loading skeletons and empty states

---

# Technical Notes

## Backend Limitations

- No user search endpoint yet
- No cursor pagination
- Two backend bugs still open

Frontend must handle 409 responses gracefully.

## Message Order

Backend returns newest first:

const messages = (
  await api.get(`/conversations/${id}/messages?limit=50`)
).data.reverse()

## Pinia Store Pattern

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchMessages = async (conversationId, limit = 50) => {
    loading.value = true
    try {
      const res = await api.get(`/conversations/${conversationId}/messages?limit=${limit}`)
      messages.value = res.data.reverse()
    } catch {
      error.value = 'Failed to load messages'
    } finally {
      loading.value = false
    }
  }

  return { messages, loading, error, fetchMessages }
})

