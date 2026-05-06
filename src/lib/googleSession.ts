import type { AccountProfile } from '#/lib/booknest'

const GOOGLE_ID_TOKEN_KEY = 'booknest.google.idToken'
const GOOGLE_PROFILE_KEY = 'booknest.google.profile'

export function saveGoogleSession(idToken: string, profile: AccountProfile) {
  window.localStorage.setItem(GOOGLE_ID_TOKEN_KEY, idToken)
  window.localStorage.setItem(GOOGLE_PROFILE_KEY, JSON.stringify(profile))
}

export function readGoogleIdToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(GOOGLE_ID_TOKEN_KEY)
}

export function readGoogleProfile() {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(GOOGLE_PROFILE_KEY)
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AccountProfile
  } catch {
    return null
  }
}

export function clearGoogleSession() {
  window.localStorage.removeItem(GOOGLE_ID_TOKEN_KEY)
  window.localStorage.removeItem(GOOGLE_PROFILE_KEY)
}
