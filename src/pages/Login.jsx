import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../services/supabase"

// Login / Login
export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      navigate("/")
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="auth-layout">
        <div className="auth-intro auth-login">
          <div className="auth-copy">

            <h1 className="auth-title">
              Welcome
              <br />
              Back<span>!</span>
            </h1>

            <p className="auth-text">
              Logge dich ein, um Manga zu bewerten, Kommentare zu schreiben und dein persönliches Profil zu verwalten.
            </p>
          </div>

          <div className="auth-sfx">
            LOGIN!
          </div>
        </div>

        <div className="form-card auth-card">
          <p className="hero-eyebrow">Account</p>

          <h2 className="panel-title">
            Einloggen
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
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Wird eingeloggt..." : "Login"}
            </button>
          </form>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <p className="auth-switch">
            Noch keinen Account?{" "}
            <Link to="/register">
              Registrieren →
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}