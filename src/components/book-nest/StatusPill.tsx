import { Cloud, CloudOff, Loader2 } from 'lucide-react'

type StatusPillProps = {
  activity?: 'idle' | 'loading' | 'saving' | 'syncing'
  className?: string
  status: 'local' | 'syncing' | 'synced' | 'error'
}

export function StatusPill({ activity = 'idle', className = '', status }: StatusPillProps) {
  const isBusy = status === 'syncing' || activity !== 'idle'
  const label = statusLabel(status, activity)

  return (
    <span
      className={`status-pill status-pill--${status}${
        isBusy ? ' status-pill--busy' : ''
      } ${className}`.trim()}
      aria-live="polite"
    >
      {status === 'error' || status === 'local' ? (
        <CloudOff size={14} />
      ) : isBusy ? (
        <Loader2 size={14} />
      ) : (
        <Cloud size={14} />
      )}
      <span>{label}</span>
      {isBusy ? <BouncingDots /> : null}
    </span>
  )
}

export function TypingPill({ name }: { name: string }) {
  return (
    <span className="typing-pill" aria-live="polite">
      <span>{name} is typing</span>
      <BouncingDots />
    </span>
  )
}

function BouncingDots() {
  return (
    <span className="bouncing-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function statusLabel(
  status: StatusPillProps['status'],
  activity: StatusPillProps['activity'],
) {
  if (status === 'error') {
    return 'Sync needs attention'
  }

  if (status === 'local') {
    return 'Local only'
  }

  if (activity === 'saving') {
    return 'Saving changes'
  }

  if (activity === 'loading') {
    return 'Loading cloud'
  }

  if (activity === 'syncing' || status === 'syncing') {
    return 'Syncing'
  }

  return 'Synced'
}
