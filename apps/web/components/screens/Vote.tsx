'use client'

import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Avatar } from '@/components/ui/Avatar'
import { Timer } from '@/components/ui/Timer'
import { GAME_CONSTANTS } from 'shared'

export function Vote() {
  const { state } = useGame()
  const { emit } = useSocket()
  const { roomId, players, playerId, votes, timeLeft } = state
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const voteCounts: Record<string, number> = {}
  for (const targetId of Object.values(votes)) {
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1
  }
  const maxVotes = Math.max(0, ...Object.values(voteCounts))

  function handleVote(targetId: string) {
    if (submitted || targetId === playerId) return
    setSelected(targetId)
  }

  function handleSubmit() {
    if (!selected || !roomId || submitted) return
    setSubmitted(true)
    emit('submit-vote', { roomId, targetId: selected })
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-ui-text/50 text-xs mb-1">1차 투표</p>
        <h2 className="text-2xl font-black text-ui-text">누가 라이어일까요?</h2>
      </div>

      <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.VOTE} />

      {/* 투표 현황 */}
      <div className="text-xs text-ui-text/40 text-right">
        {Object.keys(votes).length} / {players.length} 투표 완료
      </div>

      {/* 플레이어 목록 */}
      <div className="flex flex-col gap-3 flex-1">
        {players.map((p) => {
          const count = voteCounts[p.id] ?? 0
          const pct = players.length > 0 ? (count / players.length) * 100 : 0
          const isMe = p.id === playerId
          const isSelected = selected === p.id
          const isTopVoted = count === maxVotes && count > 0

          return (
            <button
              key={p.id}
              onClick={() => handleVote(p.id)}
              disabled={isMe || submitted}
              className={[
                'bubble-card p-4 flex items-center gap-3 transition-all active:scale-[0.98] text-left w-full',
                isSelected ? 'ring-4 ring-red-400 ring-offset-1' : '',
                isMe ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl',
                submitted && !isSelected ? 'opacity-60' : '',
              ].join(' ')}
            >
              <Avatar nickname={p.nickname} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ui-text text-sm">
                    {p.nickname}
                    {isMe && <span className="ml-1 text-xs text-ui-text/40">(나)</span>}
                  </span>
                  <span className={['text-sm font-bold', isTopVoted ? 'text-red-500' : 'text-ui-text/40'].join(' ')}>
                    {count}표
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-ui-bg rounded-full overflow-hidden">
                  <div
                    className={['h-full rounded-full transition-all duration-500', isTopVoted ? 'bg-red-400' : 'bg-ui-text/30'].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 제출 버튼 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={[
            'w-full py-4 rounded-full font-bold text-white text-lg transition-all active:scale-95',
            selected ? 'bg-red-500 hover:bg-red-600' : 'bg-red-200 cursor-not-allowed',
          ].join(' ')}
        >
          {selected
            ? `${players.find((p) => p.id === selected)?.nickname} 지목 ✓`
            : '투표할 사람을 선택하세요'}
        </button>
      ) : (
        <div className="bubble-card p-4 text-center text-ui-text/50 text-sm">
          투표 완료! 결과를 기다리는 중...
        </div>
      )}
    </div>
  )
}
