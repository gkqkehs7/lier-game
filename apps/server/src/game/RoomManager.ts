import { Room, Player, RoomStatus } from 'shared'
import { getRoom, setRoom, deleteRoom } from '../redis/client'

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

export class RoomManager {
  async createRoom(hostId: string, nickname: string): Promise<Room> {
    const roomId = generateRoomId()
    const room: Room = {
      roomId,
      hostId,
      players: [{ id: hostId, nickname, isReady: true }],
      status: 'waiting',
      game: null,
    }
    await setRoom(roomId, room)
    return room
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return getRoom(roomId)
  }

  async addPlayer(roomId: string, playerId: string, nickname: string): Promise<Room | null> {
    const room = await this.getRoom(roomId)
    if (!room) return null

    const exists = room.players.find((p) => p.id === playerId)
    if (exists) return room

    room.players.push({ id: playerId, nickname, isReady: false })
    await setRoom(roomId, room)
    return room
  }

  async removePlayer(roomId: string, playerId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId)
    if (!room) return null

    room.players = room.players.filter((p) => p.id !== playerId)

    // 방에 아무도 없으면 삭제
    if (room.players.length === 0) {
      await deleteRoom(roomId)
      return null
    }

    // 방장이 나가면 다음 플레이어가 방장
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id
    }

    await setRoom(roomId, room)
    return room
  }

  async updateStatus(roomId: string, status: RoomStatus): Promise<void> {
    const room = await this.getRoom(roomId)
    if (!room) return
    room.status = status
    await setRoom(roomId, room)
  }

  async saveRoom(room: Room): Promise<void> {
    await setRoom(room.roomId, room)
  }

  async deleteRoom(roomId: string): Promise<void> {
    await deleteRoom(roomId)
  }
}
