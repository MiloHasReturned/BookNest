import { describe, expect, it } from 'vitest'
import {
  type AccountProfile,
  type BookNestSnapshot,
  type CalendarReservation,
  DEFAULT_THEME,
  calendarAccess,
  canManageReservation,
  findReservationConflict,
  reservationRangesOverlap,
} from './booknest'

const profile: AccountProfile = {
  email: 'owner@example.com',
  username: 'Owner',
  imageData: null,
}

function reservation(
  id: string,
  date: string,
  endDate: string | null = null,
  createdByEmail: string | null = null,
): CalendarReservation {
  return {
    id,
    title: `Reservation ${id}`,
    person: createdByEmail === profile.email ? profile.username : 'Someone Else',
    time: 'All day',
    date,
    endDate,
    imageData: null,
    colorIndex: 0,
    createdByEmail,
  }
}

function snapshot(): BookNestSnapshot {
  return {
    accountProfile: profile,
    calendars: [{ id: 'owned-calendar', name: 'Owned', tintIndex: 0 }],
    invitedCalendars: [{ id: 'shared-calendar', name: 'Shared', tintIndex: 1 }],
    invites: [],
    reservationsByCalendar: {},
    dayNotesByCalendar: {},
    chatByCalendar: {},
    theme: DEFAULT_THEME,
  }
}

describe('reservation conflict checks', () => {
  it('detects overlaps across single-day and multi-day reservations', () => {
    expect(
      reservationRangesOverlap(
        reservation('a', '2026-05-26', '2026-05-28'),
        reservation('b', '2026-05-28'),
      ),
    ).toBe(true)

    expect(
      reservationRangesOverlap(
        reservation('a', '2026-05-26', '2026-05-28'),
        reservation('b', '2026-05-29'),
      ),
    ).toBe(false)
  })

  it('ignores the reservation being edited when finding conflicts', () => {
    const existing = reservation('existing', '2026-05-26', '2026-05-28')

    expect(findReservationConflict([existing], existing)).toBeNull()
    expect(
      findReservationConflict([existing], reservation('new', '2026-05-27')),
    ).toBe(existing)
  })
})

describe('calendar permissions', () => {
  it('derives owner, member, and missing access from the snapshot', () => {
    const current = snapshot()

    expect(calendarAccess(current, 'owned-calendar')).toBe('owner')
    expect(calendarAccess(current, 'shared-calendar')).toBe('member')
    expect(calendarAccess(current, 'missing-calendar')).toBe('none')
  })

  it('lets owners manage any reservation and members manage their own', () => {
    expect(
      canManageReservation({
        access: 'owner',
        profile,
        reservation: reservation('other', '2026-05-26', null, 'other@example.com'),
      }),
    ).toBe(true)

    expect(
      canManageReservation({
        access: 'member',
        profile,
        reservation: reservation('mine', '2026-05-26', null, profile.email),
      }),
    ).toBe(true)

    expect(
      canManageReservation({
        access: 'member',
        profile,
        reservation: reservation('other', '2026-05-26', null, 'other@example.com'),
      }),
    ).toBe(false)
  })
})
