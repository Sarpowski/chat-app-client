import { computed } from 'vue'
import { defineStore } from 'pinia'

export interface ToastMessage {
  id: string
  text: string
  kind: 'info' | 'success' | 'error'
}

export const useToastStore = defineStore('toast', {
  state: (): { items: ToastMessage[] } => ({
    items: [],
  }),
  actions: {
    push(text: string, kind: ToastMessage['kind'] = 'info') {
      const toast: ToastMessage = {
        id: crypto.randomUUID(),
        text,
        kind,
      }

      this.items.push(toast)

      window.setTimeout(() => {
        this.items = this.items.filter((item) => item.id !== toast.id)
      }, 3500)
    },
    dismiss(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})

export function useToast() {
  const store = useToastStore()

  return {
    toasts: computed(() => store.items),
    notifyInfo: (text: string) => store.push(text, 'info'),
    notifySuccess: (text: string) => store.push(text, 'success'),
    notifyError: (text: string) => store.push(text, 'error'),
    dismiss: (id: string) => store.dismiss(id),
  }
}
