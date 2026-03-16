'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/context/GameContext'

export function RoleReveal() {
  const { state, dispatch } = useGame()
  const { role, keyword } = state
  const isLiar = role === 'liar'
  const [countdown, setCountdown] = useState(5)

  // 5초 후 힌트 라운드로 자동 전환 (turn-changed 이벤트가 처리)
  // 여기서는 카운트다운 표시만
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div
      className={[
        'flex flex-col items-center justify-center flex-1 px-6 py-12 gap-8 transition-colors duration-500',
        isLiar ? 'bg-liar-bg' : 'bg-citizen-bg',
      ].join(' ')}
    >
      {/* 아이콘 */}
      <div className="text-7xl animate-bounce_in">
        {isLiar ? '🎭' : '🕵️'}
      </div>

      {/* 역할 */}
      <div className="text-center flex flex-col gap-2">
        <p className={['text-sm font-bold', isLiar ? 'text-liar-text/60' : 'text-citizen-text/60'].join(' ')}>
          당신의 역할
        </p>
        <h2 className={['text-5xl font-black', isLiar ? 'text-liar-text' : 'text-citizen-text'].join(' ')}>
          {isLiar ? '라이어' : '시민'}
        </h2>
      </div>

      {/* 제시어 카드 */}
      <div
        className={[
          'w-full rounded-4xl p-6 text-center',
          isLiar ? 'bg-liar-text/10 border-2 border-liar-text/20' : 'bg-citizen-text/10 border-2 border-citizen-text/20',
        ].join(' ')}
      >
        <p className={['text-xs font-bold mb-2', isLiar ? 'text-liar-text/60' : 'text-citizen-text/60'].join(' ')}>
          {isLiar ? '타겟 인물' : '타겟 인물'}
        </p>
        <p className={['text-4xl font-black tracking-wide', isLiar ? 'text-liar-text' : 'text-citizen-text'].join(' ')}>
          {isLiar ? '???' : keyword}
        </p>
        {isLiar && (
          <p className="text-liar-text/50 text-xs mt-2">
            다른 플레이어들이 힌트를 말합니다. 잘 섞여 들어가세요!
          </p>
        )}
      </div>

      {/* 안내 */}
      <div className={['rounded-3xl p-4 w-full text-sm', isLiar ? 'bg-liar-text/10' : 'bg-citizen-text/10'].join(' ')}>
        {isLiar ? (
          <ul className="text-liar-text/70 flex flex-col gap-1 text-center">
            <li>제시어를 모르지만 아는 척 힌트를 말하세요</li>
            <li>절대 들키면 안 됩니다!</li>
          </ul>
        ) : (
          <ul className="text-citizen-text/70 flex flex-col gap-1 text-center">
            <li>이름을 <strong>직접 언급하지 말고</strong> 힌트를 말하세요</li>
            <li>라이어를 찾아내세요!</li>
          </ul>
        )}
      </div>

      {/* 카운트다운 */}
      <div className="flex flex-col items-center gap-1">
        <p className={['text-xs', isLiar ? 'text-liar-text/40' : 'text-citizen-text/40'].join(' ')}>
          힌트 라운드까지
        </p>
        <span className={['text-3xl font-black', isLiar ? 'text-liar-text' : 'text-citizen-text'].join(' ')}>
          {countdown > 0 ? countdown : '시작!'}
        </span>
      </div>
    </div>
  )
}
