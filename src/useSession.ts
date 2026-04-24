import { useCallback, useEffect, useRef, useState } from 'react'
import type { ServerMessage, SessionState, Self, Vote } from './types'

const WS_URL =
  (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'

export function useSession() {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [session, setSession] = useState<SessionState | null>(null)
  const [self, setSelf] = useState<Self | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      const msg: ServerMessage = JSON.parse(e.data)
      if (msg.type === 'self') {
        setSelf(msg.self)
        setSession(msg.session)
        setError(null)
      } else if (msg.type === 'session') {
        setSession(msg.session)
        setSelf((prev) => {
          if (!prev) return prev
          const me = msg.session.participants.find((p) => p.id === prev.id)
          return me ? { ...prev, isHost: me.isHost, vote: me.vote } : prev
        })
      } else if (msg.type === 'error') {
        setError(msg.message)
      }
    }
    return () => ws.close()
  }, [])

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
  }, [])

  const create = useCallback((name: string) => send({ type: 'create', name }), [send])
  const join = useCallback(
    (code: string, name: string) => send({ type: 'join', code, name }),
    [send],
  )
  const vote = useCallback(
    (value: Vote) => {
      setSelf((prev) => (prev ? { ...prev, vote: value } : prev))
      send({ type: 'vote', value })
    },
    [send],
  )
  const reveal = useCallback(() => send({ type: 'reveal' }), [send])
  const reset = useCallback(() => send({ type: 'reset' }), [send])
  const clearVotes = useCallback(() => send({ type: 'clearVotes' }), [send])
  const setStory = useCallback(
    (text: string) => send({ type: 'setStory', text }),
    [send],
  )

  return {
    connected,
    session,
    self,
    error,
    create,
    join,
    vote,
    reveal,
    reset,
    clearVotes,
    setStory,
  }
}
