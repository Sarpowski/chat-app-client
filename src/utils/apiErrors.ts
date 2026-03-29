import { isAxiosError } from 'axios'
import { getErrorMessage } from '@/utils/errorMessages'

export const resolveApiErrorMessage = (error: unknown, endpointHint?: string) => {
  if (!isAxiosError(error)) {
    return 'Unexpected error'
  }

  if (!error.response) {
    return 'Connection failed, please try again'
  }

  const endpoint = endpointHint ?? error.config?.url
  return getErrorMessage(error.response.status, endpoint)
}
