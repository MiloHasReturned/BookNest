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
        title: 'Connection timed out',
        message:
          'BookNest could not reach sync right now. Your changes are still saved on this device.',
        likelyCause: 'The network connection was interrupted.',
        nextStep:
          operation === 'save'
            ? 'Keep working and try syncing again in a moment.'
            : 'Try again in a moment, or keep working offline.',
      }
    case 'google-auth':
      return {
        title: 'Session expired',
        message: 'Your sign-in session has expired.',
        likelyCause: 'The saved sign-in session is no longer valid.',
        nextStep: 'Sign out, then sign in again to resume cloud sync.',
      }
    case 'supabase-config':
      return {
        title: 'Sync unavailable',
        message: 'Cloud sync is temporarily unavailable.',
        likelyCause: 'Cloud sync is not available right now.',
        nextStep: 'Keep working offline and try again later.',
      }
    case 'supabase-data':
      return {
        title: 'Invite expired',
        message: 'This invite or shared calendar is no longer available.',
        likelyCause: 'The invite has expired or the calendar was removed.',
        nextStep: 'Ask the calendar owner to send a new invite.',
      }
    case 'supabase-permission':
      return {
        title: 'Session expired',
        message: 'BookNest could not confirm your access.',
        likelyCause: 'Your session or calendar access changed.',
        nextStep: 'Sign in again, then try the action once more.',
      }
    case 'invite':
      return {
        title: 'Invite could not be sent',
        message: 'BookNest could not send that invite.',
        likelyCause: 'The invite details could not be confirmed.',
        nextStep: 'Check the email address and try again.',
      }
    case 'cloud-sync':
      return {
        title: 'Sync interrupted',
        message: 'BookNest could not finish syncing.',
        likelyCause: 'The sync request was interrupted.',
        nextStep: 'Try again, or keep working offline for now.',
      }
    case 'unknown':
      return {
        title: 'Something went wrong',
        message: 'BookNest could not complete that action.',
        likelyCause: 'The request could not be completed.',
        nextStep: 'Try again in a moment.',
      }
  }
}
