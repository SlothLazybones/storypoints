import { useState } from 'react'
import type { useSession } from './useSession'

type Api = ReturnType<typeof useSession>

export function Home({ api }: { api: Api }) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (mode === 'create') api.create(name.trim())
    else if (code.trim()) api.join(code.trim().toUpperCase(), name.trim())
  }

  return (
    <div className="center">
      <div className="card">
        <h1>Story Points</h1>
        <p className="muted">Gemeinsam schätzen mit Planning Poker</p>

        <div className="tabs">
          <button
            className={mode === 'create' ? 'tab active' : 'tab'}
            onClick={() => setMode('create')}
            type="button"
          >
            Neue Sitzung
          </button>
          <button
            className={mode === 'join' ? 'tab active' : 'tab'}
            onClick={() => setMode('join')}
            type="button"
          >
            Beitreten
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            Dein Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Anna"
              autoFocus
            />
          </label>

          {mode === 'join' && (
            <label>
              Sitzungscode
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
            </label>
          )}

          <button type="submit" className="primary" disabled={!api.connected}>
            {mode === 'create' ? 'Sitzung erstellen' : 'Beitreten'}
          </button>
        </form>

        {api.error && <p className="error">{api.error}</p>}
      </div>
    </div>
  )
}
