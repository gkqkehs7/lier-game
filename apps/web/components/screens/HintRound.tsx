'use client'

import { useState, useMemo, useEffect } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Avatar } from '@/components/ui/Avatar'
import { Timer } from '@/components/ui/Timer'
import { ReactionBar } from '@/components/ui/ReactionBar'
import { GAME_CONSTANTS } from 'shared'

export function HintRound() {
  const { state } = useGame()
  const { emit } = useSocket()

  const {
    roomId,
    playerId,
    role,
    keyword,
    players,
    currentTurnPlayerId,
    turnOrder,
    hints,
    timeLeft,
  } = state

  const isMyTurn = playerId === currentTurnPlayerId
  const isLiar = role === 'liar'
  const currentPlayer = players.find((p) => p.id === currentTurnPlayerId)

  const [hintText, setHintText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [nameError, setNameError] = useState(false)

  // 차례가 바뀌면 입력 상태 초기화
  useEffect(() => {
    setHintText('')
    setSubmitted(false)
    setNameError(false)
  }, [currentTurnPlayerId])

  // 이름 언급 실시간 감지
  const playerNames = useMemo(() => players.map((p) => p.nickname), [players])

  function handleChange(val: string) {
    // 5글자 제한
    const trimmed = val.slice(0, GAME_CONSTANTS.MAX_HINT_LENGTH)
    // 이름 포함 감지
    const hasName = playerNames.some((name) => trimmed.includes(name))
    setNameError(hasName)
    setHintText(trimmed)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomId || nameError) return
    setSubmitted(true)
    emit('submit-hint', { roomId, text: hintText.trim() })
  }

  function handleSkip() {
    if (!roomId) return
    setSubmitted(true)
    emit('submit-hint', { roomId, text: '' })
  }

  // 현재 진행 상황 (몇 번째 / 전체)
  const currentIndex = turnOrder.indexOf(currentTurnPlayerId ?? '')
  const totalPlayers = turnOrder.length

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      {/* 상단 헤더: 역할 표시 */}
      <div
        className={[
          'rounded-3xl px-5 py-3 flex items-center justify-between',
          isLiar ? 'bg-liar-bg' : 'bg-citizen-bg',
        ].join(' ')}
      >
        <div>
          <p className={['text-xs font-bold', isLiar ? 'text-liar-text/60' : 'text-citizen-text/60'].join(' ')}>
            타겟 인물
          </p>
          <p className={['text-2xl font-black', isLiar ? 'text-liar-text' : 'text-citizen-text'].join(' ')}>
            {isLiar ? '???' : keyword}
          </p>
        </div>
        <span className={['text-xs px-3 py-1 rounded-full font-bold', isLiar ? 'bg-liar-text text-white' : 'bg-citizen-text text-white'].join(' ')}>
          {isLiar ? '라이어' : '시민'}
        </span>
      </div>

      {/* 진행 현황 바 */}
      <div className="flex items-center gap-1">
        {turnOrder.map((id, i) => (
          <div
            key={id}
            className={[
              'flex-1 h-2 rounded-full transition-colors',
              i < hints.length
                ? 'bg-ui-text'
                : i === currentIndex
                ? 'bg-ui-text/40 animate-pulse'
                : 'bg-ui-bg',
            ].join(' ')}
          />
        ))}
      </div>

      {/* 힌트 목록 */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {hints.map((hint, i) => {
          const player = players.find((p) => p.id === hint.playerId)
          return (
            <div key={hint.playerId} className="bubble-card p-4 flex gap-3 items-start animate-bounce_in">
              <Avatar nickname={player?.nickname ?? '?'} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ui-text truncate">{player?.nickname}</span>
                  <span className="text-xs text-ui-text/40">힌트 {i + 1}</span>
                </div>
                <p className="text-ui-text/80 mt-0.5">
                  {hint.text === null ? (
                    <span className="text-ui-text/30 italic">기권</span>
                  ) : (
                    hint.text
                  )}
                </p>
                {/* 리액션 집계 (힌트 받은 이후) */}
                <div className="flex gap-2 mt-2">
                  {(['👀', '😮', '😂', '🤔'] as const).map((emoji) => (
                    hint.reactions[emoji] > 0 && (
                      <span key={emoji} className="text-xs bg-ui-bg rounded-full px-2 py-0.5">
                        {emoji} {hint.reactions[emoji]}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* 현재 입력 중 표시 */}
        {!isMyTurn && currentPlayer && (
          <div className="flex items-center gap-3 px-2">
            <Avatar nickname={currentPlayer.nickname} size="sm" isCurrentTurn />
            <span className="text-sm text-ui-text/50 italic">
              {currentPlayer.nickname}님이 입력 중...
            </span>
            <div className="flex gap-0.5 ml-auto">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-ui-text/30 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력 영역 */}
      {isMyTurn && !submitted ? (
        <div className="flex flex-col gap-3">
          <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.HINT} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={hintText}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={isLiar ? '힌트를 말하세요 (들키지 마세요!)' : `${keyword}을 표현하세요`}
                maxLength={GAME_CONSTANTS.MAX_HINT_LENGTH}
                autoFocus
                className={[
                  'w-full rounded-2xl border-2 px-4 py-3 pr-12 text-ui-text',
                  'bg-white focus:outline-none transition-colors text-lg',
                  nameError
                    ? 'border-red-400 bg-red-50'
                    : 'border-ui-bg focus:border-ui-text',
                ].join(' ')}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ui-text/40">
                {hintText.length}/{GAME_CONSTANTS.MAX_HINT_LENGTH}
              </span>
            </div>

            {nameError && (
              <p className="text-red-500 text-xs text-center font-medium">
                이름을 직접 언급할 수 없습니다!
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-none py-3 px-5 rounded-full border-2 border-ui-text/20 text-ui-text/40 text-sm font-bold active:scale-95 transition-transform"
              >
                기권
              </button>
              <button
                type="submit"
                disabled={nameError || hintText.trim() === ''}
                className={[
                  'flex-1 py-3 rounded-full font-bold text-white transition-all active:scale-95',
                  nameError || hintText.trim() === ''
                    ? 'bg-ui-text/30 cursor-not-allowed'
                    : 'bg-ui-text',
                ].join(' ')}
              >
                제출 ✓
              </button>
            </div>
          </form>
        </div>
      ) : isMyTurn && submitted ? (
        <div className="bubble-card p-4 text-center text-ui-text/50 text-sm">
          제출 완료! 다른 플레이어를 기다리는 중...
        </div>
      ) : (
        /* 대기 중 — 리액션만 가능 */
        <div className="flex flex-col gap-3">
          <Timer timeLeft={timeLeft} total={GAME_CONSTANTS.TIMERS.HINT} />
          <div className="bubble-card p-4 flex flex-col gap-3">
            <p className="text-center text-sm text-ui-text/60">리액션을 남겨보세요</p>
            <ReactionBar />
          </div>
        </div>
      )}
    </div>
  )
}
