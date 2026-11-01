
/**
 * Dieser Hook verwaltet den aktuellen Supabase-Benutzer.
 * Er lädt beim Start die Sitzung und reagiert auf Änderungen
 * des Anmeldestatus, damit mehrere Komponenten dieselbe
 * Authentifizierungslogik wiederverwenden können.
 */

import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"

/**
 * Lädt den aktuellen Benutzer und überwacht Login und Logout.
 * useState speichert Benutzer und Ladezustand. useEffect
 * registriert den Auth-Listener und entfernt ihn beim Aufräumen.
 */
export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Lädt den aktuellen Benutzer beim ersten Einbinden.
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      if (error) {
        console.error("Benutzer konnte nicht geladen werden:", error)
      }

      setUser(data?.user || null)
      setLoading(false)
    }

    loadUser()

    // Reagiert automatisch auf An- und Abmeldungen.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return

        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}