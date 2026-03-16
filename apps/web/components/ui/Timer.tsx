interface TimerProps {
  timeLeft: number
  total: number
  className?: string
}

export function Timer({ timeLeft, total, className = '' }: TimerProps) {
  const pct = total > 0 ? (timeLeft / total) * 100 : 0
  const isUrgent = timeLeft <= 10

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span
        className={[
          'text-3xl font-black tabular-nums',
          isUrgent ? 'text-red-500 animate-wiggle' : 'text-ui-text',
        ].join(' ')}
      >
        {timeLeft}
      </span>
      <div className="w-full h-2 bg-ui-bg rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-1000',
            isUrgent ? 'bg-red-500' : 'bg-ui-text',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
