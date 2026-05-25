export type ThemeColor = string

export type BackgroundAnimationStyle =
  | 'softGlow'
  | 'aquaOrbit'
  | 'neonPulse'
  | 'emberGlow'
  | 'auroraBloom'
  | 'retroSpark'
  | 'twilightPulse'
  | 'sunsetWave'
  | 'peachDrift'
  | 'prismStorm'
  | 'ribbonFlux'
  | 'starlitConfetti'
  | 'geoDrift'
  | 'kaleidoscope'
  | 'monsoonMatrix'
  | 'mandelbloom'
  | 'crystalFractal'
  | 'fernSignal'
  | 'hologramMesh'
  | 'quantumGrid'
  | 'orbitalBlueprint'
  | 'editorialPaper'
  | 'executiveMist'
  | 'graphiteHalo'

export type AppTheme = {
  backgroundTop: ThemeColor
  backgroundBottom: ThemeColor
  card: ThemeColor
  box: ThemeColor
  text: ThemeColor
  borderStart: ThemeColor
  borderMid: ThemeColor
  borderEnd: ThemeColor
  accent: ThemeColor
  animationStyle: BackgroundAnimationStyle
}

export type ThemePreset = {
  name: string
  theme: AppTheme
}

export type UserCalendar = {
  id: string
  name: string
  tintIndex: number
}

export type AccountProfile = {
  email: string
  username: string
  imageData: string | null
}

export type CalendarInvite = {
  id: string
  calendarName: string
  calendarId: string | null
  recipient: string
  senderName: string
  sentDate: string
}

export type CalendarReservation = {
  id: string
  title: string
  person: string
  time: string
  date: string
  endDate: string | null
  imageData: string | null
  colorIndex: number
  createdByEmail?: string | null
}

export type ReplyReference = {
  id: string
  senderName: string
  preview: string
}

export type ChatMessage = {
  id: string
  senderName: string
  text: string
  timestamp: string
  imageData: string | null
  replyTo: ReplyReference | null
  reactions: string[]
}

export type BookNestSnapshot = {
  accountProfile: AccountProfile | null
  calendars: UserCalendar[]
  invitedCalendars: UserCalendar[]
  invites: CalendarInvite[]
  reservationsByCalendar: Record<string, CalendarReservation[]>
  dayNotesByCalendar: Record<string, Record<string, string>>
  chatByCalendar: Record<string, ChatMessage[]>
  theme: AppTheme
}

export type UpcomingReservationItem = {
  id: string
  calendarId: string
  calendarName: string
  title: string
  person: string
  time: string
  date: string
  endDate: string
  imageData: string | null
  tintIndex: number
}

export const STORAGE_KEY = 'booknest.snapshot.v2'

export const CALENDAR_TINTS = [
  '#f8bcd6',
  '#baf2d5',
  '#b3edf7',
  '#f28c59',
  '#2b8398',
]

export const BACKGROUND_ANIMATION_STYLES: Array<{
  id: BackgroundAnimationStyle
  label: string
}> = [
  { id: 'softGlow', label: 'Velvet Glow' },
  { id: 'aquaOrbit', label: 'Tide Orbit' },
  { id: 'neonPulse', label: 'Neon Circuit' },
  { id: 'emberGlow', label: 'Ember Hearth' },
  { id: 'auroraBloom', label: 'Aurora Veil' },
  { id: 'retroSpark', label: 'Retro Soda' },
  { id: 'twilightPulse', label: 'Twilight Pulse' },
  { id: 'sunsetWave', label: 'Golden Hour' },
  { id: 'peachDrift', label: 'Peach Cloud' },
  { id: 'prismStorm', label: 'Prism Shards' },
  { id: 'ribbonFlux', label: 'Ribbon Current' },
  { id: 'starlitConfetti', label: 'Star Confetti' },
  { id: 'geoDrift', label: 'Geo Drift' },
  { id: 'kaleidoscope', label: 'Kaleidoscope Glass' },
  { id: 'monsoonMatrix', label: 'Monsoon Code' },
  { id: 'mandelbloom', label: 'Mandelbloom' },
  { id: 'crystalFractal', label: 'Crystal Fractal' },
  { id: 'fernSignal', label: 'Fern Signal' },
  { id: 'hologramMesh', label: 'Hologram Mesh' },
  { id: 'quantumGrid', label: 'Quantum Grid' },
  { id: 'orbitalBlueprint', label: 'Orbital Blueprint' },
  { id: 'editorialPaper', label: 'Editorial Paper' },
  { id: 'executiveMist', label: 'Executive Mist' },
  { id: 'graphiteHalo', label: 'Graphite Halo' },
]

