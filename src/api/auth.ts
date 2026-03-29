import { api } from '@/api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'

export const registerRequest = async (payload: RegisterRequest) => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export const loginRequest = async (payload: LoginRequest) => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export const refreshRequest = async () => {
  const { data } = await api.post<AuthResponse>('/auth/refresh')
  return data
}

export const logoutRequest = async () => {
  await api.post('/auth/logout')
}
