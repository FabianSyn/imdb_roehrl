
/**
 * Dieser Hook verwaltet das Laden der Benutzerdaten.
 * Er stellt Profildaten, Ladezustand, Fehler und eine Funktion
 * zum erneuten Laden der Informationen bereit.
 */

import { useEffect, useState } from "react"

/**
 * Lädt die Profildaten eines Benutzers über loadProfileData().
 * useEffect() reagiert auf Benutzerwechsel und erneute Ladeanforderungen.
 * Die tatsächlichen Supabase-Abfragen werden beim Einbinden übergeben,
 * damit alle bisherigen Profilinformationen erhalten bleiben.
 */
export default function useProfile(userId, loadProfileData) {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Fordert ein erneutes Laden der Profildaten an.
   * Durch die Änderung von reloadKey wird useEffect() erneut ausgeführt.
   */
  const refreshProfile = () => {
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      if (!userId) {
        setProfileData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")
      setProfileData(null)

      try {
        const data = await loadProfileData(userId)

        if (active) {
          setProfileData(data)
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Profildaten konnten nicht geladen werden.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [userId, loadProfileData, reloadKey])

  return {
    profileData,
    loading,
    error,
    refreshProfile
  }
}
