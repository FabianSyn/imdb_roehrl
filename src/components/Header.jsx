
/**
 * Diese Komponente zeigt die Hauptnavigation der Website.
 * useAuth() stellt den Anmeldestatus bereit, während useState
 * das mobile Menü verwaltet. Die angezeigten Links hängen
 * davon ab, ob ein Benutzer angemeldet ist.
 */

import { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../services/supabase"
import useAuth from "../hooks/useAuth"

/**
 * Erstellt die Navigation für Desktop und Smartphone.
 * useAuth() liefert den Benutzer, useLocation() erkennt Seitenwechsel
 * und useNavigate() ermöglicht die Weiterleitung nach dem Logout.
 */
export default function Header() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Schließt das mobile Menü bei einem Seitenwechsel.
   * Der Effekt reagiert auf Änderungen des URL-Pfads.
   */
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  /**
   * Meldet den Benutzer über Supabase ab.
   * Nach erfolgreichem Logout wird zur Startseite navigiert.
   */
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (!error) {
      setMenuOpen(false)
      navigate("/")
    }
  }

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Hauptnavigation">
        <Link className="logo" to="/" onClick={() => setMenuOpen(false)}>
          IM<span>DB</span>
        </Link>

        <button
          className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="main-navigation"
          className={`nav-menu ${menuOpen ? "is-open" : ""}`}
        >
          <Link
            className="nav-link"
            to="/search"
            onClick={() => setMenuOpen(false)}
          >
            Mangas
          </Link>

          <Link
            className="nav-link"
            to="/communities"
            onClick={() => setMenuOpen(false)}
          >
            Communities
          </Link>

          {user ? (
            <>
              <Link
                className="nav-link"
                to="/profile"
                onClick={() => setMenuOpen(false)}
              >
                Profil
              </Link>

              <span className="user-email" title={user.email}>
                {user.email}
              </span>

              <button
                className="nav-button"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="nav-link"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>

              <Link
                className="nav-link"
                to="/register"
                onClick={() => setMenuOpen(false)}
              >
                Registrieren
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
