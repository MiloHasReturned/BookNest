import { Link } from '@tanstack/react-router'
import {
  CalendarPlus2,
  ChevronRight,
  LogOut,
  Mail,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useId,
  useState,
} from 'react'
import { AnimatedBackdrop } from '#/components/book-nest/AnimatedBackdrop'
import { GoogleSignInButton } from '#/components/book-nest/GoogleSignInButton'
import { useBookNest } from '#/components/book-nest/BookNestProvider'
import {
  type AccountProfile,
  type AppTheme,
  BACKGROUND_ANIMATION_STYLES,
  CALENDAR_TINTS,
  THEME_PRESETS,
  computeUpcomingReservations,
  formatRange,
  getCalendarTint,
} from '#/lib/booknest'
import { parseCalendarInviteParam } from '#/lib/inviteLinks'

export function BookNestDashboard() {
  const {
    snapshot,
    acceptInvite,
    applyPreset,
    clearAccountProfile,
    clearInvites,
    clearBrokenCloudCalendars,
    cloudError,
    cloudStatus,
    createCalendar,
    createInvite,
    deleteCalendar,
    dismissCloudError,
    leaveCalendar,
    rejectInvite,
    refreshCloudData,
    resetTheme,
    saveAccountProfile,
    setAnimationStyle,
    setThemeColor,
  } = useBookNest()
  const [searchText, setSearchText] = useState('')
  const [showCustomization, setShowCustomization] = useState(false)
  const [showCreateCalendar, setShowCreateCalendar] = useState(false)
  const [showAccountEditor, setShowAccountEditor] = useState(false)
  const deferredSearch = useDeferredValue(searchText)
  const searchValue = deferredSearch.trim().toLowerCase()
  const upcoming = computeUpcomingReservations(snapshot).slice(0, 5)
  const ownedCalendars = snapshot.calendars.filter((calendar) =>
    !searchValue ? true : calendar.name.toLowerCase().includes(searchValue),
  )
  const invitedCalendars = snapshot.invitedCalendars.filter((calendar) =>
    !searchValue ? true : calendar.name.toLowerCase().includes(searchValue),
  )
  const canCleanCloudError = isCleanableCloudError(cloudError)

  useEffect(() => {
    const inviteParam = new URLSearchParams(window.location.search).get('invite')
    if (!inviteParam) {
      return
    }

    const invite = parseCalendarInviteParam(inviteParam)
    const cleanUrl = `${window.location.pathname}${window.location.hash}`
    window.history.replaceState({}, '', cleanUrl)

    if (!invite) {
      return
    }

    const alreadyOwnsCalendar = snapshot.calendars.some(
      (calendar) => calendar.id === invite.calendarId,
    )
    const alreadyInvited = snapshot.invites.some(
      (entry) => entry.calendarId === invite.calendarId,
    )
    const alreadyAccepted = snapshot.invitedCalendars.some(
      (calendar) => calendar.id === invite.calendarId,
    )

    if (alreadyOwnsCalendar || alreadyInvited || alreadyAccepted) {
      return
    }

    createInvite(
      invite.calendarId,
      invite.calendarName,
      snapshot.accountProfile?.email || 'Invite link',
      invite.senderName,
    )
  }, [
    createInvite,
    snapshot.accountProfile?.email,
    snapshot.calendars,
    snapshot.invitedCalendars,
    snapshot.invites,
  ])

  return (
    <>
      <main className="booknest-screen">
        <AnimatedBackdrop theme={snapshot.theme} />

        <div className="page-wrap booknest-app-shell">
          <section className="book-card book-card--hero rise-in">
            <div>
              <h1 className="book-hero-title">Welcome to Book Nest</h1>
              <p className="book-hero-copy">
                Create shared calendars, reserve time, and keep the crew in sync.
              </p>
            </div>

            <button
              type="button"
              className="icon-chip"
              aria-label="Customize Book Nest"
              onClick={() => setShowCustomization(true)}
            >
              <SlidersHorizontal size={18} strokeWidth={2.2} />
            </button>
          </section>

          {cloudStatus === 'error' && cloudError ? (
            <section className="book-card cloud-status-card rise-in">
              <div className="section-stack">
                <h2 className="section-heading">Cloud Sync Needs Attention</h2>
                <p className="account-meta">{cloudError}</p>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => void refreshCloudData()}
                >
                  Retry Sync
                </button>
                {canCleanCloudError ? (
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => void clearBrokenCloudCalendars()}
                  >
                    Clean Up Broken Local Invites
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-button"
                  onClick={dismissCloudError}
                >
                  Work offline for now
                </button>
              </div>
            </section>
          ) : null}

          <section className="book-card rise-in" style={{ animationDelay: '70ms' }}>
            <div className="action-grid">
              <button
                type="button"
                className="action-button action-button--primary"
                onClick={() => setShowCreateCalendar(true)}
              >
                <CalendarPlus2 size={16} />
                <span>Create Calendar</span>
              </button>

              <button
                type="button"
                className="action-button"
                onClick={() => setShowAccountEditor(true)}
              >
                <UserPlus2 size={16} />
                <span>
                  {snapshot.accountProfile ? 'Edit Account' : 'Create Account'}
                </span>
              </button>
            </div>
          </section>

          {snapshot.accountProfile ? (
            <section className="book-card rise-in" style={{ animationDelay: '110ms' }}>
              <div className="account-row">
                <Avatar
                  imageData={snapshot.accountProfile.imageData}
                  label={snapshot.accountProfile.username}
                  className="avatar-shell avatar-shell--large"
                />
                <div className="account-details">
                  <p className="account-name">{snapshot.accountProfile.username}</p>
                  {snapshot.accountProfile.email ? (
                    <p className="account-meta">{snapshot.accountProfile.email}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowAccountEditor(true)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-button text-button--muted"
                  onClick={clearAccountProfile}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </section>
          ) : null}

          <section className="book-card rise-in" style={{ animationDelay: '140ms' }}>
            <div className="section-stack">
              <h2 className="section-heading">Find Calendars</h2>
              <label className="search-shell">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name"
                  aria-label="Search calendars"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '170ms' }}>
            <div className="section-stack">
              <div className="section-head">
                <h2 className="section-heading">New Invites</h2>
                {snapshot.invites.length ? (
                  <button
                    type="button"
                    className="text-button text-button--muted"
                    onClick={clearInvites}
                  >
                    Clear All
                  </button>
                ) : null}
              </div>

              {snapshot.invites.length ? (
                <div className="section-list">
                  {snapshot.invites.map((invite) => (
                    <article key={invite.id} className="box-row">
                      <div className="row-icon">
                        <Mail size={16} />
                      </div>
                      <div className="row-copy">
                        <p className="row-title">{invite.calendarName}</p>
                        <p className="row-meta">
                          From {invite.senderName} • {invite.recipient}
                        </p>
                      </div>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => acceptInvite(invite.id)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="text-button text-button--muted"
                          onClick={() => rejectInvite(invite.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyMessage>No invites yet.</EmptyMessage>
              )}
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '210ms' }}>
            <div className="section-stack">
              <h2 className="section-heading">Upcoming Reservations</h2>
              {upcoming.length ? (
                <div className="section-list">
                  {upcoming.map((reservation) => (
                    <Link
                      key={reservation.id}
                      to="/calendar/$calendarId"
                      params={{ calendarId: reservation.calendarId }}
                      className="box-row box-row--interactive"
                    >
                      <Avatar
                        imageData={reservation.imageData}
                        label={reservation.person}
                        className="person-avatar"
                      />
                      <div className="row-copy">
                        <p className="row-title">{reservation.title}</p>
                        <p className="row-meta">
                          {reservation.calendarName} •{' '}
                          {formatRange(reservation.date, reservation.endDate)} •{' '}
                          {reservation.time}
                        </p>
                      </div>
                      <span
                        className="tint-dot"
                        style={{
                          backgroundColor: getCalendarTint(reservation.tintIndex),
                        }}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyMessage>No upcoming reservations yet.</EmptyMessage>
              )}
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '250ms' }}>
            <div className="section-stack">
              <h2 className="section-heading">Invited Calendars</h2>
              {invitedCalendars.length ? (
                <div className="section-list">
                  {invitedCalendars.map((calendar) => (
                    <CalendarCard
                      key={calendar.id}
                      calendarId={calendar.id}
                      name={calendar.name}
                      tint={getCalendarTint(calendar.tintIndex)}
                      secondaryAction={{
                        label: 'Leave',
                        onClick: () => leaveCalendar(calendar.id),
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMessage>No invited calendars yet.</EmptyMessage>
              )}
            </div>
          </section>

          <section className="book-card rise-in" style={{ animationDelay: '290ms' }}>
            <div className="section-stack">
              <h2 className="section-heading">Your Calendars</h2>
              {ownedCalendars.length ? (
                <div className="section-list">
                  {ownedCalendars.map((calendar) => (
                    <CalendarCard
                      key={calendar.id}
                      calendarId={calendar.id}
                      name={calendar.name}
                      tint={getCalendarTint(calendar.tintIndex)}
                      secondaryAction={{
                        label: 'Delete',
                        onClick: () => {
                          if (
                            window.confirm(
                              'Delete calendar? This removes the calendar and its reservations for everyone who has access.',
                            )
                          ) {
                            deleteCalendar(calendar.id)
                          }
                        },
                        destructive: true,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMessage>
                  {searchValue
                    ? 'No calendars match your search.'
                    : 'No calendars yet. Create your first calendar to see it listed here.'}
                </EmptyMessage>
              )}
            </div>
          </section>
        </div>
      </main>

      {showCustomization ? (
        <CustomizationModal
          theme={snapshot.theme}
          onClose={() => setShowCustomization(false)}
          onApplyPreset={applyPreset}
          onResetTheme={resetTheme}
          onSetAnimationStyle={setAnimationStyle}
          onSetThemeColor={setThemeColor}
        />
      ) : null}

      {showCreateCalendar ? (
        <CreateCalendarModal
          onClose={() => setShowCreateCalendar(false)}
          onCreate={(name, tintIndex) => {
            createCalendar(name, tintIndex)
            setShowCreateCalendar(false)
          }}
        />
      ) : null}

      {showAccountEditor ? (
        <AccountModal
          profile={snapshot.accountProfile}
          onClose={() => setShowAccountEditor(false)}
          onSave={(profile) => {
            saveAccountProfile(profile)
            setShowAccountEditor(false)
          }}
          onGoogleSignIn={(profile) => {
            saveAccountProfile(profile)
            setShowAccountEditor(false)
          }}
        />
      ) : null}
    </>
  )
}

function CalendarCard({
  calendarId,
  name,
  tint,
  secondaryAction,
}: {
  calendarId: string
  name: string
  tint: string
  secondaryAction?: {
    label: string
    destructive?: boolean
    onClick: () => void
  }
}) {
  return (
    <article className="calendar-card-shell">
      <Link to="/calendar/$calendarId" params={{ calendarId }} className="calendar-card">
        <div className="calendar-mini" aria-hidden="true">
          <div className="calendar-mini__dots">
            {Array.from({ length: 7 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="calendar-mini__grid">
            {Array.from({ length: 21 }).map((_, index) => (
              <span
                key={index}
                style={{
                  backgroundColor:
                    index % 5 === 0 ? tint : 'rgba(15, 20, 31, 0.08)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="calendar-copy">
          <p className="row-title">{name}</p>
          <p className="row-meta">Tap to open</p>
        </div>

        <ChevronRight size={18} className="calendar-chevron" />
      </Link>

      {secondaryAction ? (
        <button
          type="button"
          className={`calendar-card-action${
            secondaryAction.destructive ? ' calendar-card-action--danger' : ''
          }`}
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.destructive ? <Trash2 size={14} /> : null}
          <span>{secondaryAction.label}</span>
        </button>
      ) : null}
    </article>
  )
}

function CustomizationModal({
  theme,
  onClose,
  onApplyPreset,
  onResetTheme,
  onSetAnimationStyle,
  onSetThemeColor,
}: {
  theme: AppTheme
  onClose: () => void
  onApplyPreset: (presetName: string) => void
  onResetTheme: () => void
  onSetAnimationStyle: (animationStyle: AppTheme['animationStyle']) => void
  onSetThemeColor: (
    key:
      | 'text'
      | 'accent'
      | 'card'
      | 'box'
      | 'backgroundTop'
      | 'backgroundBottom'
      | 'borderStart'
      | 'borderMid'
      | 'borderEnd',
    value: string,
  ) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(true)

  return (
    <ModalShell title="Customize Book Nest" onClose={onClose} size="large">
      <div className="modal-section">
        <div className="modal-headline">
          <div>
            <h2 className="modal-title">Customize Book Nest</h2>
            <p className="modal-copy">Pick a preset or fine-tune every color.</p>
          </div>
          <button type="button" className="pill-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <div className="modal-section">
        <h3 className="section-heading">Presets</h3>
        <div className="preset-grid">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className={`preset-card${
                JSON.stringify(preset.theme) === JSON.stringify(theme)
                  ? ' preset-card--active'
                  : ''
              }`}
              onClick={() => onApplyPreset(preset.name)}
            >
              <ThemePreviewCard theme={preset.theme} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="modal-section">
        <div className="quick-actions-row">
          <button
            type="button"
            className="pill-button"
            onClick={() => onApplyPreset('Midnight')}
          >
            Dark Mode
          </button>
          <button type="button" className="pill-button" onClick={onResetTheme}>
            Reset
          </button>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={(event) => setShowAdvanced(event.target.checked)}
          />
          <span>Show advanced controls</span>
        </label>
      </div>

      <div className="modal-section">
        <h3 className="section-heading">Background Animations</h3>
        <div className="animation-list">
          {BACKGROUND_ANIMATION_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`animation-row${
                theme.animationStyle === style.id ? ' animation-row--active' : ''
              }`}
              onClick={() => onSetAnimationStyle(style.id)}
            >
              <span className="animation-row__preview">
                <AnimatedBackdrop
                  compact
                  theme={{
                    ...theme,
                    animationStyle: style.id,
                  }}
                />
              </span>
              <span className="animation-row__label">{style.label}</span>
              {theme.animationStyle === style.id ? (
                <span className="animation-row__status">Selected</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="modal-section">
        <h3 className="section-heading">Customize Colors</h3>
        <div className="color-grid">
          <ColorField
            label="Text"
            value={theme.text}
            onChange={(value) => onSetThemeColor('text', value)}
          />
          <ColorField
            label="Accent"
            value={theme.accent}
            onChange={(value) => onSetThemeColor('accent', value)}
          />
          <ColorField
            label="Card"
            value={theme.card}
            onChange={(value) => onSetThemeColor('card', value)}
          />
          <ColorField
            label="Box"
            value={theme.box}
            onChange={(value) => onSetThemeColor('box', value)}
          />
          <ColorField
            label="Background Top"
            value={theme.backgroundTop}
            onChange={(value) => onSetThemeColor('backgroundTop', value)}
          />
          <ColorField
            label="Background Bottom"
            value={theme.backgroundBottom}
            onChange={(value) => onSetThemeColor('backgroundBottom', value)}
          />
          {showAdvanced ? (
            <>
              <ColorField
                label="Border Start"
                value={theme.borderStart}
                onChange={(value) => onSetThemeColor('borderStart', value)}
              />
              <ColorField
                label="Border Mid"
                value={theme.borderMid}
                onChange={(value) => onSetThemeColor('borderMid', value)}
              />
              <ColorField
                label="Border End"
                value={theme.borderEnd}
                onChange={(value) => onSetThemeColor('borderEnd', value)}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="modal-section">
        <h3 className="section-heading">Preview</h3>
        <ThemePreviewCard theme={theme} tall />
      </div>
    </ModalShell>
  )
}

function CreateCalendarModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, tintIndex: number) => void
}) {
  const [name, setName] = useState('')
  const [selectedTintIndex, setSelectedTintIndex] = useState(4)

  return (
    <ModalShell title="New Calendar" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          onCreate(name, selectedTintIndex)
        }}
      >
        <h2 className="modal-title">New Calendar</h2>
        <label className="form-field">
          <span>Calendar name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Calendar name"
          />
        </label>

        <div className="form-field">
          <span>Pick a color</span>
          <div className="tint-picker">
            {CALENDAR_TINTS.map((tint, index) => (
              <button
                key={tint}
                type="button"
                className={`tint-swatch${
                  selectedTintIndex === index ? ' tint-swatch--active' : ''
                }`}
                style={{ backgroundColor: tint }}
                aria-label={`Choose ${tint}`}
                onClick={() => setSelectedTintIndex(index)}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="action-button action-button--primary"
          disabled={!name.trim()}
        >
          Create Calendar
        </button>
      </form>
    </ModalShell>
  )
}

function AccountModal({
  profile,
  onClose,
  onSave,
  onGoogleSignIn,
}: {
  profile: AccountProfile | null
  onClose: () => void
  onSave: (profile: AccountProfile) => void
  onGoogleSignIn: (profile: AccountProfile) => void
}) {
  const [email, setEmail] = useState(profile?.email ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [imageData, setImageData] = useState<string | null>(profile?.imageData ?? null)
  const inputId = useId()

  return (
    <ModalShell title="Create Account" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!username.trim()) {
            return
          }

          onSave({
            email,
            username,
            imageData,
          })
        }}
      >
        <h2 className="modal-title">{profile ? 'Edit Account' : 'Create Account'}</h2>

        <GoogleSignInButton onSignIn={onGoogleSignIn} />

        <div className="auth-divider" aria-hidden="true">
          <span />
          <strong>or</strong>
          <span />
        </div>

        <label className="form-field">
          <span>Email (optional)</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
          />
        </label>

        <label className="form-field">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
          />
        </label>

        <div className="avatar-picker-row">
          <Avatar imageData={imageData} label={username || 'Profile'} className="avatar-picker" />
          <div className="avatar-picker-actions">
            <label htmlFor={inputId} className="pill-button">
              Add Profile Picture
            </label>
            {imageData ? (
              <button
                type="button"
                className="text-button text-button--muted"
                onClick={() => setImageData(null)}
              >
                Remove
              </button>
            ) : null}
            <input
              id={inputId}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }

                setImageData(await readFileAsDataUrl(file))
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="action-button action-button--primary"
          disabled={!username.trim()}
        >
          Save Account
        </button>
      </form>
    </ModalShell>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function ThemePreviewCard({
  theme,
  tall = false,
}: {
  theme: AppTheme
  tall?: boolean
}) {
  return (
    <div
      className={`theme-preview-card${tall ? ' theme-preview-card--tall' : ''}`}
      style={{
        '--preview-card': theme.card,
        '--preview-box': theme.box,
        '--preview-text': theme.text,
        '--preview-border-start': theme.borderStart,
        '--preview-border-mid': theme.borderMid,
        '--preview-border-end': theme.borderEnd,
        '--preview-accent': theme.accent,
      } as CSSProperties}
    >
      <AnimatedBackdrop theme={theme} compact />
      <div className="theme-preview-card__content">
        <p>Sample Card</p>
        <small>Buttons, text, and borders preview</small>
        <div className="theme-preview-card__action">Action</div>
      </div>
    </div>
  )
}

function ModalShell({
  title,
  size = 'regular',
  onClose,
  children,
}: {
  title: string
  size?: 'regular' | 'large'
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`modal-shell${size === 'large' ? ' modal-shell--large' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
        {children}
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

  return <div className={className}>{initials || 'BN'}</div>
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>
}

function isCleanableCloudError(error: string | null) {
  if (!error) {
    return false
  }

  return /broken|foreign key|calendar-not-found|not present in table/i.test(error)
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}
