interface AvatarProps {
  nickname: string
  size?: 'sm' | 'md' | 'lg'
  isHost?: boolean
  isCurrentTurn?: boolean
  className?: string
}

const COLORS = [
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-yellow-200 text-yellow-800',
  'bg-orange-200 text-orange-800',
  'bg-teal-200 text-teal-800',
  'bg-red-200 text-red-800',
]

function getColor(nickname: string) {
  let hash = 0
  for (const c of nickname) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
}

export function Avatar({ nickname, size = 'md', isHost = false, isCurrentTurn = false, className = '' }: AvatarProps) {
  const color = getColor(nickname)
  const initial = nickname.charAt(0).toUpperCase()

  return (
    <div className={`relative inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        className={[
          'rounded-full flex items-center justify-center font-bold',
          sizeClasses[size],
          color,
          isCurrentTurn ? 'ring-4 ring-ui-text ring-offset-2 animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {initial}
      </div>
      {isHost && (
        <span className="absolute -top-1 -right-1 text-xs">👑</span>
      )}
      <span className="text-xs text-ui-text/70 max-w-[60px] truncate">{nickname}</span>
    </div>
  )
}
