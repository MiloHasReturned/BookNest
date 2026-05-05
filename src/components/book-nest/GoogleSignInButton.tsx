import { useEffect, useRef, useState } from 'react'
import type { AccountProfile } from '#/lib/booknest'
import {
  loadGoogleIdentityScript,
  profileFromGoogleCredential,
} from '#/lib/googleIdentity'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function GoogleSignInButton({
  onSignIn,
}: {
  onSignIn: (profile: AccountProfile) => void
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    if (!googleClientId) {
      setError('Google sign-in needs VITE_GOOGLE_CLIENT_ID in Vercel.')
      return
    }

    async function mountGoogleButton() {
      try {
        await loadGoogleIdentityScript()

        if (isCancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return
        }

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          cancel_on_tap_outside: true,
          callback(response) {
            if (!response.credential) {
              setError('Google sign-in did not return an account.')
              return
            }

            try {
              onSignIn(profileFromGoogleCredential(response.credential))
              setError(null)
            } catch {
              setError('Google sign-in returned an unreadable account.')
            }
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
        })
      } catch {
        if (!isCancelled) {
          setError('Google sign-in could not load.')
        }
      }
    }

    void mountGoogleButton()

    return () => {
      isCancelled = true
    }
  }, [onSignIn])

  return (
    <div className="google-auth-panel">
      <div ref={buttonRef} className="google-button-host" />
      {error ? <p className="google-auth-error">{error}</p> : null}
    </div>
  )
}
