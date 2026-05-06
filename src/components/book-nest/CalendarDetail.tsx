import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  MessageCircleReply,
  Paperclip,
  PartyPopper,
  PlusCircle,
  Send,
  SmilePlus,
  UserPlus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  findCalendar,
  makeReservation,
  useBookNest,
} from '#/components/book-nest/BookNestProvider'
import { AnimatedBackdrop } from '#/components/book-nest/AnimatedBackdrop'
import {
  type ChatMessage,
  type CalendarReservation,
  buildMonthGrid,
  formatChatTime,
  formatDayTitle,
  formatMonthTitle,
  formatRange,
  formatShortDate,
  getCalendarTint,
  reservationIncludesDate,
  reservationSpansMultipleDays,
  resolvedEndDate,
  weekdaySymbols,
} from '#/lib/booknest'
import { createCalendarInviteUrl } from '#/lib/inviteLinks'

const REACTIONS = ['👍', '🔥', '✅', '🎉', '❤️', '👀']

export function BookNestCalendarDetail({
  calendarId,
}: {
  calendarId: string
}) {
  const {
    snapshot,
    addReaction,
    removeReservation,
    sendMessage,
    updateDayNote,
    upsertReservation,
  } = useBookNest()
  const calendar = findCalendar(
    snapshot.calendars,
    snapshot.invitedCalendars,
    calendarId,
  )
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()))
  const [quickTitle, setQuickTitle] = useState('')
  const [quickName, setQuickName] = useState('')
  const [quickTime, setQuickTime] = useState('All day')
  const [endDate, setEndDate] = useState(() => formatDateForInput(new Date()))
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null)
  const [editingReservation, setEditingReservation] =
    useState<CalendarReservation | null>(null)
  const reservations = snapshot.reservationsByCalendar[calendarId] ?? []
  const messages = snapshot.chatByCalendar[calendarId] ?? []
  const dayNotes = snapshot.dayNotesByCalendar[calendarId] ?? {}

  useEffect(() => {
    if (endDate < selectedDate) {
      setEndDate(selectedDate)
    }
  }, [endDate, selectedDate])

  if (!calendar) {
    return (
      <main className="booknest-screen">
        <div className="page-wrap booknest-app-shell">
          <section className="book-card">
            <div className="section-stack">
              <h1 className="book-hero-title">Calendar not found</h1>
              <p className="book-hero-copy">
                This calendar was removed or never existed in the web snapshot.
              </p>
              <Link to="/" className="action-button action-button--primary">
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const senderDisplayName =
    snapshot.accountProfile?.username.trim() || 'Someone'
  const reservationsForSelectedDate = reservations.filter((reservation) =>
    reservationIncludesDate(reservation, selectedDate),
  )

  return (
    <>
      <main className="booknest-screen">
        <AnimatedBackdrop theme={snapshot.theme} />
        <div className="page-wrap booknest-app-shell">
          <section className="book-card rise-in">
            <div className="calendar-detail-header">
              <div>
                <p className="calendar-detail-back">
                  <Link to="/">Back to dashboard</Link>
                </p>
                <h1 className="book-hero-title">{calendar.name}</h1>
                <p className="book-hero-copy">
                  Shared calendar for boats, cabins, and group plans.
                </p>
              </div>

              <button
                type="button"
                className="pill-button"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '60ms' }}>
            <div className="calendar-grid-header">
              <h2 className="section-heading">{formatMonthTitle(displayedMonth)}</h2>
              <div className="calendar-grid-nav">
                <button
                  type="button"
                  className="icon-chip"
                  aria-label="Previous month"
                  onClick={() => {
                    const nextMonth = new Date(
                      displayedMonth.getFullYear(),
                      displayedMonth.getMonth() - 1,
                      1,
                    )
                    setDisplayedMonth(nextMonth)
                    setSelectedDate(formatDateForInput(nextMonth))
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="icon-chip"
                  aria-label="Next month"
                  onClick={() => {
                    const nextMonth = new Date(
                      displayedMonth.getFullYear(),
                      displayedMonth.getMonth() + 1,
                      1,
                    )
                    setDisplayedMonth(nextMonth)
                    setSelectedDate(formatDateForInput(nextMonth))
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="calendar-weekdays">
              {weekdaySymbols().map((symbol) => (
                <span key={symbol}>{symbol}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {buildMonthGrid(displayedMonth).map((dateKey, index) =>
                dateKey ? (
                  <button
                    key={dateKey}
                    type="button"
                    className={`calendar-day${
                      dateKey === selectedDate ? ' calendar-day--selected' : ''
                    }`}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <span>{Number(dateKey.slice(-2))}</span>
                    <span
                      className={`calendar-day__dot${
                        reservations.some((reservation) =>
                          reservationIncludesDate(reservation, dateKey),
                        )
                          ? ' calendar-day__dot--active'
                          : ''
                      }`}
                    />
                    <span
                      className={`calendar-day__span${
                        reservations.some(
                          (reservation) =>
                            reservationIncludesDate(reservation, dateKey) &&
                            reservationSpansMultipleDays(reservation),
                        )
                          ? ' calendar-day__span--active'
                          : ''
                      }`}
                    />
                  </button>
                ) : (
                  <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />
                ),
              )}
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '110ms' }}>
            <div className="day-details-header">
              <h2 className="section-heading">{formatDayTitle(selectedDate)}</h2>
              <button
                type="button"
                className="pill-button"
                onClick={() => {
                  const today = new Date()
                  setSelectedDate(formatDateForInput(today))
                  setDisplayedMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  )
                }}
              >
                Today
              </button>
            </div>

            <div className="section-stack">
              <h3 className="section-heading section-heading--small">Reservations</h3>
              {reservationsForSelectedDate.length ? (
                <div className="section-list">
                  {reservationsForSelectedDate.map((reservation) => (
                    <article key={reservation.id} className="reservation-row">
                      <Avatar
                        imageData={reservation.imageData}
                        label={reservation.person}
                        className="person-avatar"
                      />
                      <div className="row-copy">
                        <p className="row-title">{reservation.title}</p>
                        <p className="row-meta">
                          {reservation.person} • {reservation.time}
                          {resolvedEndDate(reservation) > reservation.date
                            ? ` • ${formatRange(
                                reservation.date,
                                resolvedEndDate(reservation),
                              )}`
                            : ''}
                        </p>
                      </div>
                      <div className="reservation-actions">
                        <button
                          type="button"
                          className="icon-chip"
                          aria-label="Edit reservation"
                          onClick={() => setEditingReservation(reservation)}
                        >
                          <Ellipsis size={16} />
                        </button>
                        <button
                          type="button"
                          className="pill-button pill-button--danger"
                          onClick={() =>
                            removeReservation(calendarId, reservation.id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No reservations yet. Add one below.</div>
              )}
            </div>

            <div className="section-stack">
              <h3 className="section-heading section-heading--small">Day Notes</h3>
              <textarea
                className="book-textarea"
                value={dayNotes[selectedDate] ?? ''}
                onChange={(event) =>
                  updateDayNote(calendarId, selectedDate, event.target.value)
                }
                placeholder="Add a note for the day"
              />
            </div>

            <div className="section-stack">
              <h3 className="section-heading section-heading--small">Quick Reserve</h3>
              <label className="form-field">
                <span>What are you reserving?</span>
                <input
                  value={quickTitle}
                  onChange={(event) => setQuickTitle(event.target.value)}
                  placeholder="What are you reserving?"
                />
              </label>
              <div className="two-up-grid">
                <label className="form-field">
                  <span>Your name</span>
                  <input
                    value={quickName}
                    onChange={(event) => setQuickName(event.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="form-field">
                  <span>Time</span>
                  <input
                    value={quickTime}
                    onChange={(event) => setQuickTime(event.target.value)}
                    placeholder="All day"
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Ends</span>
                <input
                  type="date"
                  min={selectedDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="action-button action-button--primary"
                disabled={!quickTitle.trim()}
                onClick={() => {
                  upsertReservation(
                    calendarId,
                    makeReservation({
                      title: quickTitle,
                      person: quickName || senderDisplayName,
                      time: quickTime || 'All day',
                      date: selectedDate,
                      endDate,
                      imageData: snapshot.accountProfile?.imageData ?? null,
                      colorIndex: calendar.tintIndex,
                    }),
                  )
                  setQuickTitle('')
                  setQuickName('')
                  setQuickTime('All day')
                }}
              >
                <PlusCircle size={16} />
                <span>Reserve for {formatShortDate(selectedDate)}</span>
              </button>
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '150ms' }}>
            <div className="section-stack">
              <h2 className="section-heading">Calendar Chat</h2>

              <div className="chat-thread">
                {messages.length ? (
                  messages.map((message) => (
                    <article key={message.id} className="chat-row">
                      <Avatar
                        imageData={message.imageData}
                        label={message.senderName}
                        className="chat-avatar"
                      />
                      <div className="chat-bubble">
                        <div className="chat-meta">
                          <strong>{message.senderName}</strong>
                          <span>{formatChatTime(message.timestamp)}</span>
                        </div>
                        {message.replyTo ? (
                          <div className="chat-reply-preview">
                            <span>Replying to {message.replyTo.senderName}</span>
                            {message.replyTo.preview ? (
                              <small>{message.replyTo.preview}</small>
                            ) : null}
                          </div>
                        ) : null}
                        <p>{message.text}</p>
                        {message.reactions.length ? (
                          <div className="reaction-strip">
                            {message.reactions.map((reaction, index) => (
                              <span key={`${message.id}-${reaction}-${index}`}>
                                {reaction}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="chat-actions">
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => setReplyTo(message)}
                          >
                            <MessageCircleReply size={14} />
                            <span>Reply</span>
                          </button>
                          <button
                            type="button"
                            className="text-button text-button--muted"
                            onClick={() =>
                              setShowReactionsFor((current) =>
                                current === message.id ? null : message.id,
                              )
                            }
                          >
                            <SmilePlus size={14} />
                            <span>React</span>
                          </button>
                        </div>
                        {showReactionsFor === message.id ? (
                          <div className="reaction-picker">
                            {REACTIONS.map((reaction) => (
                              <button
                                key={reaction}
                                type="button"
                                onClick={() => {
                                  addReaction(calendarId, message.id, reaction)
                                  setShowReactionsFor(null)
                                }}
                              >
                                {reaction}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No messages yet.</div>
                )}
              </div>

              {replyTo ? (
                <div className="reply-banner">
                  <div>
                    Replying to {replyTo.senderName}
                    {replyTo.text ? <small>{replyTo.text.slice(0, 80)}</small> : null}
                  </div>
                  <button
                    type="button"
                    className="text-button text-button--muted"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              <div className="chat-compose">
                <label className="composer-shell">
                  <Paperclip size={16} />
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Message the group..."
                  />
                </label>
                <button
                  type="button"
                  className="icon-chip icon-chip--accent"
                  disabled={!messageText.trim()}
                  onClick={() => {
                    sendMessage(
                      calendarId,
                      senderDisplayName,
                      messageText,
                      snapshot.accountProfile?.imageData ?? null,
                      replyTo,
                    )
                    setMessageText('')
                    setReplyTo(null)
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showInviteModal ? (
        <InviteModal
          calendarName={calendar.name}
          onClose={() => setShowInviteModal(false)}
          onCreateLink={() =>
            createCalendarInviteUrl({
              calendarId: calendar.id,
              calendarName: calendar.name,
              senderName: senderDisplayName,
            })
          }
        />
      ) : null}

      {editingReservation ? (
        <EditReservationModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSave={(reservation) => {
            upsertReservation(calendarId, reservation)
            setEditingReservation(null)
          }}
        />
      ) : null}
    </>
  )
}

function InviteModal({
  calendarName,
  onClose,
  onCreateLink,
}: {
  calendarName: string
  onClose: () => void
  onCreateLink: () => string
}) {
  const [recipient, setRecipient] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const canEmailRecipient = /\S+@\S+\.\S+/.test(recipient.trim())

  async function copyInviteLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopyStatus('Invite link copied.')
    } catch {
      setCopyStatus('Copy failed. Select and copy the link manually.')
    }
  }

  function createLink() {
    const link = onCreateLink()
    setInviteLink(link)
    void copyInviteLink(link)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <form
          className="modal-form"
          onSubmit={(event) => {
            event.preventDefault()
            createLink()
          }}
        >
          <h2 className="modal-title">Invite to {calendarName}</h2>
          <label className="form-field">
            <span>Email or username</span>
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Email or username"
            />
          </label>

          {inviteLink ? (
            <div className="invite-link-panel">
              <label className="form-field">
                <span>Invite link</span>
                <input value={inviteLink} readOnly onFocus={(event) => event.target.select()} />
              </label>
              <div className="invite-actions">
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => void copyInviteLink(inviteLink)}
                >
                  Copy Link
                </button>
                {canEmailRecipient ? (
                  <a
                    className="pill-button"
                    href={`mailto:${encodeURIComponent(
                      recipient.trim(),
                    )}?subject=${encodeURIComponent(
                      `BookNest invite: ${calendarName}`,
                    )}&body=${encodeURIComponent(
                      `You have been invited to join "${calendarName}" on BookNest.\n\nOpen this link to accept the invite:\n${inviteLink}`,
                    )}`}
                  >
                    Open Email
                  </a>
                ) : null}
              </div>
              {copyStatus ? <p className="invite-status">{copyStatus}</p> : null}
            </div>
          ) : null}

          <button
            type="submit"
            className="action-button action-button--primary"
            disabled={!recipient.trim()}
          >
            <PartyPopper size={16} />
            <span>{inviteLink ? 'Create New Invite Link' : 'Create Invite Link'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

function EditReservationModal({
  reservation,
  onClose,
  onSave,
}: {
  reservation: CalendarReservation
  onClose: () => void
  onSave: (reservation: CalendarReservation) => void
}) {
  const [title, setTitle] = useState(reservation.title)
  const [person, setPerson] = useState(reservation.person)
  const [time, setTime] = useState(reservation.time)
  const [endDate, setEndDate] = useState(resolvedEndDate(reservation))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <form
          className="modal-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSave(
              makeReservation({
                id: reservation.id,
                title,
                person,
                time,
                date: reservation.date,
                endDate,
                imageData: reservation.imageData,
                colorIndex: reservation.colorIndex,
              }),
            )
          }}
        >
          <h2 className="modal-title">Edit Reservation</h2>
          <label className="form-field">
            <span>Reservation title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Name</span>
            <input value={person} onChange={(event) => setPerson(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Time</span>
            <input value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Ends</span>
            <input
              type="date"
              min={reservation.date}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="action-button action-button--primary"
            disabled={!title.trim()}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}

function Avatar({
  imageData,
  label,
  className,
}: {
  imageData: string | null
  label: string
  className: string
}) {
  if (imageData) {
    return <img src={imageData} alt={label} className={className} />
  }

  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div
      className={className}
      style={{ backgroundColor: `${getCalendarTint(4)}33`, color: getCalendarTint(4) }}
    >
      {initials || 'BN'}
    </div>
  )
}

function formatDateForInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
