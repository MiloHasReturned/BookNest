export type CloudIssueArea =
  | 'network'
  | 'google-auth'
  | 'supabase-config'
  | 'supabase-data'
  | 'supabase-permission'
  | 'cloud-sync'
  | 'invite'
  | 'unknown'

export type CloudOperation =
  | 'load'
  | 'save'
  | 'cleanup'
  | 'accept-invite'
  | 'send-invite'
  | 'sign-in'
  | 'unknown'

export type CloudIssue = {
  id: string
  area: CloudIssueArea
  operation: CloudOperation
  title: string
  message: string
  likelyCause: string
  nextStep: string
  rawMessage: string
  timestamp: string
}

type CreateCloudIssueInput = {
  error?: unknown
  fallback?: string
  operation: CloudOperation
  message?: string
}

export function createCloudIssue({
  error,
  fallback = 'Cloud sync failed.',
  operation,
  message,
}: CreateCloudIssueInput): CloudIssue {
  const rawMessage = message ?? errorMessage(error, fallback)
  const normalized = rawMessage.toLowerCase()
  const timestamp = new Date().toISOString()
  const area = classifyCloudIssue(normalized)
  const advice = adviceForCloudIssue(area, operation)

  return {
    id: `${operation}-${area}-${Date.now().toString(36)}`,
    area,
    operation,
    title: advice.title,
    message: advice.message,
    likelyCause: advice.likelyCause,
    nextStep: advice.nextStep,
    rawMessage,
    timestamp,
  }
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function isTransientFetchError(error: unknown) {
  const message = errorMessage(error, '').toLowerCase()
  return (
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed')
  )
}

export function isCleanableCloudIssue(issue: CloudIssue | null) {
  if (!issue) {
    return false
  }

  return (
    issue.area === 'supabase-data' ||
    /broken|foreign key|calendar-not-found|not present in table/i.test(issue.rawMessage)
  )
}

function classifyCloudIssue(normalizedMessage: string): CloudIssueArea {
  if (
    normalizedMessage.includes('fetch failed') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('network request failed')
  ) {
    return 'network'
  }

  if (
    normalizedMessage.includes('google') ||
    normalizedMessage.includes('token') ||
    normalizedMessage.includes('credential') ||
    normalizedMessage.includes('sign in')
  ) {
    return 'google-auth'
  }

  if (
    normalizedMessage.includes('supabase backend is not configured') ||
    normalizedMessage.includes('supabase_url') ||
    normalizedMessage.includes('service_role')
  ) {
    return 'supabase-config'
  }

  if (
    normalizedMessage.includes('foreign key') ||
    normalizedMessage.includes('not present in table') ||
    normalizedMessage.includes('calendar-not-found') ||
    normalizedMessage.includes('violates')
  ) {
    return 'supabase-data'
  }

  if (
    normalizedMessage.includes('permission') ||
    normalizedMessage.includes('jwt') ||
    normalizedMessage.includes('401') ||
    normalizedMessage.includes('403')
  ) {
    return 'supabase-permission'
  }

  if (normalizedMessage.includes('invite')) {
    return 'invite'
  }

  if (
    normalizedMessage.includes('supabase request failed') ||
    normalizedMessage.includes('cloud sync')
  ) {
    return 'cloud-sync'
  }

  return 'unknown'
}

function adviceForCloudIssue(area: CloudIssueArea, operation: CloudOperation) {
  switch (area) {
    case 'network':
      return {
        title: 'Cloud connection failed',
        message:
          'BookNest could not reach the cloud sync endpoint. Local browser data is still safe.',
        likelyCause:
          'Network outage, Vercel function cold-start failure, Supabase outage, or blocked request.',
        nextStep:
          operation === 'save'
            ? 'Keep working locally, then use Retry Sync once the connection is stable.'
            : 'Use Retry Sync. If it keeps failing, work offline and check Vercel/Supabase status.',
      }
    case 'google-auth':
      return {
        title: 'Google sign-in needs attention',
        message: 'The Google account token could not be verified for cloud sync.',
        likelyCause:
          'Expired login, wrong Google Client ID env var, or OAuth audience mismatch.',
        nextStep:
          'Sign out, sign back in with Google, then confirm VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID match.',
      }
    case 'supabase-config':
      return {
        title: 'Supabase is not configured',
        message: 'The deployed backend is missing required Supabase environment variables.',
        likelyCause: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in Vercel.',
        nextStep:
          'Open Vercel project settings, add the Supabase env vars, then redeploy.',
      }
    case 'supabase-data':
      return {
        title: 'Cloud data relationship is broken',
        message:
          'A calendar, invite, membership, or reservation points to missing cloud data.',
        likelyCause:
          'A local invite/calendar existed before the matching Supabase row was created or was deleted.',
        nextStep:
          'Use Clean Up Broken Local Invites, then create a fresh calendar invite from the owner account.',
      }
    case 'supabase-permission':
      return {
        title: 'Cloud permission failed',
        message: 'Supabase rejected the cloud request.',
        likelyCause:
          'Wrong service role key, revoked key, bad project URL, or row-level/security policy mismatch.',
        nextStep:
          'Check Vercel env vars against Supabase API settings and redeploy after changing keys.',
      }
    case 'invite':
      return {
        title: 'Invite action failed',
        message: 'BookNest could not complete the calendar invite action.',
        likelyCause:
          'Recipient email, calendar ownership, or cloud calendar creation is not ready.',
        nextStep:
          'Confirm the owner is signed in, the calendar has synced, and the recipient email is correct.',
      }
    case 'cloud-sync':
      return {
        title: 'Cloud sync failed',
        message: 'Supabase returned an error during cloud sync.',
        likelyCause: 'A database request failed while loading or saving BookNest data.',
        nextStep:
          'Open technical details below and check the table/operation named in the raw message.',
      }
    case 'unknown':
      return {
        title: 'Unexpected BookNest error',
        message: 'BookNest hit an error that was not classified.',
        likelyCause: 'Unknown client, server, or data issue.',
        nextStep:
          'Copy the technical details and check the browser console plus Vercel function logs.',
      }
  }
}
