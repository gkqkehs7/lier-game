'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { useGame } from '@/context/GameContext'
import { BubbleButton } from '@/components/ui/BubbleButton'

type Tab = 'create' | 'join'

export function Lobby() {
  const [tab, setTab] = useState<Tab>('create')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { emit, on } = useSocket()
  const { dispatch } = useGame()
  const router = useRouter()

  useEffect(() => {
    // URL에 roomId가 있으면 join 탭으로
    const params = new URLSearchParams(window.location.search)
    const code = params.get('room')
    if (code) {
      setTab('join')
      setRoomCode(code.toUpperCase())
    }
  }, [])

  useEffect(() => {
    const offCreated = on('room-created', ({ roomId }) => {
      setLoading(false)
      router.push(`/room/${roomId}`)
    })
    const offJoined = on('room-joined', () => {
      setLoading(false)
    })
    const offError = on('error', ({ message }) => {
      setLoading(false)
      setError(message)
    })
    return () => {
      offCreated()
      offJoined()
      offError()
    }
  }, [on, router])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('닉네임을 입력해 주세요.'); return }
    setError(null)
    setLoading(true)
    dispatch({ type: 'SET_PENDING', nickname: nickname.trim() })
    emit('create-room', { nickname: nickname.trim() })
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('닉네임을 입력해 주세요.'); return }
    if (!roomCode.trim()) { setError('방 코드를 입력해 주세요.'); return }
    setError(null)
    setLoading(true)
    const code = roomCode.trim().toUpperCase()
    dispatch({ type: 'SET_PENDING', nickname: nickname.trim(), roomId: code })
    emit('join-room', { roomId: code, nickname: nickname.trim() })
    router.push(`/room/${code}`)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 gap-8">
      {/* 타이틀 */}
      <div className="text-center">
        <div className="text-6xl mb-3">🕵️</div>
        <h1 className="text-4xl font-black text-ui-text">나는 누구?</h1>
        <p className="text-ui-text/50 text-sm mt-1">인물 맞추기 라이어 게임</p>
      </div>

      {/* 탭 */}
      <div className="w-full bubble-card p-1 flex gap-1">
        <button
          onClick={() => { setTab('create'); setError(null) }}
          className={[
            'flex-1 py-2.5 rounded-full font-bold text-sm transition-all',
            tab === 'create' ? 'bg-ui-text text-white' : 'text-ui-text/60 hover:text-ui-text',
          ].join(' ')}
        >
          방 만들기
        </button>
        <button
          onClick={() => { setTab('join'); setError(null) }}
          className={[
            'flex-1 py-2.5 rounded-full font-bold text-sm transition-all',
            tab === 'join' ? 'bg-ui-text text-white' : 'text-ui-text/60 hover:text-ui-text',
          ].join(' ')}
        >
          방 참여하기
        </button>
      </div>

      {/* 폼 */}
      <form
        onSubmit={tab === 'create' ? handleCreate : handleJoin}
        className="w-full flex flex-col gap-4"
      >
        <div className="bubble-card p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ui-text">닉네임</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(null) }}
              placeholder="게임에서 사용할 이름"
              maxLength={8}
              className="w-full rounded-2xl border-2 border-ui-bg bg-ui-bg px-4 py-3 text-ui-text placeholder-ui-text/40 focus:outline-none focus:border-ui-text transition-colors"
            />
          </label>

          {tab === 'join' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-ui-text">방 코드</span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(null) }}
                placeholder="6자리 코드 입력"
                maxLength={6}
                className="w-full rounded-2xl border-2 border-ui-bg bg-ui-bg px-4 py-3 text-ui-text placeholder-ui-text/40 focus:outline-none focus:border-ui-text transition-colors font-mono tracking-widest text-center text-xl"
              />
            </label>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center font-medium">{error}</p>
        )}

        <BubbleButton
          type="submit"
          size="lg"
          fullWidth
          disabled={loading}
          className={loading ? 'opacity-60 cursor-not-allowed' : ''}
        >
          {loading ? '연결 중...' : tab === 'create' ? '방 만들기 🎮' : '입장하기 🚪'}
        </BubbleButton>
      </form>

      <p className="text-ui-text/30 text-xs text-center">
        최소 4명 · 최대 10명
      </p>
    </div>
  )
}
