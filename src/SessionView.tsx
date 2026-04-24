import { useState } from 'react'
import type { useSession } from './useSession'
import type { Vote } from './types'

type Api = ReturnType<typeof useSession>

const CARDS: Vote[] = [0, 1, 2, 3, 5, 8, 13, 21, '?', '☕']
const FINAL_CARDS: number[] = [0, 1, 2, 3, 5, 8, 13, 21]

function average(votes: Vote[]): string {
  const nums = votes.filter((v): v is number => typeof v === 'number')
  if (nums.length === 0) return '–'
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length
  return avg.toFixed(1)
}

export function SessionView({ api }: { api: Api }) {
  const [copied, setCopied] = useState(false)
  const [finalOpen, setFinalOpen] = useState(false)
  const { session, self } = api
  if (!session || !self) return null

  const copyCode = async () => {
    await navigator.clipboard.writeText(session.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const allVoted = session.participants.every((p) => p.hasVoted)
  const votes = session.participants.map((p) => p.vote)
  const history = session.history ?? []

  return (
    <div className="session">
      <header className="header">
        <div>
          <div className="muted small">Sitzungscode</div>
          <div className="code" onClick={copyCode} title="Zum Kopieren klicken">
            {session.code}
            <span className="copy-hint">{copied ? 'Kopiert!' : 'kopieren'}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="muted small">Angemeldet als </span>
          <strong>
            {self.name}
            {self.isHost && <span className="badge">Host</span>}
          </strong>
        </div>
      </header>

      <section className="story">
        <label>
          <span className="muted small">User Story</span>
          <input
            value={session.story}
            onChange={(e) => api.setStory(e.target.value)}
            placeholder="Beschreibung der User Story…"
          />
        </label>
      </section>

      <section className="participants">
        <h2>Teilnehmer ({session.participants.length})</h2>
        <ul>
          {session.participants.map((p) => (
            <li key={p.id} className={p.hasVoted ? 'voted' : ''}>
              <span className="pname">
                {p.name}
                {p.isHost && <span className="badge">Host</span>}
                {p.id === self.id && <span className="badge you">Du</span>}
              </span>
              <span className={'pvote ' + (session.revealed ? 'revealed' : '')}>
                {session.revealed
                  ? p.vote === null
                    ? '–'
                    : p.vote
                  : p.hasVoted
                    ? '✓'
                    : '…'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="actions">
        {!session.revealed ? (
          <>
            <button className="primary" onClick={api.reveal} disabled={!allVoted}>
              Aufdecken {allVoted ? '' : `(${session.participants.filter((p) => p.hasVoted).length}/${session.participants.length})`}
            </button>
            <button
              className="secondary"
              onClick={api.clearVotes}
              disabled={!session.participants.some((p) => p.hasVoted)}
            >
              Zurücksetzen
            </button>
          </>
        ) : (
          <>
            <div className="result">Ø {average(votes)}</div>
            {session.finalVote !== null && session.finalVote !== undefined && (
              <div className="result final">Final {session.finalVote}</div>
            )}
            <button className="secondary" onClick={() => setFinalOpen(true)}>
              {session.finalVote !== null && session.finalVote !== undefined
                ? 'Final anpassen'
                : 'Final festlegen'}
            </button>
            <button className="primary" onClick={api.reset}>
              Neue Runde
            </button>
            <button className="secondary" onClick={api.clearVotes}>
              Zurücksetzen
            </button>
          </>
        )}
      </section>

      {finalOpen && (
        <div className="overlay" onClick={() => setFinalOpen(false)}>
          <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-header">
              <h2>Final Story Points</h2>
              <button className="overlay-close" onClick={() => setFinalOpen(false)}>
                ×
              </button>
            </div>
            <div className="cards">
              {FINAL_CARDS.map((c) => (
                <button
                  key={c}
                  className={'card-btn' + (session.finalVote === c ? ' selected' : '')}
                  onClick={() => {
                    api.setFinal(session.finalVote === c ? null : c)
                    setFinalOpen(false)
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="cards">
        {CARDS.map((c) => (
          <button
            key={String(c)}
            className={'card-btn' + (self.vote === c ? ' selected' : '')}
            onClick={() => api.vote(self.vote === c ? null : c)}
            disabled={session.revealed}
          >
            {c}
          </button>
        ))}
      </section>

      {history.length > 0 && (
        <section className="history">
          <h2>Historie</h2>
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                <span className="hstory">{h.story}</span>
                <span className="hvalues">
                  <span className="havg">Ø {h.average.toFixed(1)}</span>
                  {h.final !== null && h.final !== undefined && (
                    <span className="hfinal">Final {h.final}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
