'use client'

import { useParams } from 'next/navigation'
import { GameProvider, useGame } from '@/context/GameContext'
import { WaitingRoom } from '@/components/screens/WaitingRoom'
import { RoleReveal } from '@/components/screens/RoleReveal'
import { HintRound } from '@/components/screens/HintRound'
import { ReactionSummary } from '@/components/screens/ReactionSummary'
import { Vote } from '@/components/screens/Vote'
import { Defense } from '@/components/screens/Defense'
import { FinalVote } from '@/components/screens/FinalVote'
import { GuessingWord } from '@/components/screens/GuessingWord'
import { Result } from '@/components/screens/Result'

function GameScreen() {
  const { state } = useGame()

  switch (state.screen) {
    case 'lobby':
      // 링크 직접 접근 시 연결 중 표시
      return <LoadingScreen />
    case 'waiting':
      return <WaitingRoom />
    case 'roleReveal':
      return <RoleReveal />
    case 'hint':
      return <HintRound />
    case 'reactionSummary':
      return <ReactionSummary />
    case 'vote':
      return <Vote />
    case 'defense':
      return <Defense />
    case 'finalVote':
      return <FinalVote />
    case 'guessing':
      return <GuessingWord />
    case 'result':
      return <Result />
    default:
      return <LoadingScreen />
  }
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="text-5xl animate-bounce">🕵️</div>
      <p className="text-ui-text/50 text-sm">연결 중...</p>
    </div>
  )
}

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  return (
    <GameProvider initialRoomId={roomId}>
      <GameScreen />
    </GameProvider>
  )
}
