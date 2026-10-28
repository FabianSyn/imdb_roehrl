
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"

/**
 * Erstellt die Navigation und passt sie an den Anmeldestatus an.
 * useState speichert den Benutzer, während useEffect ihn über Supabase
 * lädt und mit onAuthStateChange auf Login- und Logout-Änderungen reagiert.
 * useNavigate ermöglicht die Weiterleitung nach dem Logout.
 */
export default function Header() {
  // Speichert den Benutzer und stellt die Navigation bereit.
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  /**
   * Prüft beim Laden den aktuellen Benutzer und überwacht Auth-Änderungen.
   * getUser() liest den Benutzer aus Supabase, onAuthStateChange()
   * aktualisiert den State und unsubscribe() entfernt den Listener. (Damit wird verhindert, dass der Listener bei jedem Rendern erneut registriert wird.)
   */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  /**
   * Meldet den Benutzer über Supabase ab und leitet ihn zur Startseite weiter.
   * signOut() beendet die Sitzung, navigate() ändert anschließend die Route.
   */
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) navigate("/")
  }

  return (
    <header className="site-header">
      <nav className="nav">
        <Link className="logo" to="/">
          IM<span>DB</span>
        </Link>

        <Link className="nav-link" to="/search">
          Mangas
        </Link>

        <Link className="nav-link" to="/communities">
          Communities
        </Link>

        {user ? (
          <>
            <Link className="nav-link" to="/profile">
              Profil
            </Link>
            <span className="user-email">{user.email}</span>
            <button className="nav-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="nav-link" to="/login">
              Login
            </Link>
            <Link className="nav-link" to="/register">
              Registrieren
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
