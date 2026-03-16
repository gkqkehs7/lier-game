'use client'

import { useState, useEffect } from 'react'
import { useSocket } from './useSocket'

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const { on } = useSocket()

  useEffect(() => {
    const off = on('timer-tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft)
    })
    return off
  }, [on])

  return { timeLeft }
}
