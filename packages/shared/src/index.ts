// ===== 플레이어 =====
export interface Player {
  id: string
  nickname: string
  isReady: boolean
}

// ===== 힌트 =====
export interface Hint {
  playerId: string
  text: string | null
  reactions: ReactionCounts
}

export interface ReactionCounts {
  '👀': number
  '😮': number
  '😂': number
  '🤔': number
}

export type ReactionEmoji = keyof ReactionCounts

// ===== 게임 페이즈 =====
export type GamePhase =
  | 'hint'
  | 'reactionSummary'
  | 'vote'
  | 'defense'
  | 'finalVote'
  | 'guessing'
  | 'result'

// ===== 게임 상태 =====
export interface GameState {
  liarId: string
  keyword: string
  round: number
  phase: GamePhase
  turnOrder: string[]
  currentTurnIndex: number
  hints: Hint[]
  votes: Record<string, string>
  finalVotes: Record<string, 'kill' | 'save'>
  accusedId: string | null
}

// ===== 방 상태 =====
export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  roomId: string
  hostId: string
  players: Player[]
  status: RoomStatus
  game: GameState | null
}

// ===== 역할 =====
export type Role = 'liar' | 'citizen'

// ===== 승자 =====
export type Winner = 'liar' | 'citizen'

// ===== 클라이언트 → 서버 이벤트 =====
export interface ClientToServerEvents {
  'create-room': (data: { nickname: string }) => void
  'join-room': (data: { roomId: string; nickname: string }) => void
  'start-game': (data: { roomId: string }) => void
  'submit-hint': (data: { roomId: string; text: string }) => void
  'submit-reaction': (data: { roomId: string; emoji: ReactionEmoji }) => void
  'submit-vote': (data: { roomId: string; targetId: string }) => void
  'submit-defense': (data: { roomId: string; text: string }) => void
  'submit-final-vote': (data: { roomId: string; vote: 'kill' | 'save' }) => void
  'submit-guess': (data: { roomId: string; guess: string }) => void
}

// ===== 서버 → 클라이언트 이벤트 =====
export interface ServerToClientEvents {
  'room-created': (data: { roomId: string; playerId: string }) => void
  'room-joined': (data: { playerId: string }) => void
  'room-updated': (data: { players: Player[]; status: RoomStatus }) => void
  'game-started': (data: { role: Role; keyword?: string; turnOrder: string[] }) => void
  'turn-changed': (data: { currentPlayerId: string; timeLeft: number }) => void
  'hint-submitted': (data: { playerId: string; text: string | null }) => void
  'reaction-updated': (data: { playerId: string; reactions: ReactionCounts }) => void
  'round-ended': (data: { hints: Hint[] }) => void
  'vote-started': (data: { timeLeft: number }) => void
  'vote-updated': (data: { votes: Record<string, string> }) => void
  'defense-started': (data: { accusedId: string }) => void
  'final-vote-started': (data: { timeLeft: number }) => void
  'final-vote-updated': (data: { finalVotes: Record<string, 'kill' | 'save'> }) => void
  'guessing-started': (data: { liarId: string; timeLeft: number }) => void
  'guess-result': (data: { correct: boolean }) => void
  'game-over': (data: { winner: Winner; liarId: string; keyword: string }) => void
  'timer-tick': (data: { timeLeft: number }) => void
  'revote-started': (data: { timeLeft: number }) => void
  'error': (data: { message: string }) => void
}

// ===== 상수 =====
export const GAME_CONSTANTS = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 10,
  MAX_HINT_LENGTH: 5,
  MAX_ROUNDS: 2,
  TIMERS: {
    HINT: 30,
    VOTE: 30,
    REVOTE: 20,
    DEFENSE: 60,
    FINAL_VOTE: 30,
    GUESS: 30,
  },
} as const
