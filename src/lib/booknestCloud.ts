import { createServerFn } from '@tanstack/react-start'
import {
  type AccountProfile,
  type AppTheme,
  type BookNestSnapshot,
  type CalendarInvite,
  type CalendarReservation,
  type ChatMessage,
  DEFAULT_THEME,
  normalizeSnapshot,
} from '#/lib/booknest'

type GoogleTokenInfo = {
  aud?: string
  sub?: string
  email?: string
  email_verified?: string
  name?: string
  picture?: string
}

type SupabaseProfileRow = {
  email: string
  google_sub: string | null
  username: string
  image_data: string | null
  theme: AppTheme | null
}

type SupabaseCalendarRow = {
  id: string
  name: string
  tint_index: number
  owner_email: string
}

type SupabaseMembershipRow = {
  calendar_id: string
  user_email: string
  role: 'owner' | 'member'
}

type SupabaseCalendarStateRow = {
  calendar_id: string
  reservations: CalendarReservation[] | null
  day_notes: Record<string, string> | null
  chat: ChatMessage[] | null
}

type SupabaseInviteRow = {
  id: string
  calendar_id: string
  recipient_email: string
  sender_name: string
  created_at: string
  booknest_calendars?: {
    name?: string
  }
}

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

type LoadCloudSnapshotInput = {
  idToken?: string | null
  localSnapshot?: BookNestSnapshot
}

type SaveCloudSnapshotInput = {
  idToken?: string | null
  snapshot?: BookNestSnapshot
}

type AcceptCloudCalendarInviteInput = {
  idToken?: string | null
  calendarId?: string | null
}

export const loadCloudSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((input: LoadCloudSnapshotInput) => input)
  .handler(async ({ data }) => {
    const { idToken, localSnapshot } = data

    if (!idToken) {
      return {
        ok: false,
        reason: 'missing-token',
        snapshot: localSnapshot ?? null,
      }
    }

    const user = await verifyGoogleIdToken(idToken)
    const profile = await getProfile(user.email)
    const memberships = await getMemberships(user.email)
    const membershipCalendarIds = memberships.map((membership) => membership.calendar_id)
    const ownedCalendars = await getOwnedCalendars(user.email)
    const memberCalendars = membershipCalendarIds.length
      ? await getCalendarsByIds(membershipCalendarIds)
      : []
    const calendarsById = new Map<string, SupabaseCalendarRow>()

    for (const calendar of [...ownedCalendars, ...memberCalendars]) {
      calendarsById.set(calendar.id, calendar)
    }

    const visibleCalendars = [...calendarsById.values()]
    const accountProfile = profileToAccountProfile(profile, user)

    if (
      !visibleCalendars.length &&
      localSnapshot &&
      (localSnapshot.calendars.length ||
        localSnapshot.invitedCalendars.length ||
        Object.keys(localSnapshot.reservationsByCalendar).length ||
        Object.keys(localSnapshot.dayNotesByCalendar).length ||
        Object.keys(localSnapshot.chatByCalendar).length)
    ) {
      return {
        ok: true,
        snapshot: normalizeSnapshot({
          ...localSnapshot,
          accountProfile,
          theme: profile?.theme ?? localSnapshot.theme,
        }),
      }
    }

    const states = visibleCalendars.length
      ? await getCalendarStates(visibleCalendars.map((calendar) => calendar.id))
      : []
    const stateByCalendarId = new Map(
      states.map((state) => [state.calendar_id, state] as const),
    )
    const pendingInvites = await getPendingInvites(user.email)
    const snapshot = normalizeSnapshot({
      accountProfile,
      calendars: visibleCalendars
        .filter((calendar) => calendar.owner_email === user.email)
        .map(calendarRowToUserCalendar),
      invitedCalendars: visibleCalendars
        .filter((calendar) => calendar.owner_email !== user.email)
        .map(calendarRowToUserCalendar),
      invites: pendingInvites.map(inviteRowToCalendarInvite),
      reservationsByCalendar: Object.fromEntries(
        visibleCalendars.map((calendar) => [
          calendar.id,
          stateByCalendarId.get(calendar.id)?.reservations ?? [],
        ]),
      ),
      dayNotesByCalendar: Object.fromEntries(
        visibleCalendars.map((calendar) => [
          calendar.id,
          stateByCalendarId.get(calendar.id)?.day_notes ?? {},
        ]),
      ),
      chatByCalendar: Object.fromEntries(
        visibleCalendars.map((calendar) => [
          calendar.id,
          stateByCalendarId.get(calendar.id)?.chat ?? [],
        ]),
      ),
      theme: profile?.theme ?? localSnapshot?.theme ?? DEFAULT_THEME,
    })

    return {
      ok: true,
      snapshot,
    }
  })

