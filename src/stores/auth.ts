import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../api/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(null)

  async function login(username: string, password: string) {
    const res: any = await request.post('/auth/login', { username, password })
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    await fetchUser()
  }

  async function register(data: { email: string; username: string; password: string }) {
    await request.post('/auth/register', data)
  }

  async function fetchUser() {
    user.value = await request.get('/auth/me')
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, login, register, fetchUser, logout }
})
