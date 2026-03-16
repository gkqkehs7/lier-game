import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Redis 연결 실패 시 메모리 폴백
const memStore = new Map<string, string>()

let redisAvailable = false

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 1) return null
    return 500
  },
  lazyConnect: true,
})

redis.on('connect', () => {
  redisAvailable = true
  console.log('[Redis] Connected')
})

redis.on('error', (err) => {
  redisAvailable = false
  // 최초 1회만 출력
  if (!memStore.has('_err_logged')) {
    console.warn('[Redis] Unavailable, using in-memory store:', err.message)
    memStore.set('_err_logged', '1')
  }
})

// 연결 시도 (실패해도 계속 진행)
redis.connect().catch(() => {})

const ROOM_TTL_MS = 60 * 60 * 2 * 1000 // 2시간 (메모리 TTL용)

export async function getRoom(roomId: string) {
  if (redisAvailable) {
    try {
      const data = await redis.get(`room:${roomId}`)
      return data ? JSON.parse(data) : null
    } catch {
      // fall through to memory
    }
  }
  const data = memStore.get(`room:${roomId}`)
  return data ? JSON.parse(data) : null
}

export async function setRoom(roomId: string, room: unknown) {
  const json = JSON.stringify(room)
  if (redisAvailable) {
    try {
      await redis.set(`room:${roomId}`, json, 'EX', ROOM_TTL_MS / 1000)
      return
    } catch {
      // fall through to memory
    }
  }
  memStore.set(`room:${roomId}`, json)
  // 메모리 TTL 자동 삭제
  setTimeout(() => memStore.delete(`room:${roomId}`), ROOM_TTL_MS)
}

export async function deleteRoom(roomId: string) {
  if (redisAvailable) {
    try {
      await redis.del(`room:${roomId}`)
    } catch {
      // fall through
    }
  }
  memStore.delete(`room:${roomId}`)
}
