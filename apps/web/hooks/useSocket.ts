'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from 'shared'

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

let socket: GameSocket | null = null

function getSocket(): GameSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function useSocket() {
  const socketRef = useRef<GameSocket>(getSocket())

  useEffect(() => {
    const sock = socketRef.current
    if (!sock.connected) {
      sock.connect()
    }
    return () => {
      // 컴포넌트 언마운트 시에도 연결 유지 (싱글톤)
    }
  }, [])

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current.emit(event, ...args)
    },
    []
  )

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E]
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socketRef.current.on(event as any, handler as any)
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socketRef.current.off(event as any, handler as any)
      }
    },
    []
  )

  return {
    socket: socketRef.current,
    emit,
    on,
  }
}
