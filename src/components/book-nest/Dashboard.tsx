import { Link } from '@tanstack/react-router'
import {
  CalendarPlus2,
  CalendarDays,
  ChevronRight,
  Cloud,
  LogOut,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserPlus2,
  UsersRound,
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
import { BookNestLoadingScreen } from '#/components/book-nest/BookNestLoadingScreen'
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
import { type CloudIssue, isCleanableCloudIssue } from '#/lib/cloudDiagnostics'
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
    cloudIssue,
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
    isBooting,
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
  const canCleanCloudError = isCleanableCloudIssue(cloudIssue)
  const totalCalendars = snapshot.calendars.length + snapshot.invitedCalendars.length

  useEffect(() => {
    if (isBooting) {
      return
    }

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
    isBooting,
  ])

  if (isBooting) {
    return <BookNestLoadingScreen theme={snapshot.theme} />
  }

  if (!snapshot.accountProfile) {
    return (
      <>
        <main className="booknest-screen">
          <AnimatedBackdrop theme={snapshot.theme} />

          <div className="page-wrap booknest-app-shell pre-account-shell">
            <PreAccountLanding
              inviteCount={snapshot.invites.length}
              onCreateAccount={() => setShowAccountEditor(true)}
              onCustomize={() => setShowCustomization(true)}
              onGoogleSignIn={(profile) => {
                saveAccountProfile(profile)
              }}
            />
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

  return (
    <>
      <main className="booknest-screen">
        <AnimatedBackdrop theme={snapshot.theme} />

        <div className="page-wrap booknest-app-shell">
          <section className="book-card book-card--hero rise-in">
            <div>
              <p className="section-eyebrow">Shared time, calmer planning</p>
              <h1 className="book-hero-title">Welcome to Book Nest</h1>
              <p className="book-hero-copy">
                Create shared calendars, reserve time, and keep the crew in sync.
              </p>
              <div className="hero-actions">
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
            </div>

            <div className="hero-panel">
              <button
                type="button"
                className="icon-chip icon-chip--large"
                aria-label="Customize Book Nest"
                onClick={() => setShowCustomization(true)}
              >
                <SlidersHorizontal size={18} strokeWidth={2.2} />
              </button>
              <div className="dashboard-metrics">
                <MetricCard label="Calendars" value={totalCalendars} />
                <MetricCard label="Invites" value={snapshot.invites.length} />
                <MetricCard label="Upcoming" value={upcoming.length} />
              </div>
            </div>
          </section>

          {cloudStatus === 'error' && cloudError ? (
            <section className="book-card cloud-status-card rise-in">
              <div className="section-stack">
                <h2 className="section-heading">Cloud Sync Needs Attention</h2>
                <p className="account-meta">{cloudError}</p>
                <CloudIssueDetails issue={cloudIssue} />
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

          <div className="dashboard-layout">
            <div className="dashboard-main">
              <section className="book-card rise-in" style={{ animationDelay: '90ms' }}>
                <div className="section-stack">
                  <div className="section-head">
                    <div>
                      <p className="section-eyebrow">Library</p>
                      <h2 className="section-heading">Your Calendars</h2>
                    </div>
                    <label className="search-shell search-shell--compact">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Search"
                        aria-label="Search calendars"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                      />
                    </label>
                  </div>

                  {ownedCalendars.length ? (
                    <div className="calendar-card-grid">
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

              <section className="book-card rise-in" style={{ animationDelay: '130ms' }}>
                <div className="section-stack">
                  <div className="section-head">
                    <div>
                      <p className="section-eyebrow">Shared with you</p>
                      <h2 className="section-heading">Invited Calendars</h2>
                    </div>
                  </div>
                  {invitedCalendars.length ? (
                    <div className="calendar-card-grid">
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
            </div>

            <aside className="dashboard-side">
              {snapshot.accountProfile ? (
                <section className="book-card rise-in" style={{ animationDelay: '110ms' }}>
                  <div className="account-row account-row--stacked">
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
                    <div className="inline-actions">
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
                  </div>
                </section>
              ) : null}

              <section className="book-card rise-in" style={{ animationDelay: '150ms' }}>
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
                        <article key={invite.id} className="box-row box-row--stacked">
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

              <section className="book-card rise-in" style={{ animationDelay: '190ms' }}>
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
            </aside>
          </div>
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

function PreAccountLanding({
  inviteCount,
  onCreateAccount,
  onCustomize,
  onGoogleSignIn,
}: {
  inviteCount: number
  onCreateAccount: () => void
  onCustomize: () => void
  onGoogleSignIn: (profile: AccountProfile) => void
}) {
  return (
    <>
      <section className="book-card pre-account-hero rise-in">
        <div className="pre-account-hero__copy">
          <p className="section-eyebrow">Group calendars without the chaos</p>
          <h1 className="pre-account-title">Book shared time, talk plans through, and keep everyone synced.</h1>
          <p className="book-hero-copy">
            BookNest is a shared planning space for families, friends, crews, clubs,
            rentals, boats, cabins, studios, and any group that needs fair access to
            shared time. Create calendars, invite people, reserve dates, leave day
            notes, and chat in the same place.
          </p>

          {inviteCount ? (
            <div className="pre-account-invite-callout">
              <Mail size={18} />
              <span>
                You have {inviteCount} pending invite{inviteCount === 1 ? '' : 's'} waiting.
                Sign in with the invited Google email to accept shared calendars.
              </span>
            </div>
          ) : null}

          <div className="hero-actions">
            <GoogleSignInButton onSignIn={onGoogleSignIn} />
            <button
              type="button"
              className="action-button"
              onClick={onCreateAccount}
            >
              <UserPlus2 size={16} />
              <span>Create manually</span>
            </button>
            <button type="button" className="text-button" onClick={onCustomize}>
              <SlidersHorizontal size={15} />
              Preview customization
            </button>
          </div>
        </div>

        <div className="pre-account-showcase" aria-hidden="true">
          <div className="showcase-card showcase-card--calendar">
            <div className="showcase-card__top">
              <span>May</span>
              <strong>Shared Cabin</strong>
            </div>
            <div className="showcase-calendar-grid">
              {Array.from({ length: 28 }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index === 7 || index === 8 || index === 17
                      ? 'showcase-calendar-grid__reserved'
                      : ''
                  }
                />
              ))}
            </div>
          </div>
          <div className="showcase-card showcase-card--chat">
            <strong>Chat</strong>
            <span>Maxi reserved Sat-Sun</span>
            <span>Bring keys?</span>
            <span className="showcase-pill">Synced</span>
          </div>
          <div className="showcase-card showcase-card--invite">
            <UsersRound size={18} />
            <strong>Invite by email</strong>
            <span>Appears when they sign in</span>
          </div>
        </div>
      </section>

      <section className="pre-account-grid">
        <FeatureExplainer
          icon={<CalendarDays size={20} />}
          title="Create purpose-built calendars"
          copy="Make a calendar for a cabin, boat, family schedule, study group, workplace resource, room, equipment booking, or recurring crew plan."
        />
        <FeatureExplainer
          icon={<UsersRound size={20} />}
          title="Invite the actual people involved"
          copy="Send invites by email so shared calendars appear for the recipient when they sign in with their Google account."
        />
        <FeatureExplainer
          icon={<MessageCircle size={20} />}
          title="Keep the conversation beside the schedule"
          copy="Each calendar includes chat, replies, reactions, reservations, and day notes so decisions do not get lost in separate apps."
        />
        <FeatureExplainer
          icon={<Cloud size={20} />}
          title="Sync across devices"
          copy="Signed-in accounts use cloud storage, so calendars can follow people across laptops, phones, browsers, and shared devices."
        />
      </section>

      <section className="book-card pre-account-how rise-in" style={{ animationDelay: '120ms' }}>
        <div>
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-heading">From idea to shared calendar in minutes</h2>
        </div>
        <div className="how-step-grid">
          <HowStep number="01" title="Sign in" copy="Use Google so BookNest knows which calendars, invites, and memberships belong to you." />
          <HowStep number="02" title="Create a calendar" copy="Name the shared thing: a cabin, boat, room, schedule, club plan, or family calendar." />
          <HowStep number="03" title="Invite people" copy="Enter their email. When they sign in with that Google email, the invite appears in BookNest." />
          <HowStep number="04" title="Reserve, note, chat" copy="Add reservations, day notes, and messages so the whole group sees the same plan." />
        </div>
      </section>

      <section className="book-card pre-account-trust rise-in" style={{ animationDelay: '170ms' }}>
        <div>
          <p className="section-eyebrow">Built for the web app we are making</p>
          <h2 className="section-heading">What BookNest is aiming to solve</h2>
        </div>
        <div className="trust-list">
          <TrustItem icon={<ShieldCheck size={18} />} text="Reduce accidental double-bookings by putting reservations in one shared place." />
          <TrustItem icon={<Sparkles size={18} />} text="Make the app feel personal with themes, backgrounds, and cleaner customization." />
          <TrustItem icon={<Cloud size={18} />} text="Use cloud sync and diagnostics so issues are visible instead of silently breaking." />
        </div>
      </section>
    </>
  )
}

function FeatureExplainer({
  icon,
  title,
  copy,
}: {
  icon: ReactNode
  title: string
  copy: string
}) {
  return (
    <article className="book-card pre-account-feature rise-in">
      <div className="feature-icon">{icon}</div>
      <h2 className="section-heading">{title}</h2>
      <p className="account-meta">{copy}</p>
    </article>
  )
}

function HowStep({
  number,
  title,
  copy,
}: {
  number: string
  title: string
  copy: string
}) {
  return (
    <article className="how-step">
      <span>{number}</span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </article>
  )
}

function TrustItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="trust-item">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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
  const [activePanel, setActivePanel] =
    useState<'presets' | 'backgrounds' | 'colors'>('presets')
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <ModalShell title="Customize Book Nest" onClose={onClose} size="large">
      <div className="modal-section customization-shell">
        <div className="modal-headline">
          <div>
            <h2 className="modal-title">Customize Book Nest</h2>
            <p className="modal-copy">
              Fast presets, lightweight background previews, and deeper color control
              when you need it.
            </p>
          </div>
          <button type="button" className="pill-button" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="customization-rail">
          {(['presets', 'backgrounds', 'colors'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              className={`segmented-button${
                activePanel === panel ? ' segmented-button--active' : ''
              }`}
              onClick={() => setActivePanel(panel)}
            >
              {panel === 'presets'
                ? 'Presets'
                : panel === 'backgrounds'
                  ? 'Backgrounds'
                  : 'Colors'}
            </button>
          ))}
        </div>

        <ThemePreviewCard theme={theme} tall />

        <div className="quick-actions-row quick-actions-row--compact">
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
      </div>

      {activePanel === 'presets' ? (
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
      ) : null}

      {activePanel === 'backgrounds' ? (
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
                <span
                  className="animation-row__preview"
                  data-style={style.id}
                  style={
                    {
                      '--preview-border-start': theme.borderStart,
                      '--preview-border-mid': theme.borderMid,
                      '--preview-border-end': theme.borderEnd,
                      '--preview-accent': theme.accent,
                      '--preview-bg-top': theme.backgroundTop,
                      '--preview-bg-bottom': theme.backgroundBottom,
                    } as CSSProperties
                  }
                />
                <span className="animation-row__label">{style.label}</span>
                {theme.animationStyle === style.id ? (
                  <span className="animation-row__status">Selected</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activePanel === 'colors' ? (
        <div className="modal-section">
          <div className="section-head">
            <h3 className="section-heading">Customize Colors</h3>
            <label className="toggle-row toggle-row--compact">
              <input
                type="checkbox"
                checked={showAdvanced}
                onChange={(event) => setShowAdvanced(event.target.checked)}
              />
              <span>Advanced</span>
            </label>
          </div>
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
      ) : null}
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
      <div className="theme-preview-card__wash" />
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

function CloudIssueDetails({ issue }: { issue: CloudIssue | null }) {
  if (!issue) {
    return null
  }

  return (
    <details className="debug-details">
      <summary>Debug details</summary>
      <dl>
        <div>
          <dt>Where</dt>
          <dd>{issue.operation}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{issue.area}</dd>
        </div>
        <div>
          <dt>Likely cause</dt>
          <dd>{issue.likelyCause}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{issue.nextStep}</dd>
        </div>
        <div>
          <dt>Raw error</dt>
          <dd>{issue.rawMessage}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{issue.timestamp}</dd>
        </div>
      </dl>
    </details>
  )
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}