export const DEFAULT_THEME: AppTheme = {
  backgroundTop: '#f0e5d6',
  backgroundBottom: '#ddeef7',
  card: '#ffffff',
  box: '#f7fbfc',
  text: '#0f141f',
  borderStart: '#f8bcd6',
  borderMid: '#baf2d5',
  borderEnd: '#b3edf7',
  accent: '#70ebf5',
  animationStyle: 'softGlow',
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: 'Pastel Breeze', theme: DEFAULT_THEME },
  {
    name: 'Midnight',
    theme: {
      backgroundTop: '#141720',
      backgroundBottom: '#1d2330',
      card: '#232933',
      box: '#2b313d',
      text: '#edf0f9',
      borderStart: '#7fb3f2',
      borderMid: '#99e6d9',
      borderEnd: '#f3a9bf',
      accent: '#8ecbff',
      animationStyle: 'twilightPulse',
    },
  },
  {
    name: 'Cool Gradient',
    theme: {
      backgroundTop: '#d1e6fa',
      backgroundBottom: '#c7dcf5',
      card: '#fafdff',
      box: '#eef7ff',
      text: '#0d1220',
      borderStart: '#8fd6f5',
      borderMid: '#aef0df',
      borderEnd: '#e9d2ff',
      accent: '#8fd6f5',
      animationStyle: 'aquaOrbit',
    },
  },
  {
    name: 'Peach',
    theme: {
      backgroundTop: '#fce5d1',
      backgroundBottom: '#f4d1e4',
      card: '#fff8f1',
      box: '#fff1e7',
      text: '#2c1614',
      borderStart: '#f8c38c',
      borderMid: '#f49aac',
      borderEnd: '#ccabf7',
      accent: '#f8c38c',
      animationStyle: 'peachDrift',
    },
  },
  {
    name: 'Vibrant Sunset',
    theme: {
      backgroundTop: '#f7ba73',
      backgroundBottom: '#e35c77',
      card: '#fff4ea',
      box: '#ffe8da',
      text: '#331513',
      borderStart: '#ff9e38',
      borderMid: '#ff5f85',
      borderEnd: '#f8ca57',
      accent: '#ff9e38',
      animationStyle: 'sunsetWave',
    },
  },
  {
    name: 'Neon Night',
    theme: {
      backgroundTop: '#0b1028',
      backgroundBottom: '#131740',
      card: '#1a214a',
      box: '#1d2554',
      text: '#ebfaff',
      borderStart: '#1ae6ff',
      borderMid: '#ca50ff',
      borderEnd: '#47ffaf',
      accent: '#1ae6ff',
      animationStyle: 'neonPulse',
    },
  },
  {
    name: 'Neo Lime',
    theme: {
      backgroundTop: '#2a3a2a',
      backgroundBottom: '#162319',
      card: '#263327',
      box: '#2d3a2d',
      text: '#f0ffef',
      borderStart: '#c5ff4b',
      borderMid: '#1df6a6',
      borderEnd: '#57aefc',
      accent: '#c5ff4b',
      animationStyle: 'neonPulse',
    },
  },
  {
    name: 'Neo Violet',
    theme: {
      backgroundTop: '#20153a',
      backgroundBottom: '#35184a',
      card: '#322048',
      box: '#382554',
      text: '#f7f2ff',
      borderStart: '#8c63ff',
      borderMid: '#55e4ff',
      borderEnd: '#ff6ac6',
      accent: '#8c63ff',
      animationStyle: 'neonPulse',
    },
  },
  {
    name: 'Neo Coral',
    theme: {
      backgroundTop: '#351f1f',
      backgroundBottom: '#431f35',
      card: '#43262b',
      box: '#4e2d31',
      text: '#fff6ef',
      borderStart: '#ff7d70',
      borderMid: '#ffcc59',
      borderEnd: '#ff75b3',
      accent: '#ff7d70',
      animationStyle: 'emberGlow',
    },
  },
  {
    name: 'Aurora',
    theme: {
      backgroundTop: '#0d2231',
      backgroundBottom: '#113736',
      card: '#173432',
      box: '#1a3c39',
      text: '#ebfff9',
      borderStart: '#45ffcf',
      borderMid: '#89ff63',
      borderEnd: '#65a8ff',
      accent: '#45ffcf',
      animationStyle: 'auroraBloom',
    },
  },
  {
    name: 'Retro Pop',
    theme: {
      backgroundTop: '#fae16b',
      backgroundBottom: '#f88e52',
      card: '#fff4df',
      box: '#ffe8d1',
      text: '#2e1b12',
      borderStart: '#f22c65',
      borderMid: '#2fb1f4',
      borderEnd: '#ffd447',
      accent: '#f22c65',
      animationStyle: 'retroSpark',
    },
  },
]

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function clampTintIndex(index: number) {
  return Math.max(0, Math.min(index, CALENDAR_TINTS.length - 1))
}

