import type { AppTheme } from '#/lib/booknest'

export function BookNestLoadingScreen({
  theme,
  title = 'Warming up Book Nest',
  detail = 'Preparing your calendars, invites, notes, and cloud sync.',
}: {
  theme: AppTheme
  title?: string
  detail?: string
}) {
  return (
    <main className="booknest-screen booknest-loading-screen">
      <div className="loading-art" aria-hidden="true">
        <div className="loading-art__halo loading-art__halo--one" />
        <div className="loading-art__halo loading-art__halo--two" />
        <div className="loading-art__grid" />
        <div className="loading-art__book">
          <div className="loading-art__page loading-art__page--left">
            <span />
            <span />
            <span />
          </div>
          <div className="loading-art__spine" />
          <div className="loading-art__page loading-art__page--right">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="loading-art__orbit loading-art__orbit--one" />
        <div className="loading-art__orbit loading-art__orbit--two" />
        <div className="loading-art__spark loading-art__spark--one" />
        <div className="loading-art__spark loading-art__spark--two" />
        <div className="loading-art__spark loading-art__spark--three" />
      </div>

      <section className="loading-card" aria-live="polite">
        <div className="loading-card__mark">
          <span />
        </div>
        <p className="section-eyebrow">Book Nest is getting ready</p>
        <h1 className="loading-title">{title}</h1>
        <p className="loading-copy">{detail}</p>

        <div className="loading-progress" aria-hidden="true">
          <span />
        </div>

        <div className="loading-steps">
          <LoadingStep label="Local data" value="Reading browser snapshot" />
          <LoadingStep label="Account" value="Checking Google session" />
          <LoadingStep label="Cloud sync" value="Connecting to Supabase" />
        </div>
      </section>

      <div
        className="loading-theme-sample"
        style={{
          background: `linear-gradient(135deg, ${theme.backgroundTop}, ${theme.backgroundBottom})`,
          borderColor: theme.borderEnd,
        }}
        aria-hidden="true"
      />
    </main>
  )
}

function LoadingStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="loading-step">
      <span className="loading-step__dot" />
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
    </div>
  )
}
