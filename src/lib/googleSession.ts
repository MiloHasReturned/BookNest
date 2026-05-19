import type { AccountProfile } from '#/lib/booknest'

const GOOGLE_ID_TOKEN_KEY = 'booknest.google.idToken'
const GOOGLE_PROFILE_KEY = 'booknest.google.profile'

export function saveGoogleSession(idToken: string, profile: AccountProfile) {
  try {
    window.localStorage.setItem(GOOGLE_ID_TOKEN_KEY, idToken)
    window.localStorage.setItem(GOOGLE_PROFILE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.warn('[BookNest] Could not save Google session.', error)
  }
}

export function readGoogleIdToken() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(GOOGLE_ID_TOKEN_KEY)
  } catch {
    return null
  }
}

export function readGoogleProfile() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(GOOGLE_PROFILE_KEY)
    if (!stored) {
      return null
    }

    return JSON.parse(stored) as AccountProfile
  } catch {
    return null
  }
}

export function clearGoogleSession() {
  try {
    window.localStorage.removeItem(GOOGLE_ID_TOKEN_KEY)
    window.localStorage.removeItem(GOOGLE_PROFILE_KEY)
  } catch (error) {
    console.warn('[BookNest] Could not clear Google session.', error)
  }
}
