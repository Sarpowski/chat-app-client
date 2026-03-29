import { api } from '@/api'
import type { UserDto } from '@/types/user'

interface RawUserDto {
  id?: string
  userId?: string
  username?: string
  role?: 'USER' | 'ADMIN' | 'DEVELOPER'
}

const normalizeUser = (raw: RawUserDto): UserDto | null => {
  const resolvedId = raw.id ?? raw.userId
  if (!resolvedId || !raw.username || !raw.role) {
    return null
  }

  return {
    id: resolvedId,
    username: raw.username,
    role: raw.role,
  }
}

export const searchUsers = async (query?: string): Promise<UserDto[]> => {
  const params = query && query.trim() ? { query: query.trim() } : {}
  const { data } = await api.get<RawUserDto[]>('/users', { params })
  return data.map(normalizeUser).filter((user): user is UserDto => user !== null)
}
