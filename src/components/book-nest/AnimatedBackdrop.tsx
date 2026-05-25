import type { AppTheme } from '#/lib/booknest'

export function AnimatedBackdrop({
  theme,
  compact = false,
}: {
  theme: AppTheme
  compact?: boolean
}) {
  const isFancy = theme.backgroundEffects === 'fancy'

  return (
    <div
      className={`animated-backdrop${compact ? ' animated-backdrop--compact' : ''}`}
      data-style={theme.animationStyle}
      data-effects={isFancy ? 'fancy' : 'calm'}
      aria-hidden="true"
    >
      <div className="animated-backdrop__base" />
      {isFancy ? (
        <>
          <div className="animated-backdrop__veil" />
          <div className="animated-backdrop__layer animated-backdrop__layer--1" />
          <div className="animated-backdrop__layer animated-backdrop__layer--2" />
          <div className="animated-backdrop__layer animated-backdrop__layer--3" />
          <div className="animated-backdrop__layer animated-backdrop__layer--4" />
          <div className="animated-backdrop__layer animated-backdrop__layer--5" />
          <div className="animated-backdrop__orb animated-backdrop__orb--1" />
          <div className="animated-backdrop__orb animated-backdrop__orb--2" />
          <div className="animated-backdrop__ribbon animated-backdrop__ribbon--1" />
          <div className="animated-backdrop__ribbon animated-backdrop__ribbon--2" />
          <div className="animated-backdrop__grid" />
          <div className="animated-backdrop__sparkles" />
          <div className="animated-backdrop__texture" />
        </>
      ) : null}
    </div>
  )
}
