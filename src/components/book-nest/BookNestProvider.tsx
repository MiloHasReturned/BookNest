import {
  createContext,
  type ReactNode,
  startTransition,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  type AccountProfile,
  type AppTheme,
  type BackgroundAnimationStyle,
  type BookNestSnapshot,
  type CalendarReservation,
  type ChatMessage,
  type ThemeColor,
  type UserCalendar,
  applyThemeToDocument,
  clampTintIndex,
  createId,
  makeReplyReference,
  readSnapshot,
  saveSnapshot,
  sortCalendarsByName,
  THEME_PRESETS,
} from '#/lib/booknest'

type BookNestContextValue = {
  snapshot: BookNestSnapshot
  createCalendar: (name: string, tintIndex: number) => void
  saveAccountProfile: (profile: AccountProfile) => void
  clearAccountProfile: () => void
  deleteCalendar: (calendarId: string) => void
  leaveCalendar: (calendarId: string) => void
  acceptInvite: (inviteId: string) => void
  rejectInvite: (inviteId: string) => void
  clearInvites: () => void
  createInvite: (
    calendarId: string,
    calendarName: string,
    recipient: string,
    senderName: string,
  ) => void
  upsertReservation: (calendarId: string, reservation: CalendarReservation) => void
  removeReservation: (calendarId: string, reservationId: string) => void
  updateDayNote: (calendarId: string, dateKey: string, note: string) => void
  sendMessage: (
    calendarId: string,
    senderName: string,
    text: string,
    imageData: string | null,
    replyTo: ChatMessage | null,
  ) => void
  addReaction: (calendarId: string, messageId: string, reaction: string) => void
  applyPreset: (presetName: string) => void
  resetTheme: () => void
  setThemeColor: (key: keyof ColorEditableThemeKeys, value: ThemeColor) => void
  setAnimationStyle: (animationStyle: BackgroundAnimationStyle) => void
}

type ColorEditableThemeKeys = Pick<
  AppTheme,
  | 'backgroundTop'
  | 'backgroundBottom'
  | 'card'
  | 'box'
  | 'text'
  | 'borderStart'
  | 'borderMid'
  | 'borderEnd'
  | 'accent'
>

const BookNestContext = createContext<BookNestContextValue | null>(null)

