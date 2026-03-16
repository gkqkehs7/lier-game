'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { Player, Role, GamePhase, Hint, Winner } from 'shared'
import { useSocket } from '@/hooks/useSocket'

// ===== 상태 타입 =====
export type AppScreen =
  | 'lobby'
  | 'waiting'
  | 'roleReveal'
  | 'hint'
  | 'reactionSummary'
  | 'vote'
  | 'defense'
  | 'finalVote'
  | 'guessing'
  | 'result'

export interface GameState {
  screen: AppScreen
  roomId: string | null
  playerId: string | null
  nickname: string | null
  pendingNickname: string | null  // emit 후 서버 응답 전까지 임시 보관
  pendingRoomId: string | null    // join-room emit 후 임시 보관
  isHost: boolean
  players: Player[]
  role: Role | null
  keyword: string | null        // 시민만 알고 있음
  turnOrder: string[]
  currentTurnPlayerId: string | null
  hints: Hint[]
  votes: Record<string, string>
  finalVotes: Record<string, 'kill' | 'save'>
  accusedId: string | null
  timeLeft: number
  gameResult: { winner: Winner; liarId: string; keyword: string } | null
  error: string | null
}

const initialState: GameState = {
  screen: 'lobby',
  roomId: null,
  playerId: null,
  nickname: null,
  pendingNickname: null,
  pendingRoomId: null,
  isHost: false,
  players: [],
  role: null,
  keyword: null,
  turnOrder: [],
  currentTurnPlayerId: null,
  hints: [],
  votes: {},
  finalVotes: {},
  accusedId: null,
  timeLeft: 0,
  gameResult: null,
  error: null,
}

