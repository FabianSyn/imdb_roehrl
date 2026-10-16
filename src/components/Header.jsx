import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"

// Navigation und Auth / Navigation and auth
export default function Header() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <header className="site-header">
      <nav className="nav">
        <Link className="logo" to="/">
          IM<span>DB</span>
        </Link>

        <Link className="nav-link" to="/search">
          Manga
        </Link>

        {user ? (
          <>
            <Link className="nav-link" to="/profile">
              Profil
            </Link>
            <span className="user-email">{user.email}</span>
            <button className="nav-button" onClick={handleLogout}>
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