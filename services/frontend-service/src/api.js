const ACCESS_KEY = 'eventhub_access_token'
const REFRESH_KEY = 'eventhub_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function setTokens(access, refresh) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function buildHeaders(auth = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  return headers
}

export async function registerUser(payload) {
  const response = await fetch('/users/auth/register/', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return response.json()
}

export async function loginUser(payload) {
  const response = await fetch('/users/auth/login/', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return response.json()
}

export async function fetchProfile() {
  const response = await fetch('/users/profile/', {
    headers: buildHeaders(true),
  })
  if (!response.ok) return null
  return response.json()
}

export async function fetchCategories() {
  const response = await fetch('/events/categories/')
  return response.json()
}

export async function fetchEvents() {
  const response = await fetch('/events/')
  return response.json()
}

export async function createEvent(payload) {
  const response = await fetch('/events/', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return response.json()
}

export async function updateEvent(id, payload) {
  const response = await fetch(`/events/${id}/`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return response.json()
}

export async function deleteEvent(id) {
  await fetch(`/events/${id}/`, { method: 'DELETE' })
}
