export type CalendarInviteLinkPayload = {
  calendarId: string
  calendarName: string
  senderName: string
  sentDate: string
}

export function createCalendarInviteUrl({
  calendarId,
  calendarName,
  senderName,
}: {
  calendarId: string
  calendarName: string
  senderName: string
}) {
  const payload: CalendarInviteLinkPayload = {
    calendarId,
    calendarName,
    senderName,
    sentDate: new Date().toISOString(),
  }
  const url = new URL(window.location.origin)
  url.searchParams.set('invite', encodeBase64Url(JSON.stringify(payload)))

  return url.toString()
}

export function parseCalendarInviteParam(value: string) {
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as Partial<CalendarInviteLinkPayload>

    if (
      typeof parsed.calendarId !== 'string' ||
      typeof parsed.calendarName !== 'string' ||
      typeof parsed.senderName !== 'string' ||
      typeof parsed.sentDate !== 'string'
    ) {
      return null
    }

    return parsed as CalendarInviteLinkPayload
  } catch {
    return null
  }
}

function encodeBase64Url(value: string) {
  return btoa(encodeURIComponent(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

  return decodeURIComponent(atob(padded))
}
