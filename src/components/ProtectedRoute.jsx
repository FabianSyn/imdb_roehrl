
/**
 * Diese Komponente schützt Seiten, die nur für angemeldete Benutzer zugänglich sein sollen.
 */

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../services/supabase"

/**
 * Überprüft den Anmeldestatus und entscheidet, ob die geschützte Seite angezeigt wird.
 * useState speichert den Benutzer, useEffect prüft ihn über Supabase und
 * überwacht mit einem Listener Änderungen des Anmeldestatus.
 * children enthält die geschützte Komponente, beispielsweise Profile.
 */
export default function ProtectedRoute({ children }) {
  // undefined bedeutet, dass der Anmeldestatus noch nicht überprüft wurde.
  const [user, setUser] = useState(undefined)

  /**
   * getUser() prüft den aktuellen Benutzer.
   * onAuthStateChange() reagiert auf Login und Logout.
   * unsubscribe() entfernt den Listener, sobald die Komponente nicht mehr benötigt wird.
   */
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <main className="page">
        <p className="muted">Lädt...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
