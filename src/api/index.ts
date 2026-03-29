import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

type AuthHandlers = {
  refreshAccessToken: () => Promise<string | null>
  onRefreshFailed: () => Promise<void> | void
}

let accessToken: string | null = null
let authHandlers: AuthHandlers | null = null
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const setAuthHandlers = (handlers: AuthHandlers) => {
  authHandlers = handlers
}

const processQueue = (error: unknown, token: string | null = null) => {
  const queue = failedQueue
  failedQueue = []

  queue.forEach(({ resolve, reject }) => {
    if (error || token === null) {
      reject(error)
      return
    }
    resolve(token)
  })
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || !authHandlers) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await authHandlers.refreshAccessToken()
      if (!newToken) {
        throw new Error('Refresh returned empty token')
      }

      setAccessToken(newToken)
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await authHandlers.onRefreshFailed()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
