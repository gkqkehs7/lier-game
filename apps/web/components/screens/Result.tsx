'use client'

import { useGame } from '@/context/GameContext'
import { Avatar } from '@/components/ui/Avatar'
import { BubbleButton } from '@/components/ui/BubbleButton'

export function Result() {
  const { state } = useGame()
  const { gameResult, players, role } = state

  if (!gameResult) return null

  const { winner, liarId, keyword } = gameResult
  const liarPlayer = players.find((p) => p.id === liarId)
  const isLiar = role === 'liar'
  const isWinner =
    (winner === 'liar' && isLiar) || (winner === 'citizen' && !isLiar)

  function handleRestart() {
    // 서버에 새 방 생성 요청하여 로비로 이동
    window.location.href = '/'
  }

  return (
    <div
      className={[
        'flex flex-col flex-1 px-5 py-8 gap-6 items-center justify-center',
        winner === 'liar' ? 'bg-liar-bg' : 'bg-citizen-bg',
      ].join(' ')}
    >
      {/* 승패 */}
      <div className="text-center animate-bounce_in">
        <div className="text-7xl mb-3">
          {isWinner ? '🏆' : '💀'}
        </div>
        <h2
          className={[
            'text-4xl font-black',
            winner === 'liar' ? 'text-liar-text' : 'text-citizen-text',
          ].join(' ')}
        >
          {winner === 'liar' ? '라이어 승!' : '시민 승!'}
        </h2>
        <p
          className={[
            'text-lg font-bold mt-1',
            winner === 'liar' ? 'text-liar-text/70' : 'text-citizen-text/70',
          ].join(' ')}
        >
          {isWinner ? '당신이 이겼습니다! 🎉' : '아쉽게 졌습니다 😢'}
        </p>
      </div>

      {/* 라이어 공개 */}
      <div className="bubble-card p-5 w-full text-center">
        <p className="text-ui-text/50 text-xs mb-3">라이어는...</p>
        <div className="flex items-center justify-center gap-3">
          <Avatar nickname={liarPlayer?.nickname ?? '?'} size="lg" />
          <div>
            <p className="text-2xl font-black text-liar-text">{liarPlayer?.nickname}</p>
            <p className="text-xs text-liar-text/60">🎭 라이어</p>
          </div>
        </div>
      </div>

      {/* 제시어 공개 */}
      <div className="bubble-card p-5 w-full text-center">
        <p className="text-ui-text/50 text-xs mb-2">타겟 인물</p>
        <p className="text-3xl font-black text-citizen-text">{keyword}</p>
      </div>

      {/* 전체 플레이어 */}
      <div className="bubble-card p-4 w-full">
        <p className="text-xs text-ui-text/50 text-center mb-3">이번 게임 참가자</p>
        <div className="flex flex-wrap justify-center gap-3">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <Avatar
                nickname={p.nickname}
                size="sm"
                className={p.id === liarId ? 'ring-2 ring-liar-text rounded-full' : ''}
              />
              {p.id === liarId && (
                <span className="text-xs text-liar-text font-bold">라이어</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 다시하기 */}
      <BubbleButton
        size="lg"
        fullWidth
        onClick={handleRestart}
        className="mt-2"
      >
        다시하기 🔄
      </BubbleButton>
    </div>
  )
}
