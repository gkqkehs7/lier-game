'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

export function useSocket() {
  const socketRef = useRef<GameSocket>(getSocket())
  const [connected, setConnected] = useState(socketRef.current.connected)

  useEffect(() => {
    const sock = socketRef.current

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    sock.on('connect', onConnect)
    sock.on('disconnect', onDisconnect)

    if (!sock.connected) {
      sock.connect()
    } else {
      setConnected(true)
    }

    return () => {
      sock.off('connect', onConnect)
      sock.off('disconnect', onDisconnect)
    }
  }, [])

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      const sock = socketRef.current
      if (sock.connected) {
        sock.emit(event, ...args)
      } else {
        // 연결되면 즉시 emit
        sock.once('connect', () => sock.emit(event, ...args))
        sock.connect()
      }
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
    connected,
    emit,
    on,
  }
}
