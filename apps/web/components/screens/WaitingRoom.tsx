'use client'

import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSocket } from '@/hooks/useSocket'
import { Avatar } from '@/components/ui/Avatar'
import { BubbleButton } from '@/components/ui/BubbleButton'
import { GAME_CONSTANTS } from 'shared'

export function WaitingRoom() {
  const { state } = useGame()
  const { emit } = useSocket()
  const [copied, setCopied] = useState(false)

  const { roomId, players, playerId, isHost } = state
  const playerCount = players.length
  const canStart = isHost && playerCount >= GAME_CONSTANTS.MIN_PLAYERS
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${roomId}`
    : ''

  function handleCopy() {
    if (!roomId) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleStart() {
    if (!roomId) return
    emit('start-game', { roomId })
  }

  return (
    <div className="flex flex-col flex-1 px-6 py-8 gap-6">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-ui-text/50 text-sm mb-1">방 코드</p>
        <h2 className="text-4xl font-black text-ui-text tracking-widest font-mono">{roomId}</h2>
      </div>

      {/* 링크 공유 */}
      <button
        onClick={handleCopy}
        className="bubble-card p-4 flex items-center justify-between gap-3 active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">🔗</span>
          <span className="text-sm text-ui-text/60 truncate">{shareUrl}</span>
        </div>
        <span className={[
          'text-sm font-bold shrink-0 transition-colors',
          copied ? 'text-citizen-text' : 'text-ui-text',
        ].join(' ')}>
          {copied ? '복사됨 ✓' : '복사'}
        </span>
      </button>

      {/* 참여자 목록 */}
      <div className="bubble-card p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ui-text">참여자</h3>
          <span className="text-sm text-ui-text/50">
            {playerCount} / {GAME_CONSTANTS.MAX_PLAYERS}명
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {players.map((p) => (
            <Avatar
              key={p.id}
              nickname={p.nickname}
              size="md"
              isHost={p.id === state.players[0]?.id}
            />
          ))}
          {/* 빈 슬롯 */}
          {Array.from({ length: Math.max(0, GAME_CONSTANTS.MIN_PLAYERS - playerCount) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 rounded-full bg-ui-bg border-2 border-dashed border-ui-text/20 mx-auto"
            />
          ))}
        </div>

        {playerCount < GAME_CONSTANTS.MIN_PLAYERS && (
          <p className="text-center text-ui-text/40 text-xs mt-4">
            게임 시작까지 {GAME_CONSTANTS.MIN_PLAYERS - playerCount}명 더 필요해요
          </p>
        )}
      </div>

      {/* 시작 버튼 (방장만) */}
      {isHost ? (
        <div className="flex flex-col gap-2">
          <BubbleButton
            size="lg"
            fullWidth
            onClick={handleStart}
            disabled={!canStart}
            className={!canStart ? 'opacity-40 cursor-not-allowed' : ''}
          >
            게임 시작 🚀
          </BubbleButton>
          {!canStart && (
            <p className="text-center text-ui-text/40 text-xs">
              최소 {GAME_CONSTANTS.MIN_PLAYERS}명부터 시작 가능
            </p>
          )}
        </div>
      ) : (
        <div className="bubble-card p-4 text-center text-ui-text/50 text-sm">
          방장이 게임을 시작할 때까지 기다려 주세요 ⏳
        </div>
      )}
    </div>
  )
}
