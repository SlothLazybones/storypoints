export type Vote = number | '?' | '☕' | null

export interface Participant {
  id: string
  name: string
  hasVoted: boolean
  vote: Vote
  isHost: boolean
}

export interface HistoryEntry {
  story: string
  average: number
}

export interface SessionState {
  code: string
  story: string
  revealed: boolean
  history: HistoryEntry[]
  participants: Participant[]
}

export interface Self {
  id: string
  name: string
  isHost: boolean
  vote: Vote
}

export type ServerMessage =
  | { type: 'self'; self: Self; session: SessionState }
  | { type: 'session'; session: SessionState }
  | { type: 'error'; message: string }
