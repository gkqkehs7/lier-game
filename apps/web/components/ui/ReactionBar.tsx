'use client'

import { ReactionEmoji } from 'shared'
import { useSocket } from '@/hooks/useSocket'
import { useGame } from '@/context/GameContext'

const EMOJIS: ReactionEmoji[] = ['👀', '😮', '😂', '🤔']

interface ReactionBarProps {
  disabled?: boolean
}

export function ReactionBar({ disabled = false }: ReactionBarProps) {
  const { emit } = useSocket()
  const { state } = useGame()

  function handleReaction(emoji: ReactionEmoji) {
    if (disabled || !state.roomId) return
    emit('submit-reaction', { roomId: state.roomId, emoji })
  }

  return (
    <div className="flex gap-3 justify-center">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          disabled={disabled}
          className={[
            'text-3xl rounded-full w-14 h-14 flex items-center justify-center',
            'transition-transform active:scale-110',
            disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:bg-white/50',
          ].join(' ')}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
