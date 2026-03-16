import { Server, Socket } from 'socket.io'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  GameState,
  GamePhase,
  Hint,
  GAME_CONSTANTS,
} from 'shared'
import { RoomManager } from './RoomManager'
import { TimerManager } from './TimerManager'

type IO = Server<ClientToServerEvents, ServerToClientEvents>

export class GameManager {
  constructor(
    private io: IO,
    private roomManager: RoomManager,
    private timerManager: TimerManager
  ) {}

  async startGame(roomId: string, hostId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room) return
    if (room.hostId !== hostId) return
    if (room.players.length < GAME_CONSTANTS.MIN_PLAYERS) return

    const players = room.players
    const liarIndex = Math.floor(Math.random() * players.length)
    const liarId = players[liarIndex].id

    // keyword = 타겟 인물 (라이어 제외한 플레이어 중 랜덤)
    const citizenPlayers = players.filter((p) => p.id !== liarId)
    const keyword = citizenPlayers[Math.floor(Math.random() * citizenPlayers.length)].nickname

    // 턴 순서 셔플
    const turnOrder = [...players.map((p) => p.id)].sort(() => Math.random() - 0.5)

    room.status = 'playing'
    room.game = {
      liarId,
      keyword,
      round: 1,
      phase: 'hint',
      turnOrder,
      currentTurnIndex: 0,
      hints: [],
      votes: {},
      finalVotes: {},
      accusedId: null,
    }

    await this.roomManager.saveRoom(room)

    // 각 플레이어에게 역할 전송
    for (const player of players) {
      const socket = this.io.sockets.sockets.get(player.id)
      if (!socket) continue

      if (player.id === liarId) {
        socket.emit('game-started', { role: 'liar', turnOrder })
      } else {
        socket.emit('game-started', { role: 'citizen', keyword, turnOrder })
      }
    }

