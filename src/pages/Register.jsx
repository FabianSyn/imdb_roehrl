
/**
 * Diese Seite ermöglicht neuen Benutzern, sich mit ihrer
 * E-Mail-Adresse und einem Passwort bei IMDB zu registrieren.
 */

import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../services/supabase"

/**
 * Erstellt das Registrierungsformular und verwaltet die Eingaben.
 * useState speichert E-Mail, Passwort, Rückmeldungen und Ladezustand.
 * Die Registrierung erfolgt über den Authentifizierungsdienst von Supabase.
 */
export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  /**
   * Verarbeitet die Registrierung über supabase.auth.signUp().
   * preventDefault() verhindert das Neuladen der Seite und await wartet
   * auf die Antwort von Supabase. Bei Erfolg werden die Felder geleert,
   * bei einem Fehler wird die entsprechende Meldung angezeigt.
   */
  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Registrierung erfolgreich. Prüfe gegebenenfalls deine E-Mails.")
      setEmail("")
      setPassword("")
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="auth-layout">
        <div className="auth-intro auth-register">
          <div className="auth-copy">
            <p className="hero-eyebrow">Join the Community</p>

            <h1 className="auth-title">
              Join
              <br />
              IM<span>DB!</span>
            </h1>

            <p className="auth-text">
              Erstelle deinen Account, bewerte deine Lieblings-Manga und diskutiere mit anderen Fans über Geschichten, Charaktere und Kapitel.
            </p>
          </div>

          <div className="auth-sfx">
            JOIN!
          </div>
        </div>

        <div className="form-card auth-card">
          <p className="hero-eyebrow">New Member</p>

          <h2 className="panel-title">
            Registrieren
          </h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">
              E-Mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">
              Passwort
            </label>

            <input
              id="password"
              type="password"
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength="6"
              required
            />

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Wird registriert..." : "Account erstellen"}
            </button>
          </form>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <p className="auth-switch">
            Bereits registriert?{" "}
            <Link to="/login">
              Zum Login →
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
