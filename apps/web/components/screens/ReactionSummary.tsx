'use client'

import { useGame } from '@/context/GameContext'
import { Avatar } from '@/components/ui/Avatar'

export function ReactionSummary() {
  const { state } = useGame()
  const { hints, players } = state

  const totalReactions = (hint: (typeof hints)[0]) =>
    Object.values(hint.reactions).reduce((s, n) => s + n, 0)

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-6">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-ui-text/50 text-sm mb-1">힌트 라운드 종료</p>
        <h2 className="text-2xl font-black text-ui-text">리액션 집계</h2>
        <p className="text-ui-text/40 text-xs mt-1">잠시 후 투표가 시작됩니다</p>
      </div>

      {/* 힌트별 리액션 */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {hints.map((hint, i) => {
          const player = players.find((p) => p.id === hint.playerId)
          const total = totalReactions(hint)

          return (
            <div key={hint.playerId} className="bubble-card p-4 flex flex-col gap-3 animate-bounce_in">
              <div className="flex items-center gap-3">
                <Avatar nickname={player?.nickname ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ui-text text-sm">{player?.nickname}</span>
                    <span className="text-xs text-ui-text/40">힌트 {i + 1}</span>
                  </div>
                  <p className="text-ui-text/70 text-sm mt-0.5">
                    {hint.text === null ? (
                      <span className="text-ui-text/30 italic">기권</span>
                    ) : (
                      `"${hint.text}"`
                    )}
                  </p>
                </div>
              </div>

              {/* 리액션 바 */}
              {total > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {(['👀', '😮', '😂', '🤔'] as const).map((emoji) => {
                    const count = hint.reactions[emoji]
                    const pct = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={emoji} className="flex items-center gap-2">
                        <span className="text-lg w-7">{emoji}</span>
                        <div className="flex-1 h-2 bg-ui-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ui-text rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-ui-text/50 w-4 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-ui-text/30 text-center">리액션 없음</p>
              )}
            </div>
          )
        })}
      </div>

      {/* 대기 메시지 */}
      <div className="flex items-center justify-center gap-2 text-ui-text/40 text-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-ui-text/30 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span>투표 준비 중...</span>
      </div>
    </div>
  )
}
