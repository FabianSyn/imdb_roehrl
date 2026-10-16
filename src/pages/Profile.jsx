import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"

// Profil laden und speichern / Load and save profile
export default function Profile() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData.user

      if (!currentUser) {
        setLoading(false)
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .single()

      if (error) {
        setMessage("Profil konnte nicht geladen werden.")
      } else {
        setUsername(data?.username || "")
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Profil gespeichert.")
    }
  }

  if (loading) return <p>Lädt...</p>
  if (!user) return <p>Bitte zuerst einloggen.</p>

  return (
    <section>
      <h1>Profil</h1>
      <p>{user.email}</p>

      <form onSubmit={handleSave}>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Benutzername"
          required
        />
        <button type="submit">Speichern</button>
      </form>

      {message && <p>{message}</p>}
    </section>
  )
}