// ===== 액션 타입 =====
type Action =
  | { type: 'SET_PENDING'; nickname: string; roomId?: string }
  | { type: 'ROOM_CREATED'; roomId: string; playerId: string }
  | { type: 'ROOM_JOINED'; playerId: string }
  | { type: 'ROOM_UPDATED'; players: Player[] }
  | { type: 'GAME_STARTED'; role: Role; keyword?: string; turnOrder: string[] }
  | { type: 'TURN_CHANGED'; currentPlayerId: string; timeLeft: number }
  | { type: 'HINT_SUBMITTED'; playerId: string; text: string | null }
  | { type: 'REACTION_UPDATED'; playerId: string; reactions: Hint['reactions'] }
  | { type: 'ROUND_ENDED'; hints: Hint[] }
  | { type: 'VOTE_STARTED'; timeLeft: number }
  | { type: 'VOTE_UPDATED'; votes: Record<string, string> }
  | { type: 'DEFENSE_STARTED'; accusedId: string }
  | { type: 'FINAL_VOTE_STARTED'; timeLeft: number }
  | { type: 'FINAL_VOTE_UPDATED'; finalVotes: Record<string, 'kill' | 'save'> }
  | { type: 'GUESSING_STARTED'; liarId: string; timeLeft: number }
  | { type: 'GAME_OVER'; winner: Winner; liarId: string; keyword: string }
  | { type: 'TIMER_TICK'; timeLeft: number }
  | { type: 'SET_ERROR'; message: string | null }
  | { type: 'RESET' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_PENDING':
      return {
        ...state,
        pendingNickname: action.nickname,
        pendingRoomId: action.roomId ?? null,
      }
    case 'ROOM_CREATED':
      return {
        ...state,
        screen: 'waiting',
        roomId: action.roomId,
        playerId: action.playerId,
        nickname: state.pendingNickname,
        isHost: true,
        pendingNickname: null,
        error: null,
      }
    case 'ROOM_JOINED':
      return {
        ...state,
        screen: 'waiting',
        roomId: state.pendingRoomId,
        playerId: action.playerId,
        nickname: state.pendingNickname,
        isHost: false,
        pendingNickname: null,
        pendingRoomId: null,
        error: null,
      }
    case 'ROOM_UPDATED':
      return { ...state, players: action.players }
    case 'GAME_STARTED':
      return {
        ...state,
        screen: 'roleReveal',
        role: action.role,
        keyword: action.keyword ?? null,
        turnOrder: action.turnOrder,
        hints: [],
        votes: {},
        finalVotes: {},
        accusedId: null,
        gameResult: null,
      }
    case 'TURN_CHANGED':
      return {
        ...state,
        screen: 'hint',
        currentTurnPlayerId: action.currentPlayerId,
        timeLeft: action.timeLeft,
      }
    case 'HINT_SUBMITTED': {
      const existing = state.hints.find((h) => h.playerId === action.playerId)
      if (existing) return state
      return {
        ...state,
        hints: [
          ...state.hints,
          { playerId: action.playerId, text: action.text, reactions: { '👀': 0, '😮': 0, '😂': 0, '🤔': 0 } },
        ],
      }
    }
    case 'REACTION_UPDATED':
      return {
        ...state,
        hints: state.hints.map((h) =>
          h.playerId === action.playerId ? { ...h, reactions: action.reactions } : h
        ),
      }
    case 'ROUND_ENDED':
      return { ...state, screen: 'reactionSummary', hints: action.hints }
    case 'VOTE_STARTED':
      return { ...state, screen: 'vote', timeLeft: action.timeLeft, votes: {} }
    case 'VOTE_UPDATED':
      return { ...state, votes: action.votes }
    case 'DEFENSE_STARTED':
      return { ...state, screen: 'defense', accusedId: action.accusedId }
    case 'FINAL_VOTE_STARTED':
      return { ...state, screen: 'finalVote', timeLeft: action.timeLeft, finalVotes: {} }
    case 'FINAL_VOTE_UPDATED':
      return { ...state, finalVotes: action.finalVotes }
    case 'GUESSING_STARTED':
      return { ...state, screen: 'guessing', timeLeft: action.timeLeft }
    case 'GAME_OVER':
      return {
        ...state,
        screen: 'result',
        gameResult: { winner: action.winner, liarId: action.liarId, keyword: action.keyword },
      }
    case 'TIMER_TICK':
      return { ...state, timeLeft: action.timeLeft }
    case 'SET_ERROR':
      return { ...state, error: action.message }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

// ===== Context =====
interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children, initialRoomId }: { children: ReactNode; initialRoomId?: string }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    roomId: initialRoomId ?? null,
  })
  const { on } = useSocket()

  useEffect(() => {
    const offs = [
      on('room-created', ({ roomId, playerId }) => {
        dispatch({ type: 'ROOM_CREATED', roomId, playerId })
      }),
      on('room-joined', ({ playerId }) => {
        dispatch({ type: 'ROOM_JOINED', playerId })
      }),
      on('room-updated', ({ players }) => {
        dispatch({ type: 'ROOM_UPDATED', players })
      }),
      on('game-started', ({ role, keyword, turnOrder }) => {
        dispatch({ type: 'GAME_STARTED', role, keyword, turnOrder })
      }),
      on('turn-changed', ({ currentPlayerId, timeLeft }) => {
        dispatch({ type: 'TURN_CHANGED', currentPlayerId, timeLeft })
      }),
      on('hint-submitted', ({ playerId, text }) => {
        dispatch({ type: 'HINT_SUBMITTED', playerId, text })
      }),
      on('reaction-updated', ({ playerId, reactions }) => {
        dispatch({ type: 'REACTION_UPDATED', playerId, reactions })
      }),
      on('round-ended', ({ hints }) => {
        dispatch({ type: 'ROUND_ENDED', hints })
      }),
      on('vote-started', ({ timeLeft }) => {
        dispatch({ type: 'VOTE_STARTED', timeLeft })
      }),
      on('vote-updated', ({ votes }) => {
        dispatch({ type: 'VOTE_UPDATED', votes })
      }),
      on('defense-started', ({ accusedId }) => {
        dispatch({ type: 'DEFENSE_STARTED', accusedId })
      }),
      on('final-vote-started', ({ timeLeft }) => {
        dispatch({ type: 'FINAL_VOTE_STARTED', timeLeft })
      }),
      on('final-vote-updated', ({ finalVotes }) => {
        dispatch({ type: 'FINAL_VOTE_UPDATED', finalVotes })
      }),
      on('guessing-started', ({ liarId, timeLeft }) => {
        dispatch({ type: 'GUESSING_STARTED', liarId, timeLeft })
      }),
      on('game-over', ({ winner, liarId, keyword }) => {
        dispatch({ type: 'GAME_OVER', winner, liarId, keyword })
      }),
      on('timer-tick', ({ timeLeft }) => {
        dispatch({ type: 'TIMER_TICK', timeLeft })
      }),
      on('error', ({ message }) => {
        dispatch({ type: 'SET_ERROR', message })
      }),
    ]
    return () => offs.forEach((off) => off())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
