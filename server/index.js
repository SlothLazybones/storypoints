import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT) || 8787

const sessions = new Map()

function generateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code
  do {
    code = ''
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  } while (sessions.has(code))
  return code
}

function publicParticipant(p, revealed) {
  return {
    id: p.id,
    name: p.name,
    hasVoted: p.vote !== null,
    vote: revealed ? p.vote : null,
    isHost: p.isHost,
  }
}

function publicSession(session) {
  return {
    code: session.code,
    story: session.story,
    revealed: session.revealed,
    history: session.history,
    participants: [...session.participants.values()].map((p) => publicParticipant(p, session.revealed)),
  }
}

function sessionAverage(session) {
  const nums = [...session.participants.values()]
    .map((p) => p.vote)
    .filter((v) => typeof v === 'number')
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function clearVotes(session) {
  session.revealed = false
  for (const p of session.participants.values()) p.vote = null
}

function broadcast(session) {
  const payload = JSON.stringify({ type: 'session', session: publicSession(session) })
  for (const p of session.participants.values()) {
    if (p.ws.readyState === p.ws.OPEN) p.ws.send(payload)
  }
}

function sendSelf(ws, participant, session) {
  ws.send(
    JSON.stringify({
      type: 'self',
      self: {
        id: participant.id,
        name: participant.name,
        isHost: participant.isHost,
        vote: participant.vote,
      },
      session: publicSession(session),
    }),
  )
}

function sendError(ws, message) {
  ws.send(JSON.stringify({ type: 'error', message }))
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  let currentSession = null
  let currentParticipant = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      sendError(ws, 'Ungültige Nachricht')
      return
    }

    if (msg.type === 'create') {
      const name = (msg.name || '').trim()
      if (!name) return sendError(ws, 'Name erforderlich')
      const code = generateCode()
      const participant = { id: randomUUID(), name, vote: null, isHost: true, ws }
      const session = {
        code,
        story: '',
        revealed: false,
        history: [],
        participants: new Map([[participant.id, participant]]),
      }
      sessions.set(code, session)
      currentSession = session
      currentParticipant = participant
      sendSelf(ws, participant, session)
      return
    }

    if (msg.type === 'join') {
      const name = (msg.name || '').trim()
      const code = (msg.code || '').toUpperCase().trim()
      if (!name) return sendError(ws, 'Name erforderlich')
      const session = sessions.get(code)
      if (!session) return sendError(ws, 'Sitzung nicht gefunden')
      const participant = { id: randomUUID(), name, vote: null, isHost: false, ws }
      session.participants.set(participant.id, participant)
      currentSession = session
      currentParticipant = participant
      sendSelf(ws, participant, session)
      broadcast(session)
      return
    }

    if (!currentSession || !currentParticipant) return sendError(ws, 'Keine Sitzung')

    if (msg.type === 'vote') {
      currentParticipant.vote = msg.value ?? null
      broadcast(currentSession)
      return
    }

    if (msg.type === 'reveal') {
      currentSession.revealed = true
      broadcast(currentSession)
      return
    }

    if (msg.type === 'reset') {
      const avg = sessionAverage(currentSession)
      if (avg !== null) {
        const storyText =
          currentSession.story.trim() || `${currentSession.history.length + 1}. Eingabe`
        currentSession.history.push({ story: storyText, average: avg })
      }
      currentSession.story = ''
      clearVotes(currentSession)
      broadcast(currentSession)
      return
    }

    if (msg.type === 'clearVotes') {
      clearVotes(currentSession)
      broadcast(currentSession)
      return
    }

    if (msg.type === 'setStory') {
      currentSession.story = String(msg.text || '')
      broadcast(currentSession)
      return
    }
  })

  ws.on('close', () => {
    if (!currentSession || !currentParticipant) return
    currentSession.participants.delete(currentParticipant.id)
    if (currentSession.participants.size === 0) {
      sessions.delete(currentSession.code)
    } else {
      if (currentParticipant.isHost) {
        const next = currentSession.participants.values().next().value
        if (next) next.isHost = true
      }
      broadcast(currentSession)
    }
  })
})

console.log(`WebSocket-Server läuft auf ws://localhost:${PORT}`)
