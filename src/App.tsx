import { useSession } from './useSession'
import { Home } from './Home'
import { SessionView } from './SessionView'

export function App() {
  const api = useSession()

  if (!api.connected && !api.session) {
    return (
      <div className="center">
        <p>Verbindung wird aufgebaut…</p>
      </div>
    )
  }

  if (api.session && api.self) {
    return <SessionView api={api} />
  }

  return <Home api={api} />
}
