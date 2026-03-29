export interface UserDto {
  id: string
  username: string
  role: 'USER' | 'ADMIN' | 'DEVELOPER'
}
