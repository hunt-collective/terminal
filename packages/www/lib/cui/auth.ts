import { createClient } from '@openauthjs/openauth/client'

const apiUrl = document
  .querySelector('meta[property="api-url"]')!
  .getAttribute('content')!
const authUrl = document
  .querySelector('meta[property="auth-url"]')!
  .getAttribute('content')!

export const client = createClient({
  clientID: 'www',
  issuer: authUrl,
})

export const API_URL = apiUrl

let accessToken: string | undefined = undefined
const initializing = { current: true }

// Cache DOM elements
const loginBtn = document.getElementById('login-btn')!
const logoutBtn = document.getElementById('logout-btn')!

// Update UI based on auth state
function updateAuthUI() {
  if (accessToken) {
    loginBtn.classList.add('hidden')
    logoutBtn.classList.remove('hidden')
  } else {
    loginBtn.classList.remove('hidden')
    logoutBtn.classList.add('hidden')
  }
}

export async function getToken() {
  const refresh = localStorage.getItem('refresh')
  if (!refresh) return
  const next = await client.refresh(refresh, {
    access: accessToken,
  })
  if (next.err) return
  if (!next.tokens) return accessToken

  localStorage.setItem('refresh', next.tokens.refresh)
  accessToken = next.tokens.access
  updateAuthUI()

  return next.tokens.access
}

export async function login() {
  const token = await getToken()
  if (!token) {
    const { challenge, url } = await client.authorize(location.origin, 'code', {
      pkce: true,
    })
    sessionStorage.setItem('challenge', JSON.stringify(challenge))
    location.href = url
  }
}

export async function callback(code: string, state: string) {
  const challengeStr = sessionStorage.getItem('challenge')
  if (!challengeStr) return

  const challenge = JSON.parse(challengeStr)
  if (code) {
    if (state === challenge.state && challenge.verifier) {
      const exchanged = await client.exchange(
        code,
        location.origin,
        challenge.verifier,
      )
      if (!exchanged.err && exchanged.tokens) {
        accessToken = exchanged.tokens.access
        localStorage.setItem('refresh', exchanged.tokens.refresh)
        updateAuthUI()
      }
    }
    window.location.replace('/')
  }
}

export function logout() {
  localStorage.removeItem('refresh')
  accessToken = undefined
  updateAuthUI()
  window.location.replace('/')
}

export async function auth() {
  const token = await getToken()
  if (token) accessToken = token
  updateAuthUI()
  return accessToken
}

export function getCurrentToken() {
  return accessToken
}

// Initialize event listeners
loginBtn.addEventListener('click', login)
logoutBtn.addEventListener('click', logout)
