import { Server, Socket } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents, GAME_CONSTANTS } from 'shared'
import { RoomManager } from '../game/RoomManager'
import { GameManager } from '../game/GameManager'
import { TimerManager } from '../game/TimerManager'

type IO = Server<ClientToServerEvents, ServerToClientEvents>
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>

// socket.id → roomId 매핑 (메모리, 빠른 조회용)
const socketRoomMap = new Map<string, string>()

export function registerSocketHandlers(io: IO): void {
  const roomManager = new RoomManager()
  const timerManager = new TimerManager(io)
  const gameManager = new GameManager(io, roomManager, timerManager)

  io.on('connection', (socket: Sock) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    // ===== 방 생성 =====
    socket.on('create-room', async ({ nickname, roomName }) => {
      try {
        const room = await roomManager.createRoom(socket.id, nickname, roomName)
        socket.join(room.roomId)
        socketRoomMap.set(socket.id, room.roomId)
        socket.emit('room-created', { roomId: room.roomId, playerId: socket.id })
        io.to(room.roomId).emit('room-updated', {
          players: room.players,
          status: room.status,
          roomName: room.roomName,
        })
        console.log(`[Room] Created: ${room.roomId} by ${nickname}`)
      } catch (err) {
        socket.emit('error', { message: '방 생성 실패' })
      }
    })

    // ===== 방 참여 =====
    socket.on('join-room', async ({ roomId, nickname }) => {
      try {
        const room = await roomManager.getRoom(roomId)
        if (!room) {
          socket.emit('error', { message: '존재하지 않는 방입니다.' })
          return
        }
        if (room.status !== 'waiting') {
          socket.emit('error', { message: '이미 게임이 시작된 방입니다.' })
          return
        }
        if (room.players.length >= GAME_CONSTANTS.MAX_PLAYERS) {
          socket.emit('error', { message: '방이 가득 찼습니다.' })
          return
        }
        const nicknameExists = room.players.some((p) => p.nickname === nickname)
        if (nicknameExists) {
          socket.emit('error', { message: '이미 사용 중인 닉네임입니다.' })
          return
        }

        const updatedRoom = await roomManager.addPlayer(roomId, socket.id, nickname)
        if (!updatedRoom) return

        socket.join(roomId)
        socketRoomMap.set(socket.id, roomId)
        socket.emit('room-joined', { playerId: socket.id })
        io.to(roomId).emit('room-updated', {
          players: updatedRoom.players,
          status: updatedRoom.status,
          roomName: updatedRoom.roomName,
        })
        console.log(`[Room] ${nickname} joined ${roomId}`)
      } catch (err) {
        socket.emit('error', { message: '방 참여 실패' })
      }
    })

    // ===== 게임 시작 =====
    socket.on('start-game', async ({ roomId }) => {
      try {
        const room = await roomManager.getRoom(roomId)
        if (!room) return
        if (room.players.length < GAME_CONSTANTS.MIN_PLAYERS) {
          socket.emit('error', { message: `최소 ${GAME_CONSTANTS.MIN_PLAYERS}명이 필요합니다.` })
          return
        }
        await gameManager.startGame(roomId, socket.id)
      } catch (err) {
        socket.emit('error', { message: '게임 시작 실패' })
      }
    })

    // ===== 힌트 제출 =====
    socket.on('submit-hint', async ({ roomId, text }) => {
      // 이름 직접 언급 감지는 서버에서도 처리 (이중 검증)
      const room = await roomManager.getRoom(roomId)
      if (room?.game) {
        const playerNames = room.players.map((p) => p.nickname)
        const containsName = playerNames.some((name) => text.includes(name))
        if (containsName) {
          socket.emit('error', { message: '이름을 직접 언급할 수 없습니다.' })
          return
        }
      }
      await gameManager.submitHint(roomId, socket.id, text)
    })

    // ===== 리액션 =====
    socket.on('submit-reaction', async ({ roomId, emoji }) => {
      await gameManager.submitReaction(roomId, socket.id, emoji)
    })

    // ===== 1차 투표 =====
    socket.on('submit-vote', async ({ roomId, targetId }) => {
      await gameManager.submitVote(roomId, socket.id, targetId)
    })

    // ===== 해명 =====
    socket.on('submit-defense', async ({ roomId, text }) => {
      await gameManager.submitDefense(roomId, socket.id, text)
    })

    // ===== 확정 투표 =====
    socket.on('submit-final-vote', async ({ roomId, vote }) => {
      await gameManager.submitFinalVote(roomId, socket.id, vote)
    })

    // ===== 제시어 맞히기 =====
    socket.on('submit-guess', async ({ roomId, guess }) => {
      await gameManager.submitGuess(roomId, socket.id, guess)
    })

    // ===== 연결 해제 =====
    socket.on('disconnect', async () => {
      const roomId = socketRoomMap.get(socket.id)
      socketRoomMap.delete(socket.id)

      if (!roomId) return

      const updatedRoom = await roomManager.removePlayer(roomId, socket.id)
      if (updatedRoom) {
        io.to(roomId).emit('room-updated', {
          players: updatedRoom.players,
          status: updatedRoom.status,
          roomName: updatedRoom.roomName,
        })
      }

      console.log(`[Socket] Disconnected: ${socket.id} from room ${roomId}`)
    })
  })
}