export const saveCloudSnapshot = createServerFn({ method: 'POST' })
  .inputValidator((input: SaveCloudSnapshotInput) => input)
  .handler(async ({ data }) => {
    const { idToken, snapshot } = data

    if (!idToken || !snapshot) {
      return {
        ok: false,
        reason: 'missing-data',
      }
    }

    const user = await verifyGoogleIdToken(idToken)
    const accountProfile = snapshot.accountProfile ?? profileToAccountProfile(null, user)

    await upsertProfile(user, accountProfile, snapshot.theme)
    await upsertOwnedCalendars(user.email, snapshot)
    await upsertAcceptedMemberships(user.email, snapshot)
    await upsertVisibleCalendarStates(user.email, snapshot)
    await deleteRemovedOwnedCalendars(user.email, snapshot)

    return {
      ok: true,
    }
  })

export const acceptCloudCalendarInvite = createServerFn({ method: 'POST' })
  .inputValidator((input: AcceptCloudCalendarInviteInput) => input)
  .handler(async ({ data }) => {
    const { idToken, calendarId } = data

    if (!idToken || !calendarId) {
      return {
        ok: false,
        reason: 'missing-data',
      }
    }

    const user = await verifyGoogleIdToken(idToken)
    const profile = await getProfile(user.email)
    await upsertProfile(
      user,
      profileToAccountProfile(profile, user),
      profile?.theme ?? DEFAULT_THEME,
    )

    const calendars = await getCalendarsByIds([calendarId])

    if (!calendars.length) {
      return {
        ok: false,
        reason: 'calendar-not-found',
      }
    }

    await supabaseRequest<SupabaseMembershipRow[]>(
      'booknest_memberships?on_conflict=calendar_id,user_email',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify([
          {
            calendar_id: calendarId,
            user_email: user.email,
            role: calendars[0]!.owner_email === user.email ? 'owner' : 'member',
          },
        ]),
      },
    )

    await supabaseRequest<null>(
      `booknest_invites?calendar_id=eq.${encodeURIComponent(
        calendarId,
      )}&recipient_email=eq.${encodeURIComponent(user.email)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'accepted',
        }),
        allowEmpty: true,
      },
    )

    return {
      ok: true,
    }
  })

function supabaseConfig() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase backend is not configured.')
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  }
}

async function verifyGoogleIdToken(idToken: string) {
  const response = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`,
  )

  if (!response.ok) {
    throw new Error('Google sign-in expired. Please sign in again.')
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo
  const expectedAudience =
    process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID

  if (expectedAudience && tokenInfo.aud !== expectedAudience) {
    throw new Error('Google token audience does not match this app.')
  }

  if (!tokenInfo.email || tokenInfo.email_verified === 'false') {
    throw new Error('Google account email is not verified.')
  }

  return {
    email: tokenInfo.email.trim().toLowerCase(),
    sub: tokenInfo.sub ?? '',
    name: tokenInfo.name ?? tokenInfo.email.split('@')[0] ?? 'BookNest User',
    picture: tokenInfo.picture ?? null,
  }
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit & { allowEmpty?: boolean } = {},
) {
  const { url, serviceRoleKey } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase request failed: ${response.status} ${detail}`)
  }

  if (response.status === 204 || init.allowEmpty) {
    return null as T
  }

  const text = await response.text()
  if (!text) {
    return null as T
  }

  return JSON.parse(text) as T
}

async function getProfile(email: string) {
  const rows = await supabaseRequest<SupabaseProfileRow[]>(
    `booknest_profiles?email=eq.${encodeURIComponent(email)}&limit=1`,
  )

  return rows[0] ?? null
}

async function getMemberships(email: string) {
  return supabaseRequest<SupabaseMembershipRow[]>(
    `booknest_memberships?user_email=eq.${encodeURIComponent(email)}`,
  )
}

async function getOwnedCalendars(email: string) {
  return supabaseRequest<SupabaseCalendarRow[]>(
    `booknest_calendars?owner_email=eq.${encodeURIComponent(email)}`,
  )
}

async function getCalendarsByIds(calendarIds: string[]) {
  return supabaseRequest<SupabaseCalendarRow[]>(
    `booknest_calendars?id=in.(${calendarIds.map(encodeURIComponent).join(',')})`,
  )
}

async function getCalendarStates(calendarIds: string[]) {
  return supabaseRequest<SupabaseCalendarStateRow[]>(
    `booknest_calendar_state?calendar_id=in.(${calendarIds
      .map(encodeURIComponent)
      .join(',')})`,
  )
}

async function getPendingInvites(email: string) {
  return supabaseRequest<SupabaseInviteRow[]>(
    `booknest_invites?recipient_email=eq.${encodeURIComponent(
      email,
    )}&status=eq.pending&select=id,calendar_id,recipient_email,sender_name,created_at,booknest_calendars(name)`,
  )
}

async function upsertProfile(
  user: Awaited<ReturnType<typeof verifyGoogleIdToken>>,
  profile: AccountProfile,
  theme: AppTheme,
) {
  await supabaseRequest<SupabaseProfileRow[]>(
    'booknest_profiles?on_conflict=email',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([
        {
          email: user.email,
          google_sub: user.sub,
          username: profile.username || user.name,
          image_data: profile.imageData ?? user.picture,
          theme,
        },
      ]),
    },
  )
}

async function upsertOwnedCalendars(email: string, snapshot: BookNestSnapshot) {
  if (!snapshot.calendars.length) {
    return
  }

  await supabaseRequest<SupabaseCalendarRow[]>(
    'booknest_calendars?on_conflict=id',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(
        snapshot.calendars.map((calendar) => ({
          id: calendar.id,
          name: calendar.name,
          tint_index: calendar.tintIndex,
          owner_email: email,
        })),
      ),
    },
  )
}

async function upsertAcceptedMemberships(email: string, snapshot: BookNestSnapshot) {
  const memberships = [
    ...snapshot.calendars.map((calendar) => ({
      calendar_id: calendar.id,
      user_email: email,
      role: 'owner',
    })),
    ...snapshot.invitedCalendars.map((calendar) => ({
      calendar_id: calendar.id,
      user_email: email,
      role: 'member',
    })),
  ]

  if (!memberships.length) {
    return
  }

  await supabaseRequest<SupabaseMembershipRow[]>(
    'booknest_memberships?on_conflict=calendar_id,user_email',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(memberships),
    },
  )
}

async function upsertVisibleCalendarStates(email: string, snapshot: BookNestSnapshot) {
  const visibleCalendars = [...snapshot.calendars, ...snapshot.invitedCalendars]
  if (!visibleCalendars.length) {
    return
  }

  const memberships = await getMemberships(email)
  const accessibleCalendarIds = new Set([
    ...snapshot.calendars.map((calendar) => calendar.id),
    ...memberships.map((membership) => membership.calendar_id),
  ])
  const ownedCalendarIds = new Set(snapshot.calendars.map((calendar) => calendar.id))
  const existingStates = await getCalendarStates(
    visibleCalendars.map((calendar) => calendar.id),
  )
  const existingStateIds = new Set(
    existingStates.map((state) => state.calendar_id),
  )

  const rows = visibleCalendars
    .filter((calendar) => accessibleCalendarIds.has(calendar.id))
    .filter((calendar) => {
      if (ownedCalendarIds.has(calendar.id)) {
        return true
      }

      const hasLocalData =
        (snapshot.reservationsByCalendar[calendar.id]?.length ?? 0) > 0 ||
        Object.keys(snapshot.dayNotesByCalendar[calendar.id] ?? {}).length > 0 ||
        (snapshot.chatByCalendar[calendar.id]?.length ?? 0) > 0

      return hasLocalData || !existingStateIds.has(calendar.id)
    })
    .map((calendar) => ({
      calendar_id: calendar.id,
      reservations: snapshot.reservationsByCalendar[calendar.id] ?? [],
      day_notes: snapshot.dayNotesByCalendar[calendar.id] ?? {},
      chat: snapshot.chatByCalendar[calendar.id] ?? [],
    }))

  if (!rows.length) {
    return
  }

  await supabaseRequest<SupabaseCalendarStateRow[]>(
    'booknest_calendar_state?on_conflict=calendar_id',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    },
  )
}

async function deleteRemovedOwnedCalendars(email: string, snapshot: BookNestSnapshot) {
  const existing = await getOwnedCalendars(email)
  const retainedIds = new Set(snapshot.calendars.map((calendar) => calendar.id))
  const removed = existing.filter((calendar) => !retainedIds.has(calendar.id))

  await Promise.all(
    removed.map((calendar) =>
      supabaseRequest<null>(
        `booknest_calendars?id=eq.${encodeURIComponent(
          calendar.id,
        )}&owner_email=eq.${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          allowEmpty: true,
        },
      ),
    ),
  )
}

function profileToAccountProfile(
  profile: SupabaseProfileRow | null,
  user: Awaited<ReturnType<typeof verifyGoogleIdToken>>,
): AccountProfile {
  return {
    email: profile?.email ?? user.email,
    username: profile?.username ?? user.name,
    imageData: profile?.image_data ?? user.picture,
  }
}

function calendarRowToUserCalendar(calendar: SupabaseCalendarRow) {
  return {
    id: calendar.id,
    name: calendar.name,
    tintIndex: calendar.tint_index,
  }
}

function inviteRowToCalendarInvite(invite: SupabaseInviteRow): CalendarInvite {
  return {
    id: invite.id,
    calendarId: invite.calendar_id,
    calendarName: invite.booknest_calendars?.name ?? 'Shared calendar',
    recipient: invite.recipient_email,
    senderName: invite.sender_name,
    sentDate: invite.created_at,
  }
}
