import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'

let stompClient: Client | null = null
let reconnectAttempt = 0
const activeSubscriptions = new Map<string, StompSubscription>()
let connectionResolvers: Array<() => void> = []

const baseBackoffMs = 1000
const maxBackoffMs = 20000

const nextBackoffDelay = () => {
  const delay = Math.min(baseBackoffMs * 2 ** reconnectAttempt, maxBackoffMs)
  reconnectAttempt += 1
  return delay
}

export function useWebSocket() {
  const authStore = useAuthStore()
  const wsStore = useWebSocketStore()

  const connect = () => {
    if (stompClient?.active || !authStore.token) {
      return
    }

    wsStore.setStatus('connecting')

    stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${authStore.token}`,
      },
      reconnectDelay: 0,
      onConnect: () => {
        reconnectAttempt = 0
        wsStore.setStatus('connected')
        connectionResolvers.forEach((resolve) => resolve())
        connectionResolvers = []
      },
      onDisconnect: () => {
        wsStore.setStatus('disconnected')
      },
      onStompError: () => {
        wsStore.setStatus('reconnecting')
      },
      onWebSocketClose: () => {
        wsStore.setStatus('reconnecting')
        window.setTimeout(() => {
          stompClient?.activate()
        }, nextBackoffDelay())
      },
    })

    stompClient.activate()
  }

  const disconnect = async () => {
    activeSubscriptions.forEach((subscription) => subscription.unsubscribe())
    activeSubscriptions.clear()

    if (stompClient) {
      await stompClient.deactivate()
      stompClient = null
    }

    wsStore.setStatus('disconnected')
  }

  const subscribe = (destination: string, callback: (message: IMessage) => void) => {
    if (!stompClient || !stompClient.connected) {
      return () => undefined
    }

    const previous = activeSubscriptions.get(destination)
    if (previous) {
      previous.unsubscribe()
    }

    const subscription = stompClient.subscribe(destination, callback)
    activeSubscriptions.set(destination, subscription)

    return () => {
      const current = activeSubscriptions.get(destination)
      if (current) {
        current.unsubscribe()
        activeSubscriptions.delete(destination)
      }
    }
  }

  const awaitConnected = (timeoutMs = 8000) => {
    if (stompClient?.connected) {
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      const onConnected = () => resolve(true)
      connectionResolvers.push(onConnected)

      window.setTimeout(() => {
        connectionResolvers = connectionResolvers.filter((candidate) => candidate !== onConnected)
        resolve(Boolean(stompClient?.connected))
      }, timeoutMs)
    })
  }

  const send = (destination: string, payload: object) => {
    if (!stompClient || !stompClient.connected) {
      return
    }

    stompClient.publish({
      destination,
      body: JSON.stringify(payload),
    })
  }

  return { connect, disconnect, subscribe, awaitConnected, send }
}
