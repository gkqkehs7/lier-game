'use client'

import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Avatar } from '@/components/ui/Avatar'
import { Timer } from '@/components/ui/Timer'
import { ReactionBar } from '@/components/ui/ReactionBar'
import { GAME_CONSTANTS } from 'shared'

export function Defense() {
  const { state } = useGame()
  const { emit } = useSocket()
  const { roomId, playerId, accusedId, players, timeLeft } = state

  const isAccused = playerId === accusedId
  const accusedPlayer = players.find((p) => p.id === accusedId)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomId || submitted) return
    setSubmitted(true)
    emit('submit-defense', { roomId, text: text.trim() })
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      {/* 헤더 */}
      <div className="rounded-3xl bg-amber-50 border-2 border-amber-200 p-4 text-center">
        <p className="text-amber-600/60 text-xs font-bold mb-2">해명 시간</p>
        <div className="flex items-center justify-center gap-3">
          <Avatar nickname={accusedPlayer?.nickname ?? '?'} size="md" />
          <div className="text-left">
            <p className="font-black text-amber-700 text-lg">{accusedPlayer?.nickname}</p>
            <p className="text-amber-600/60 text-xs">지목된 사람</p>
          </div>
        </div>
      </div>

      <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.DEFENSE} />

      {isAccused ? (
        /* 해명 입력 */
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-center text-sm text-ui-text/60">
            당신이 라이어가 아닌 이유를 설명하세요!
          </p>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="여기에 해명을 입력하세요..."
              maxLength={100}
              disabled={submitted}
              rows={5}
              className="w-full rounded-2xl border-2 border-ui-bg bg-white px-4 py-3 text-ui-text placeholder-ui-text/40 focus:outline-none focus:border-amber-400 transition-colors resize-none flex-1"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-ui-text/40">{text.length}/100</span>
              <button
                type="submit"
                disabled={submitted || text.trim() === ''}
                className={[
                  'py-3 px-8 rounded-full font-bold text-white transition-all active:scale-95',
                  submitted || text.trim() === '' ? 'bg-amber-200 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600',
                ].join(' ')}
              >
                {submitted ? '제출됨 ✓' : '해명 완료'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* 대기 — 리액션만 */
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="bubble-card p-4 text-center text-ui-text/50 text-sm">
            <strong>{accusedPlayer?.nickname}</strong>님의 해명을 듣고 있습니다
          </div>
          <div className="bubble-card p-5 flex flex-col gap-3">
            <p className="text-center text-sm text-ui-text/60">해명에 리액션하세요</p>
            <ReactionBar />
          </div>
        </div>
      )}
    </div>
  )
}
