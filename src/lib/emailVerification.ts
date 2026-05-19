import { createServerFn } from '@tanstack/react-start'

export type EmailVerificationResult = {
  deliverable: boolean
  disposable: boolean
  reason: string
}

const API_URL =
  process.env.EMAIL_VERIFY_API_URL ?? 'https://api.validemail.io/v1/verify'
const API_KEY = process.env.EMAIL_VERIFY_API_KEY

export const verifyEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: { email?: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email?.trim()
    if (!email) {
      throw new Error('Email is required')
    }
    if (!API_KEY) {
      throw new Error('Set EMAIL_VERIFY_API_KEY in the environment')
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[verifyEmail] non-200', {
        status: response.status,
        statusText: response.statusText,
        text,
      })
      throw new Error(`Verifier responded ${response.status}: ${text}`)
    }

    const responseData = (await response.json()) as Record<string, unknown>

    const deliverable =
      (responseData.deliverable as boolean | undefined) ??
      (responseData.is_valid as boolean | undefined) ??
      false
    const disposable =
      (responseData.disposable as boolean | undefined) ??
      (responseData.is_disposable as boolean | undefined) ??
      false
    const reason =
      (responseData.reason as string | undefined) ??
      (responseData.status as string | undefined) ??
      'unknown'

    const result: EmailVerificationResult = { deliverable, disposable, reason }

    return result
  })

// Client-friendly helper to avoid remembering the { email } shape
export async function verifyEmailClient(email: string) {
  return verifyEmail({ data: { email } })
}

export const verifyEmailDebug = createServerFn({ method: 'GET' }).handler(
  async () => {
    return {
      hasKey: Boolean(API_KEY),
      apiUrl: API_URL,
    }
  },
)
