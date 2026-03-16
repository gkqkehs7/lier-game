import { Server } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents } from 'shared'

type IO = Server<ClientToServerEvents, ServerToClientEvents>

interface TimerEntry {
  interval: NodeJS.Timeout
  timeout: NodeJS.Timeout
  timeLeft: number
}

export class TimerManager {
  private timers = new Map<string, TimerEntry>()
  private io: IO

  constructor(io: IO) {
    this.io = io
  }

  start(roomId: string, seconds: number, onEnd: () => void): void {
    this.clear(roomId)

    let timeLeft = seconds

    const interval = setInterval(() => {
      timeLeft--
      this.io.to(roomId).emit('timer-tick', { timeLeft })

      if (timeLeft <= 0) {
        this.clear(roomId)
      }
    }, 1000)

    const timeout = setTimeout(() => {
      this.clear(roomId)
      onEnd()
    }, seconds * 1000)

    this.timers.set(roomId, { interval, timeout, timeLeft: seconds })

    // 즉시 첫 tick 전송
    this.io.to(roomId).emit('timer-tick', { timeLeft: seconds })
  }

  clear(roomId: string): void {
    const entry = this.timers.get(roomId)
    if (entry) {
      clearInterval(entry.interval)
      clearTimeout(entry.timeout)
      this.timers.delete(roomId)
    }
  }

  clearAll(): void {
    for (const roomId of this.timers.keys()) {
      this.clear(roomId)
    }
  }
}