export function BookNestProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<BookNestSnapshot>(() => readSnapshot())

  useEffect(() => {
    setSnapshot(readSnapshot())
  }, [])

  useEffect(() => {
    applyThemeToDocument(snapshot.theme)
    saveSnapshot(snapshot)
  }, [snapshot])

  const value: BookNestContextValue = {
    snapshot,
    createCalendar(name, tintIndex) {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return
      }

      setSnapshot((current) => ({
        ...current,
        calendars: sortCalendarsByName([
          ...current.calendars,
          {
            id: createId(),
            name: trimmedName,
            tintIndex: clampTintIndex(tintIndex),
          },
        ]),
      }))
    },
    saveAccountProfile(profile) {
      setSnapshot((current) => ({
        ...current,
        accountProfile: {
          email: profile.email.trim(),
          username: profile.username.trim(),
          imageData: profile.imageData,
        },
      }))
    },
    clearAccountProfile() {
      window.google?.accounts?.id?.disableAutoSelect()
      setSnapshot((current) => ({
        ...current,
        accountProfile: null,
      }))
    },
    deleteCalendar(calendarId) {
      setSnapshot((current) => {
        const retainedInvites = current.invites.filter(
          (invite) => invite.calendarId !== calendarId,
        )
        const { [calendarId]: _deletedReservations, ...reservationsByCalendar } =
          current.reservationsByCalendar
        const { [calendarId]: _deletedNotes, ...dayNotesByCalendar } =
          current.dayNotesByCalendar
        const { [calendarId]: _deletedChat, ...chatByCalendar } =
          current.chatByCalendar

        return {
          ...current,
          calendars: current.calendars.filter((calendar) => calendar.id !== calendarId),
          invitedCalendars: current.invitedCalendars.filter(
            (calendar) => calendar.id !== calendarId,
          ),
          invites: retainedInvites,
          reservationsByCalendar,
          dayNotesByCalendar,
          chatByCalendar,
        }
      })
    },
    leaveCalendar(calendarId) {
      setSnapshot((current) => {
        const { [calendarId]: _deletedReservations, ...reservationsByCalendar } =
          current.reservationsByCalendar
        const { [calendarId]: _deletedNotes, ...dayNotesByCalendar } =
          current.dayNotesByCalendar
        const { [calendarId]: _deletedChat, ...chatByCalendar } =
          current.chatByCalendar

        return {
          ...current,
          invitedCalendars: current.invitedCalendars.filter(
            (calendar) => calendar.id !== calendarId,
          ),
          reservationsByCalendar,
          dayNotesByCalendar,
          chatByCalendar,
        }
      })
    },
    acceptInvite(inviteId) {
      setSnapshot((current) => {
        const invite = current.invites.find((entry) => entry.id === inviteId)
        if (!invite) {
          return current
        }

        const calendarId = invite.calendarId ?? createId()
        const exists = current.invitedCalendars.some(
          (calendar) => calendar.id === calendarId,
        )
        const invitedCalendars = exists
          ? current.invitedCalendars
          : sortCalendarsByName([
              ...current.invitedCalendars,
              {
                id: calendarId,
                name: invite.calendarName,
                tintIndex: 4,
              },
            ])

        return {
          ...current,
          invitedCalendars,
          invites: current.invites.filter((entry) => entry.id !== inviteId),
        }
      })
    },
    rejectInvite(inviteId) {
      setSnapshot((current) => ({
        ...current,
        invites: current.invites.filter((invite) => invite.id !== inviteId),
      }))
    },
    clearInvites() {
      setSnapshot((current) => ({
        ...current,
        invites: [],
      }))
    },
    createInvite(calendarId, calendarName, recipient, senderName) {
      const trimmedRecipient = recipient.trim()
      if (!trimmedRecipient) {
        return
      }

      setSnapshot((current) => ({
        ...current,
        invites: [
          {
            id: createId(),
            calendarId,
            calendarName,
            recipient: trimmedRecipient,
            senderName: senderName.trim() || 'Someone',
            sentDate: new Date().toISOString(),
          },
          ...current.invites,
        ],
      }))
    },
    upsertReservation(calendarId, reservation) {
      setSnapshot((current) => {
        const existing = current.reservationsByCalendar[calendarId] ?? []
        const next = existing.some((entry) => entry.id === reservation.id)
          ? existing.map((entry) =>
              entry.id === reservation.id ? reservation : entry,
            )
          : [reservation, ...existing]

        return {
          ...current,
          reservationsByCalendar: {
            ...current.reservationsByCalendar,
            [calendarId]: next,
          },
        }
      })
    },
    removeReservation(calendarId, reservationId) {
      setSnapshot((current) => ({
        ...current,
        reservationsByCalendar: {
          ...current.reservationsByCalendar,
          [calendarId]: (current.reservationsByCalendar[calendarId] ?? []).filter(
            (reservation) => reservation.id !== reservationId,
          ),
        },
      }))
    },
    updateDayNote(calendarId, dateKey, note) {
      setSnapshot((current) => {
        const trimmedNote = note.trim()
        const calendarNotes = { ...(current.dayNotesByCalendar[calendarId] ?? {}) }

        if (!trimmedNote) {
          delete calendarNotes[dateKey]
        } else {
          calendarNotes[dateKey] = trimmedNote
        }

        return {
          ...current,
          dayNotesByCalendar: {
            ...current.dayNotesByCalendar,
            [calendarId]: calendarNotes,
          },
        }
      })
    },
    sendMessage(calendarId, senderName, text, imageData, replyTo) {
      const trimmedText = text.trim()
      if (!trimmedText) {
        return
      }

      setSnapshot((current) => ({
        ...current,
        chatByCalendar: {
          ...current.chatByCalendar,
          [calendarId]: [
            ...(current.chatByCalendar[calendarId] ?? []),
            {
              id: createId(),
              senderName: senderName.trim() || 'Someone',
              text: trimmedText,
              timestamp: new Date().toISOString(),
              imageData,
              replyTo: replyTo ? makeReplyReference(replyTo) : null,
              reactions: [],
            },
          ],
        },
      }))
    },
    addReaction(calendarId, messageId, reaction) {
      setSnapshot((current) => ({
        ...current,
        chatByCalendar: {
          ...current.chatByCalendar,
          [calendarId]: (current.chatByCalendar[calendarId] ?? []).map((message) =>
            message.id === messageId
              ? { ...message, reactions: [...message.reactions, reaction] }
              : message,
          ),
        },
      }))
    },
    applyPreset(presetName) {
      const preset = THEME_PRESETS.find((entry) => entry.name === presetName)
      if (!preset) {
        return
      }

      startTransition(() => {
        setSnapshot((current) => ({
          ...current,
          theme: preset.theme,
        }))
      })
    },
    resetTheme() {
      startTransition(() => {
        setSnapshot((current) => ({
          ...current,
          theme: THEME_PRESETS[0]!.theme,
        }))
      })
    },
    setThemeColor(key, value) {
      setSnapshot((current) => ({
        ...current,
        theme: {
          ...current.theme,
          [key]: value,
        },
      }))
    },
    setAnimationStyle(animationStyle) {
      setSnapshot((current) => ({
        ...current,
        theme: {
          ...current.theme,
          animationStyle,
        },
      }))
    },
  }

  return (
    <BookNestContext.Provider value={value}>{children}</BookNestContext.Provider>
  )
}

export function useBookNest() {
  const context = useContext(BookNestContext)
  if (!context) {
    throw new Error('useBookNest must be used inside BookNestProvider')
  }

  return context
}

export function makeReservation(input: {
  id?: string
  title: string
  person: string
  time: string
  date: string
  endDate: string
  imageData: string | null
  colorIndex: number
}) {
  return {
    id: input.id ?? createId(),
    title: input.title.trim(),
    person: input.person.trim(),
    time: input.time.trim() || 'All day',
    date: input.date,
    endDate: input.endDate,
    imageData: input.imageData,
    colorIndex: input.colorIndex,
  }
}

export function findCalendar(
  calendars: UserCalendar[],
  invitedCalendars: UserCalendar[],
  calendarId: string,
) {
  return [...calendars, ...invitedCalendars].find(
    (calendar) => calendar.id === calendarId,
  )
}
