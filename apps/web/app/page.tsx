'use client'

import { GameProvider } from '@/context/GameContext'
import { Lobby } from '@/components/screens/Lobby'

export default function HomePage() {
  return (
    <GameProvider>
      <Lobby />
    </GameProvider>
  )
}
