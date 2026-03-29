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