export function getCalendarTint(tintIndex: number) {
  return CALENDAR_TINTS[clampTintIndex(tintIndex)]
}

export function sortCalendarsByName(calendars: UserCalendar[]) {
  return [...calendars].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  )
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function todayKey() {
  return formatDateKey(new Date())
}

export function addDaysToKey(dateKey: string, days: number) {
  const next = parseDateKey(dateKey)
  next.setDate(next.getDate() + days)
  return formatDateKey(next)
}

export function resolvedEndDate(reservation: CalendarReservation) {
  return reservation.endDate ?? reservation.date
}

export function reservationIncludesDate(
  reservation: CalendarReservation,
  dateKey: string,
) {
  return dateKey >= reservation.date && dateKey <= resolvedEndDate(reservation)
}

export function reservationSpansMultipleDays(reservation: CalendarReservation) {
  return resolvedEndDate(reservation) > reservation.date
}

export function reservationRangesOverlap(
  left: Pick<CalendarReservation, 'date' | 'endDate'>,
  right: Pick<CalendarReservation, 'date' | 'endDate'>,
) {
  return left.date <= rangeEndDate(right) && rangeEndDate(left) >= right.date
}

export function findReservationConflict(
  reservations: CalendarReservation[],
  candidate: CalendarReservation,
) {
  return reservations.find(
    (reservation) =>
      reservation.id !== candidate.id && reservationRangesOverlap(reservation, candidate),
  ) ?? null
}

export function calendarAccess(
  snapshot: Pick<BookNestSnapshot, 'calendars' | 'invitedCalendars'>,
  calendarId: string,
) {
  if (snapshot.calendars.some((calendar) => calendar.id === calendarId)) {
    return 'owner'
  }

  if (snapshot.invitedCalendars.some((calendar) => calendar.id === calendarId)) {
    return 'member'
  }

  return 'none'
}

export function canManageReservation({
  access,
  profile,
  reservation,
}: {
  access: 'owner' | 'member' | 'none'
  profile: AccountProfile | null
  reservation: CalendarReservation
}) {
  if (access === 'owner') {
    return true
  }

  if (access !== 'member' || !profile) {
    return false
  }

  const profileEmail = profile.email.trim().toLowerCase()
  const reservationEmail = reservation.createdByEmail?.trim().toLowerCase()

  if (profileEmail && reservationEmail) {
    return profileEmail === reservationEmail
  }

  return reservation.person.trim().toLowerCase() === profile.username.trim().toLowerCase()
}

function rangeEndDate(range: Pick<CalendarReservation, 'date' | 'endDate'>) {
  return range.endDate ?? range.date
}

export function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDayTitle(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(dateKey))
}

export function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(dateKey))
}

