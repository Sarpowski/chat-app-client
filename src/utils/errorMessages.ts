export const HTTP_ERRORS: Record<number, string> = {
  400: 'Invalid request',
  401: 'Session expired, please sign in again',
  403: 'You do not have permission for this action',
  404: 'Resource was not found',
  409: 'You already have a pending request with this user',
  500: 'Server error, please try again',
}

export const ENDPOINT_ERRORS: Record<string, Partial<Record<number, string>>> = {
  'auth/register': { 409: 'This username is already taken' },
  'auth/login': { 401: 'Incorrect username or password' },
  'chat-requests': {
    404: 'User was not found',
    409: 'You already have a pending request with this user',
  },
  conversations: {
    403: 'You are not a participant of this conversation',
    404: 'Conversation was not found',
  },
  users: {
    403: 'You are not allowed to search users',
    500: 'Failed to load users',
  },
}

export const getErrorMessage = (status: number, endpoint?: string) => {
  if (endpoint) {
    const key = Object.keys(ENDPOINT_ERRORS).find((candidate) => endpoint.includes(candidate))
    if (key && ENDPOINT_ERRORS[key][status]) {
      return ENDPOINT_ERRORS[key][status] ?? 'Unexpected error'
    }
  }

  return HTTP_ERRORS[status] ?? 'Unexpected error'
}
