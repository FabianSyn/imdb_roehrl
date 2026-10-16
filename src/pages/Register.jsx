import { useState } from "react"
import { supabase } from "../services/supabase"

// Registrierung / Registration
export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

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
    <section>
      <h1>Registrieren</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength="6"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Wird registriert..." : "Registrieren"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  )
}