export function formatRange(startDate: string, endDate: string) {
  const startText = formatShortDate(startDate)
  const endText = formatShortDate(endDate)
  return startText === endText ? startText : `${startText}-${endText}`
}

export function formatChatTime(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function weekdaySymbols() {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
}

export function buildMonthGrid(displayedMonth: Date) {
  const year = displayedMonth.getFullYear()
  const month = displayedMonth.getMonth()
  const startOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = startOfMonth.getDay()
  const cells: Array<string | null> = Array.from({ length: offset }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(formatDateKey(new Date(year, month, day)))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function makeReplyReference(message: ChatMessage): ReplyReference {
  return {
    id: message.id,
    senderName: message.senderName,
    preview: message.text.slice(0, 80),
  }
}

export function computeUpcomingReservations(snapshot: BookNestSnapshot) {
  const horizon = addDaysToKey(todayKey(), 14)
  const calendars = [...snapshot.calendars, ...snapshot.invitedCalendars]
  const items: UpcomingReservationItem[] = []

  for (const calendar of calendars) {
    const reservations = snapshot.reservationsByCalendar[calendar.id] ?? []
    for (const reservation of reservations) {
      const reservationEnd = resolvedEndDate(reservation)
      if (reservation.date <= horizon && reservationEnd >= todayKey()) {
        items.push({
          id: reservation.id,
          calendarId: calendar.id,
          calendarName: calendar.name,
          title: reservation.title,
          person: reservation.person,
          time: reservation.time,
          date: reservation.date,
          endDate: reservationEnd,
          imageData: reservation.imageData,
          tintIndex: calendar.tintIndex,
        })
      }
    }
  }

  return items.sort((left, right) => left.date.localeCompare(right.date))
}

export function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.style.setProperty('--theme-bg-top', theme.backgroundTop)
  root.style.setProperty('--theme-bg-bottom', theme.backgroundBottom)
  root.style.setProperty('--theme-card', theme.card)
  root.style.setProperty('--theme-box', theme.box)
  root.style.setProperty('--theme-text', theme.text)
  root.style.setProperty('--theme-border-start', theme.borderStart)
  root.style.setProperty('--theme-border-mid', theme.borderMid)
  root.style.setProperty('--theme-border-end', theme.borderEnd)
  root.style.setProperty('--theme-accent', theme.accent)
  root.dataset.animationStyle = theme.animationStyle
}

export function createEmptySnapshot(theme: AppTheme = DEFAULT_THEME): BookNestSnapshot {
  return {
    accountProfile: null,
    calendars: [],
    invitedCalendars: [],
    invites: [],
    reservationsByCalendar: {},
    dayNotesByCalendar: {},
    chatByCalendar: {},
    theme,
  }
}

export function readSnapshot() {
  if (typeof window === 'undefined') {
    return createEmptySnapshot()
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return createEmptySnapshot()
    }

    const parsed = JSON.parse(stored) as Partial<BookNestSnapshot>
    return normalizeSnapshot(parsed)
  } catch {
    return createEmptySnapshot()
  }
}

export function saveSnapshot(snapshot: BookNestSnapshot) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (error) {
    console.warn('[BookNest] Could not save local snapshot.', error)
  }
}

export function normalizeSnapshot(snapshot: Partial<BookNestSnapshot>): BookNestSnapshot {
  const demo = createEmptySnapshot()

  return {
    accountProfile: snapshot.accountProfile ?? demo.accountProfile,
    calendars: sortCalendarsByName(snapshot.calendars ?? demo.calendars),
    invitedCalendars: sortCalendarsByName(
      snapshot.invitedCalendars ?? demo.invitedCalendars,
    ),
    invites: snapshot.invites ?? demo.invites,
    reservationsByCalendar:
      snapshot.reservationsByCalendar ?? demo.reservationsByCalendar,
    dayNotesByCalendar: snapshot.dayNotesByCalendar ?? demo.dayNotesByCalendar,
    chatByCalendar: snapshot.chatByCalendar ?? demo.chatByCalendar,
    theme: snapshot.theme ?? demo.theme,
  }
}
