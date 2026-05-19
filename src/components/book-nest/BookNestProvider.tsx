import {
  createContext,
  type ReactNode,
  startTransition,
  useContext,
  useEffect,
  useRef,
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
  createEmptySnapshot,
  createId,
  makeReplyReference,
  readSnapshot,
  saveSnapshot,
  sortCalendarsByName,
  THEME_PRESETS,
} from '#/lib/booknest'
import {
  acceptCloudCalendarInvite,
  clearCloudCalendarInvites,
  clearCloudErrorCalendars,
  deleteCloudCalendar,
  leaveCloudCalendar,
  loadCloudSnapshot,
  rejectCloudCalendarInvite,
  saveCloudSnapshot,
} from '#/lib/booknestCloud'
import {
  type CloudIssue,
  type CloudOperation,
  createCloudIssue,
  isTransientFetchError,
} from '#/lib/cloudDiagnostics'
import { clearGoogleSession, readGoogleIdToken } from '#/lib/googleSession'

type BookNestContextValue = {
  snapshot: BookNestSnapshot
  isBooting: boolean
  cloudStatus: 'local' | 'syncing' | 'synced' | 'error'
  cloudActivity: 'idle' | 'loading' | 'saving' | 'syncing'
  cloudError: string | null
  cloudIssue: CloudIssue | null
  refreshCloudData: (options?: { silent?: boolean }) => Promise<void>
  syncCloudData: () => Promise<boolean>
  dismissCloudError: () => void
  clearBrokenCloudCalendars: () => Promise<void>
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
const CLOUD_ERROR_DISMISS_MS = 5 * 60 * 1000

export function BookNestProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<BookNestSnapshot>(() => readSnapshot())
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudStatus, setCloudStatus] =
    useState<BookNestContextValue['cloudStatus']>('local')
  const [cloudActivity, setCloudActivity] =
    useState<BookNestContextValue['cloudActivity']>('idle')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [cloudIssue, setCloudIssue] = useState<CloudIssue | null>(null)
  const cloudSaveErrorLogged = useRef(false)
  const cloudLoadFailureCount = useRef(0)
  const cloudErrorDismissedUntil = useRef(0)
  const pendingLocalCloudSave = useRef(false)
  const cloudSaveSequence = useRef(0)
  const snapshotRef = useRef(snapshot)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  function clearCloudIssue(nextStatus: BookNestContextValue['cloudStatus'] = 'synced') {
    cloudLoadFailureCount.current = 0
    setCloudStatus(nextStatus)
    setCloudActivity('idle')
    setCloudError(null)
    setCloudIssue(null)
  }

  function isCloudErrorDismissed() {
    return Date.now() < cloudErrorDismissedUntil.current
  }

  function dismissCloudError() {
    cloudErrorDismissedUntil.current = Date.now() + CLOUD_ERROR_DISMISS_MS
    setCloudStatus('local')
    setCloudActivity('idle')
    setCloudError(null)
    setCloudIssue(null)
  }

  function reportCloudIssue(input: {
    error?: unknown
    fallback?: string
    message?: string
    operation: CloudOperation
  }) {
    const issue = createCloudIssue(input)
    setCloudStatus('error')
    setCloudActivity('idle')
    setCloudError(issue.message)
    setCloudIssue(issue)
    return issue
  }

  function reportCloudLoadFailure(error: unknown, silent: boolean) {
    cloudLoadFailureCount.current += 1

    if (isCloudErrorDismissed()) {
      setCloudStatus('local')
      setCloudActivity('idle')
      setCloudError(null)
      setCloudIssue(null)
      return
    }

    if (silent && isTransientFetchError(error) && cloudLoadFailureCount.current < 3) {
      setCloudStatus(snapshotRef.current.accountProfile ? 'synced' : 'local')
      setCloudActivity('idle')
      setCloudError(null)
      setCloudIssue(null)
      return
    }

    reportCloudIssue({
      error,
      fallback: 'Cloud sync failed.',
      operation: 'load',
    })
  }

  async function refreshCloudData(options: { silent?: boolean } = {}) {
    const { silent = false } = options
    const idToken = readGoogleIdToken()
    if (!idToken) {
      setCloudStatus('local')
      setCloudActivity('idle')
      return
    }

    if (silent && pendingLocalCloudSave.current) {
      return
    }

    if (!silent) {
      cloudErrorDismissedUntil.current = 0
      setCloudStatus('syncing')
      setCloudActivity('loading')
    }

    try {
      const result = await loadCloudSnapshot({
        data: {
          idToken,
          localSnapshot: snapshotRef.current,
        },
      })

      if (result.ok && result.snapshot) {
        setSnapshot(result.snapshot)
        clearCloudIssue('synced')
      } else {
        reportCloudIssue({
          message: 'Cloud sync could not load your BookNest data.',
          operation: 'load',
        })
      }
    } catch (error) {
      reportCloudLoadFailure(error, silent)
      console.error('[BookNest] Cloud load failed', error)
    }
  }

  async function syncCloudData() {
    const idToken = readGoogleIdToken()
    if (!idToken || !snapshotRef.current.accountProfile) {
      setCloudStatus('local')
      setCloudActivity('idle')
      return false
    }

    setCloudStatus('syncing')
    setCloudActivity('syncing')
    const saveId = ++cloudSaveSequence.current
    pendingLocalCloudSave.current = true

    try {
      const result = await saveCloudSnapshot({
        data: {
          idToken,
          snapshot: snapshotRef.current,
        },
      })

      if (!result.ok) {
        reportCloudIssue({
          message: 'Cloud sync could not save your BookNest data.',
          operation: 'save',
        })
        return false
      }

      clearCloudIssue('synced')
      return true
    } catch (error) {
      if (isCloudErrorDismissed()) {
        setCloudStatus('local')
        setCloudActivity('idle')
        setCloudError(null)
        setCloudIssue(null)
      } else {
        reportCloudIssue({
          error,
          fallback: 'Cloud sync failed.',
          operation: 'save',
        })
      }
      console.error('[BookNest] Cloud save failed', error)
      return false
    } finally {
      if (saveId === cloudSaveSequence.current) {
        pendingLocalCloudSave.current = false
        setCloudActivity('idle')
      }
    }
  }

  async function clearBrokenCloudCalendars() {
    const idToken = readGoogleIdToken()
    if (!idToken) {
      return
    }

    setCloudStatus('syncing')
    setCloudActivity('syncing')

    try {
      const result = await clearCloudErrorCalendars({
        data: {
          idToken,
          localSnapshot: snapshotRef.current,
        },
      })

      if (result.ok && result.snapshot) {
        setSnapshot(result.snapshot)
        saveSnapshot(result.snapshot)
        clearCloudIssue('synced')
      }
    } catch (error) {
      reportCloudIssue({
        error,
        fallback: 'Cloud cleanup failed.',
        operation: 'cleanup',
      })
    }
  }

  useEffect(() => {
    const localSnapshot = readSnapshot()
    const idToken = readGoogleIdToken()

    if (!idToken) {
      setSnapshot(localSnapshot)
      setCloudReady(true)
      return
    }

    let isCancelled = false

    async function loadCloudData() {
      await refreshCloudData()
      if (!isCancelled) {
        setCloudReady(true)
      }
    }

    void loadCloudData()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cloudReady) {
      return
    }

    const idToken = readGoogleIdToken()
    if (!idToken) {
      return
    }

    function handleFocus() {
      void refreshCloudData({ silent: true })
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshCloudData({ silent: true })
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [cloudReady])

  useEffect(() => {
    if (!cloudReady) {
      return
    }

    const idToken = readGoogleIdToken()
    if (!idToken) {
      return
    }

    const pollTimer = window.setInterval(() => {
      void refreshCloudData({ silent: true })
    }, 12000)

    return () => {
      window.clearInterval(pollTimer)
    }
  }, [cloudReady])

  useEffect(() => {
    applyThemeToDocument(snapshot.theme)
    saveSnapshot(snapshot)

    if (!cloudReady) {
      return
    }

    const idToken = readGoogleIdToken()
    if (!idToken || !snapshot.accountProfile) {
      return
    }

    const saveTimer = window.setTimeout(() => {
      const saveId = ++cloudSaveSequence.current
      pendingLocalCloudSave.current = true
      setCloudStatus('syncing')
      setCloudActivity('saving')
      void saveCloudSnapshot({
        data: {
          idToken,
          snapshot,
        },
      })
        .then((result) => {
          if (result.ok) {
            clearCloudIssue('synced')
          } else {
            reportCloudIssue({
              message: 'Cloud sync could not save your BookNest data.',
              operation: 'save',
            })
          }
        })
        .catch((error) => {
          if (isCloudErrorDismissed()) {
            setCloudStatus('local')
            setCloudActivity('idle')
            setCloudError(null)
            setCloudIssue(null)
          } else {
            reportCloudIssue({
              error,
              fallback: 'Cloud sync failed.',
              operation: 'save',
            })
          }
          if (!cloudSaveErrorLogged.current) {
            cloudSaveErrorLogged.current = true
            console.error('[BookNest] Cloud save failed', error)
          }
        })
        .finally(() => {
          if (saveId === cloudSaveSequence.current) {
            pendingLocalCloudSave.current = false
            setCloudActivity('idle')
          }
        })
    }, 650)

    return () => {
      window.clearTimeout(saveTimer)
    }
  }, [cloudReady, snapshot])

  const value: BookNestContextValue = {
    snapshot,
    isBooting: !cloudReady,
    cloudStatus,
    cloudActivity,
    cloudError,
    cloudIssue,
    refreshCloudData,
    syncCloudData,
    dismissCloudError,
    clearBrokenCloudCalendars,
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
      const accountProfile = {
        email: profile.email.trim(),
        username: profile.username.trim(),
        imageData: profile.imageData,
      }
      const idToken = readGoogleIdToken()

      if (idToken && !snapshotHasUserData(snapshotRef.current)) {
        const localSnapshot = {
          ...createEmptySnapshot(snapshotRef.current.theme),
          accountProfile,
        }

        setCloudReady(false)
        setCloudStatus('syncing')
        clearCloudIssue('syncing')
        setSnapshot(localSnapshot)

        void loadCloudSnapshot({
          data: {
            idToken,
            localSnapshot,
          },
        })
          .then((result) => {
            if (result.ok && result.snapshot) {
              setSnapshot(result.snapshot)
              clearCloudIssue('synced')
            } else {
              setSnapshot(localSnapshot)
              setCloudStatus('synced')
            }
          })
          .catch((error) => {
            setSnapshot(localSnapshot)
            reportCloudIssue({
              error,
              fallback: 'Cloud sync failed.',
              operation: 'sign-in',
            })
          })
          .finally(() => {
            setCloudReady(true)
          })

        return
      }

      setSnapshot((current) => ({
        ...current,
        accountProfile,
      }))
    },
    clearAccountProfile() {
      window.google?.accounts?.id?.disableAutoSelect()
      clearGoogleSession()
      setCloudReady(true)
      setCloudStatus('local')
      setCloudError(null)
      setCloudIssue(null)
      setSnapshot((current) => createEmptySnapshot(current.theme))
    },
    deleteCalendar(calendarId) {
      const idToken = readGoogleIdToken()
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

      if (idToken) {
        void deleteCloudCalendar({
          data: {
            idToken,
            calendarId,
          },
        })
          .then((result) => {
            if (!result.ok) {
              reportCloudIssue({
                message:
                  result.reason === 'not-owner'
                    ? 'Only the calendar owner can delete this cloud calendar.'
                    : 'Cloud calendar delete failed.',
                operation: 'save',
              })
              return
            }

            void refreshCloudData({ silent: true })
          })
          .catch((error) => {
            reportCloudIssue({
              error,
              fallback: 'Cloud calendar delete failed.',
              operation: 'save',
            })
          })
      }
    },
    leaveCalendar(calendarId) {
      const idToken = readGoogleIdToken()
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

      if (idToken) {
        void leaveCloudCalendar({
          data: {
            idToken,
            calendarId,
          },
        })
          .then((result) => {
            if (!result.ok) {
              reportCloudIssue({
                message:
                  result.reason === 'owner-cannot-leave'
                    ? 'Owners need to delete a calendar instead of leaving it.'
                    : 'Cloud calendar leave failed.',
                operation: 'save',
              })
              return
            }

            void refreshCloudData({ silent: true })
          })
          .catch((error) => {
            reportCloudIssue({
              error,
              fallback: 'Cloud calendar leave failed.',
              operation: 'save',
            })
          })
      }
    },
    acceptInvite(inviteId) {
      const acceptedInvite = snapshot.invites.find((entry) => entry.id === inviteId)
      const idToken = readGoogleIdToken()

      if (acceptedInvite?.calendarId && !idToken) {
        reportCloudIssue({
          message: 'Sign in with Google before accepting shared calendar invites.',
          operation: 'accept-invite',
        })
        return
      }

      if (idToken && acceptedInvite?.calendarId) {
        const restoreInvite = () => {
          setSnapshot((current) =>
            current.invites.some((entry) => entry.id === acceptedInvite.id)
              ? current
              : {
                  ...current,
                  invites: [acceptedInvite, ...current.invites],
                },
          )
        }

        setSnapshot((current) => ({
          ...current,
          invites: current.invites.filter((entry) => entry.id !== inviteId),
        }))

        void acceptCloudCalendarInvite({
          data: {
            idToken,
            calendarId: acceptedInvite.calendarId,
          },
        })
          .then((result) => {
            if (!result.ok) {
              restoreInvite()
              reportCloudIssue({
                message:
                  result.reason === 'calendar-not-found'
                    ? 'This invite link is not ready in cloud storage yet. Ask the owner to create a fresh invite link.'
                    : 'Cloud invite accept failed.',
                operation: 'accept-invite',
              })
              return
            }

            return loadCloudSnapshot({
              data: {
                idToken,
                localSnapshot: readSnapshot(),
              },
            })
          })
          .then((result) => {
            if (result?.ok && result.snapshot) {
              setSnapshot(result.snapshot)
              clearCloudIssue('synced')
            }
          })
          .catch((error) => {
            restoreInvite()
            reportCloudIssue({
              error,
              fallback: 'Cloud invite accept failed.',
              operation: 'accept-invite',
            })
            console.error('[BookNest] Cloud invite accept failed', error)
          })

        return
      }

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
      const idToken = readGoogleIdToken()
      setSnapshot((current) => ({
        ...current,
        invites: current.invites.filter((invite) => invite.id !== inviteId),
      }))

      if (idToken) {
        void rejectCloudCalendarInvite({
          data: {
            idToken,
            inviteId,
          },
        })
          .then(() => {
            void refreshCloudData({ silent: true })
          })
          .catch((error) => {
            reportCloudIssue({
              error,
              fallback: 'Cloud invite reject failed.',
              operation: 'accept-invite',
            })
          })
      }
    },
    clearInvites() {
      const idToken = readGoogleIdToken()
      setSnapshot((current) => ({
        ...current,
        invites: [],
      }))

      if (idToken) {
        void clearCloudCalendarInvites({
          data: {
            idToken,
            localSnapshot: snapshotRef.current,
          },
        })
          .then(() => {
            void refreshCloudData({ silent: true })
          })
          .catch((error) => {
            reportCloudIssue({
              error,
              fallback: 'Cloud invite cleanup failed.',
              operation: 'cleanup',
            })
          })
      }
    },
    createInvite(calendarId, calendarName, recipient, senderName) {
      const normalizedRecipient = recipient.trim().toLowerCase()
      if (!normalizedRecipient) {
        return
      }

      setSnapshot((current) => {
        const remainingInvites = current.invites.filter(
          (invite) =>
            invite.calendarId !== calendarId ||
            invite.recipient.trim().toLowerCase() !== normalizedRecipient,
        )

        return {
          ...current,
          invites: [
            {
              id: createId(),
              calendarId,
              calendarName,
              recipient: normalizedRecipient,
              senderName: senderName.trim() || 'Someone',
              sentDate: new Date().toISOString(),
            },
            ...remainingInvites,
          ],
        }
      })
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
              ? {
                  ...message,
                  reactions: message.reactions.includes(reaction)
                    ? message.reactions
                    : [...message.reactions, reaction],
                }
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

function snapshotHasUserData(snapshot: BookNestSnapshot) {
  return (
    snapshot.calendars.length > 0 ||
    snapshot.invitedCalendars.length > 0 ||
    snapshot.invites.length > 0 ||
    Object.keys(snapshot.reservationsByCalendar).length > 0 ||
    Object.keys(snapshot.dayNotesByCalendar).length > 0 ||
    Object.keys(snapshot.chatByCalendar).length > 0
  )
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