    // 역할 공개 화면을 5초 동안 보여준 뒤 첫 턴 시작
    setTimeout(() => this.startTurn(roomId, room), 5000)
  }

  private startTurn(roomId: string, room: Room): void {
    if (!room.game) return

    const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex]
    this.io.to(roomId).emit('turn-changed', {
      currentPlayerId,
      timeLeft: GAME_CONSTANTS.TIMERS.HINT,
    })

    this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.HINT, async () => {
      // 시간 초과 → 기권 처리
      await this.submitHint(roomId, currentPlayerId, '')
    })
  }

  async submitHint(roomId: string, playerId: string, text: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'hint') return

    const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex]
    if (currentPlayerId !== playerId) return

    this.timerManager.clear(roomId)

    const hint: Hint = {
      playerId,
      text: text.trim() === '' ? null : text.trim().slice(0, GAME_CONSTANTS.MAX_HINT_LENGTH),
      reactions: { '👀': 0, '😮': 0, '😂': 0, '🤔': 0 },
    }
    room.game.hints.push(hint)

    this.io.to(roomId).emit('hint-submitted', { playerId, text: hint.text })

    room.game.currentTurnIndex++

    if (room.game.currentTurnIndex >= room.game.turnOrder.length) {
      // 한 바퀴 완료 → 리액션 집계 (5초 후 자동으로 투표 시작)
      room.game.phase = 'reactionSummary'
      await this.roomManager.saveRoom(room)
      this.io.to(roomId).emit('round-ended', { hints: room.game.hints })
      setTimeout(() => this.startVote(roomId), 5000)
    } else {
      await this.roomManager.saveRoom(room)
      this.startTurn(roomId, room)
    }
  }

  async submitReaction(roomId: string, playerId: string, emoji: '👀' | '😮' | '😂' | '🤔'): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'hint') return

    const currentPlayerId = room.game.turnOrder[room.game.currentTurnIndex]
    if (currentPlayerId === playerId) return // 현재 차례인 사람은 리액션 불가

    // 마지막 힌트에 리액션 추가
    const lastHint = room.game.hints[room.game.hints.length - 1]
    if (!lastHint) return

    lastHint.reactions[emoji]++
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('reaction-updated', {
      playerId: lastHint.playerId,
      reactions: lastHint.reactions,
    })
  }

  async startVote(roomId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return

    room.game.phase = 'vote'
    room.game.votes = {}
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('vote-started', { timeLeft: GAME_CONSTANTS.TIMERS.VOTE })
    this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.VOTE, async () => {
      await this.resolveVote(roomId)
    })
  }

  async submitVote(roomId: string, voterId: string, targetId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'vote') return

    room.game.votes[voterId] = targetId
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('vote-updated', { votes: room.game.votes })

    // 저장 후 최신 상태 재조회 → race condition 방지
    const latest = await this.roomManager.getRoom(roomId)
    if (!latest?.game || latest.game.phase !== 'vote') return
    if (Object.keys(latest.game.votes).length >= latest.players.length) {
      this.timerManager.clear(roomId)
      await this.resolveVote(roomId)
    }
  }

  private async resolveVote(roomId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'vote') return  // 중복 실행 방지

    const voteCounts: Record<string, number> = {}
    for (const targetId of Object.values(room.game.votes)) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
    }

    const maxVotes = Math.max(...Object.values(voteCounts))
    const topCandidates = Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([id]) => id)

    if (topCandidates.length > 1) {
      // 동률 → 재투표
      room.game.votes = {}
      await this.roomManager.saveRoom(room)
      this.io.to(roomId).emit('revote-started', { timeLeft: GAME_CONSTANTS.TIMERS.REVOTE })
      this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.REVOTE, async () => {
        await this.resolveVote(roomId)
      })
      return
    }

    const accusedId = topCandidates[0]
    room.game.accusedId = accusedId
    room.game.phase = 'defense'
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('defense-started', { accusedId })

    this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.DEFENSE, async () => {
      await this.startFinalVote(roomId)
    })
  }

  async submitDefense(roomId: string, playerId: string, text: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'defense') return
    if (room.game.accusedId !== playerId) return

    // 해명 텍스트는 hint-submitted 이벤트 재활용
    this.io.to(roomId).emit('hint-submitted', { playerId, text })
  }

  private async startFinalVote(roomId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return

    room.game.phase = 'finalVote'
    room.game.finalVotes = {}
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('final-vote-started', { timeLeft: GAME_CONSTANTS.TIMERS.FINAL_VOTE })
    this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.FINAL_VOTE, async () => {
      await this.resolveFinalVote(roomId)
    })
  }

  async submitFinalVote(roomId: string, voterId: string, vote: 'kill' | 'save'): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'finalVote') return

    room.game.finalVotes[voterId] = vote
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('final-vote-updated', { finalVotes: room.game.finalVotes })

    // 저장 후 최신 상태 재조회 → race condition 방지
    const latest = await this.roomManager.getRoom(roomId)
    if (!latest?.game || latest.game.phase !== 'finalVote') return
    if (Object.keys(latest.game.finalVotes).length >= latest.players.length) {
      this.timerManager.clear(roomId)
      await this.resolveFinalVote(roomId)
    }
  }

  private async resolveFinalVote(roomId: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return

    const killCount = Object.values(room.game.finalVotes).filter((v) => v === 'kill').length
    const saveCount = Object.values(room.game.finalVotes).filter((v) => v === 'save').length

    if (killCount > saveCount) {
      const accusedId = room.game.accusedId!
      if (accusedId !== room.game.liarId) {
        // 무고한 시민이 죽음 → 라이어 승
        await this.endGame(roomId, 'liar')
      } else {
        // 라이어 적중 → 제시어 맞히기
        room.game.phase = 'guessing'
        await this.roomManager.saveRoom(room)

        this.io.to(roomId).emit('guessing-started', { liarId: room.game.liarId, timeLeft: GAME_CONSTANTS.TIMERS.GUESS })
        this.timerManager.start(roomId, GAME_CONSTANTS.TIMERS.GUESS, async () => {
          // 시간 초과 → 시민 승
          await this.endGame(roomId, 'citizen')
        })
      }
    } else {
      // 살리자 우세 or 동률 → 다음 라운드 또는 라이어 승
      if (room.game.round >= GAME_CONSTANTS.MAX_ROUNDS) {
        await this.endGame(roomId, 'liar')
      } else {
        room.game.round++
        room.game.phase = 'hint'
        room.game.currentTurnIndex = 0
        room.game.hints = []
        room.game.votes = {}
        room.game.finalVotes = {}
        room.game.accusedId = null
        await this.roomManager.saveRoom(room)
        this.startTurn(roomId, room)
      }
    }
  }

  async submitGuess(roomId: string, playerId: string, guess: string): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return
    if (room.game.phase !== 'guessing') return
    if (room.game.liarId !== playerId) return

    this.timerManager.clear(roomId)

    const correct = guess.trim() === room.game.keyword
    this.io.to(roomId).emit('guess-result', { correct })

    await this.endGame(roomId, correct ? 'liar' : 'citizen')
  }

  private async endGame(roomId: string, winner: 'liar' | 'citizen'): Promise<void> {
    const room = await this.roomManager.getRoom(roomId)
    if (!room?.game) return

    this.timerManager.clear(roomId)

    room.game.phase = 'result'
    room.status = 'finished'
    await this.roomManager.saveRoom(room)

    this.io.to(roomId).emit('game-over', {
      winner,
      liarId: room.game.liarId,
      keyword: room.game.keyword,
    })
  }
}
