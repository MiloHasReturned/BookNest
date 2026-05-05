import type { AccountProfile } from '#/lib/booknest'

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleIdConfiguration = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  type?: 'standard' | 'icon'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  width?: number
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (configuration: GoogleIdConfiguration) => void
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

let googleIdentityScript: Promise<void> | null = null

export function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser.'))
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  googleIdentityScript ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google sign-in could not load.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google sign-in could not load.'))
    document.head.appendChild(script)
  })

  return googleIdentityScript
}

export function profileFromGoogleCredential(credential: string): AccountProfile {
  const payload = decodeJwtPayload(credential)
  const email = typeof payload.email === 'string' ? payload.email : ''
  const name =
    typeof payload.name === 'string' && payload.name.trim()
      ? payload.name
      : email.split('@')[0] || 'BookNest User'
  const picture = typeof payload.picture === 'string' ? payload.picture : null

  return {
    email,
    username: name,
    imageData: picture,
  }
}

function decodeJwtPayload(credential: string) {
  const payload = credential.split('.')[1]

  if (!payload) {
    throw new Error('Google sign-in returned an invalid credential.')
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const decoded = atob(padded)

  return JSON.parse(decoded) as Record<string, unknown>
}
