'use client'

import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Timer } from '@/components/ui/Timer'
import { GAME_CONSTANTS } from 'shared'

export function GuessingWord() {
  const { state } = useGame()
  const { emit } = useSocket()
  const { roomId, playerId, role, timeLeft } = state
  const isLiar = role === 'liar'

  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomId || submitted || !guess.trim()) return
    setSubmitted(true)
    emit('submit-guess', { roomId, guess: guess.trim() })
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-6">
      {/* 헤더 */}
      <div className="rounded-3xl bg-liar-bg border-2 border-liar-text/20 p-5 text-center">
        <p className="text-liar-text/60 text-xs font-bold mb-1">마지막 기회</p>
        <h2 className="text-2xl font-black text-liar-text">제시어를 맞혀라!</h2>
        <p className="text-liar-text/50 text-sm mt-1">
          {isLiar ? '타겟 인물의 이름을 맞히면 역전 가능합니다!' : '라이어가 제시어를 맞힐 시간입니다'}
        </p>
      </div>

      <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.GUESS} />

      {isLiar ? (
        /* 라이어 입력 */
        <div className="flex-1 flex flex-col gap-4 justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="타겟 인물의 이름을 입력하세요"
              maxLength={20}
              disabled={submitted}
              autoFocus
              className="w-full rounded-2xl border-2 border-liar-text/30 bg-white px-4 py-4 text-ui-text placeholder-ui-text/40 focus:outline-none focus:border-liar-text transition-colors text-lg text-center"
            />
            <button
              type="submit"
              disabled={submitted || guess.trim() === ''}
              className={[
                'w-full py-4 rounded-full font-bold text-white text-lg transition-all active:scale-95',
                submitted || guess.trim() === ''
                  ? 'bg-liar-text/30 cursor-not-allowed'
                  : 'bg-liar-text hover:bg-[#5a1c30]',
              ].join(' ')}
            >
              {submitted ? '제출됨 ✓' : '정답 제출'}
            </button>
          </form>
          {submitted && (
            <p className="text-center text-liar-text/60 text-sm">결과를 기다리는 중...</p>
          )}
        </div>
      ) : (
        /* 다른 플레이어 대기 화면 */
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl animate-bounce">🎭</div>
          <p className="text-ui-text/50 text-center">
            라이어가 제시어를 맞히려 합니다
          </p>
        </div>
      )}
    </div>
  )
}
