import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authFetch, getApiBaseUrl } from '../config/index'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('auth_token') || '')
  const studentId = ref(localStorage.getItem('studentId') || '')
  const userName = ref(localStorage.getItem('userName') || '')
  const isLoggedIn = computed(() => !!token.value)

  function setAuth(newToken, user) {
    token.value = newToken
    studentId.value = user.studentid || user.id || ''
    userName.value = user.name || ''
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('studentId', studentId.value)
    localStorage.setItem('userName', userName.value)
  }

  function setStudentId(id) {
    studentId.value = id
    localStorage.setItem('studentId', id)
  }

  function logout() {
    token.value = ''
    studentId.value = ''
    userName.value = ''
    localStorage.removeItem('auth_token')
    localStorage.removeItem('studentId')
    localStorage.removeItem('userName')
  }

  async function login(studentid, password) {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentid, password })
    })
    const data = await res.json()
    if (data.status === 200) {
      setAuth(data.data.token, data.data.user)
    }
    return data
  }

  async function register(formData) {
    const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    return res.json()
  }

  return { token, studentId, userName, isLoggedIn, setAuth, setStudentId, logout, login, register }
})
