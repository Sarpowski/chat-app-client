<template>
  <main class="page-shell">
    <section class="card auth-box">
      <h2>Login</h2>
      <form class="auth-form" @submit.prevent="onSubmit">
        <label>
          Username
          <input v-model="form.username" class="input" type="text" />
        </label>
        <label>
          Password
          <input v-model="form.password" class="input" type="password" />
        </label>
        <p v-if="errorText" class="error">{{ errorText }}</p>
        <button class="btn btn-primary" type="submit" :disabled="loading">Sign in</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const errorText = ref('')

const onSubmit = async () => {
  errorText.value = ''

  if (form.username.length < 3 || form.username.length > 50) {
    errorText.value = 'Username must be between 3 and 50 characters'
    return
  }

  if (form.password.length < 8 || form.password.length > 72) {
    errorText.value = 'Password must be between 8 and 72 characters'
    return
  }

  loading.value = true
  try {
    await authStore.login(form)
    await router.push({ name: 'conversations' })
  } catch (error: unknown) {
    if (isAxiosError(error) && !error.response) {
      errorText.value = 'Connection failed, please try again'
    } else {
      errorText.value = 'Incorrect username or password'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-box {
  max-width: 460px;
  margin: 2.4rem auto;
  padding: 1rem;
}

.auth-form {
  display: grid;
  gap: 0.75rem;
}

.error {
  margin: 0;
  color: var(--danger);
}
</style>
