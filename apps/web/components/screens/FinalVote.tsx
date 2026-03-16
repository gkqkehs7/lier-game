'use client'

import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Avatar } from '@/components/ui/Avatar'
import { Timer } from '@/components/ui/Timer'
import { GAME_CONSTANTS } from 'shared'

export function FinalVote() {
  const { state } = useGame()
  const { emit } = useSocket()
  const { roomId, accusedId, players, finalVotes, timeLeft } = state
  const [myVote, setMyVote] = useState<'kill' | 'save' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const accusedPlayer = players.find((p) => p.id === accusedId)

  const killCount = Object.values(finalVotes).filter((v) => v === 'kill').length
  const saveCount = Object.values(finalVotes).filter((v) => v === 'save').length
  const totalVoted = killCount + saveCount
  const total = players.length

  function handleVote(vote: 'kill' | 'save') {
    if (submitted) return
    setMyVote(vote)
    setSubmitted(true)
    if (roomId) emit('submit-final-vote', { roomId, vote })
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-ui-text/50 text-xs mb-1">확정 투표</p>
        <h2 className="text-2xl font-black text-ui-text">라이어가 맞을까요?</h2>
      </div>

      {/* 피의자 */}
      <div className="bubble-card p-4 flex items-center justify-center gap-3">
        <Avatar nickname={accusedPlayer?.nickname ?? '?'} size="lg" />
        <p className="text-xl font-black text-ui-text">{accusedPlayer?.nickname}</p>
      </div>

      <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.FINAL_VOTE} />

      {/* 실시간 투표 현황 */}
      <div className="bubble-card p-4 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-ui-text/50 mb-1">
          <span>죽이자 ☠️ {killCount}</span>
          <span>{totalVoted}/{total} 투표</span>
          <span>살리자 💚 {saveCount}</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-ui-bg">
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: total > 0 ? `${(killCount / total) * 100}%` : '0%' }}
          />
          <div
            className="bg-citizen-text transition-all duration-500"
            style={{ width: total > 0 ? `${(saveCount / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 투표 버튼 */}
      {!submitted ? (
        <div className="flex gap-3 mt-auto">
          <button
            onClick={() => handleVote('kill')}
            className="flex-1 py-5 rounded-3xl bg-red-500 text-white font-black text-xl hover:bg-red-600 active:scale-95 transition-all"
          >
            ☠️<br />
            <span className="text-base">죽이자</span>
          </button>
          <button
            onClick={() => handleVote('save')}
            className="flex-1 py-5 rounded-3xl bg-citizen-text text-white font-black text-xl hover:bg-[#064535] active:scale-95 transition-all"
          >
            💚<br />
            <span className="text-base">살리자</span>
          </button>
        </div>
      ) : (
        <div className="bubble-card p-4 text-center mt-auto">
          <p className="font-bold text-ui-text">
            {myVote === 'kill' ? '☠️ 죽이자' : '💚 살리자'} 투표 완료
          </p>
          <p className="text-xs text-ui-text/50 mt-1">다른 플레이어를 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
