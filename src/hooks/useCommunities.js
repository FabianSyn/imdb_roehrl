
/**
 * Dieser Hook verwaltet die Community-Liste der Anwendung.
 * Er lädt Communities aus Supabase und stellt eine Funktion
 * bereit, um die Daten bei Bedarf erneut abzurufen.
 */

import { useCallback, useEffect, useState } from "react"
import { getCommunities } from "../services/communities"

/**
 * Lädt Communities und verwaltet Lade- und Fehlerzustände.
 * useCallback() stabilisiert die Ladefunktion, während
 * useEffect() den ersten Ladevorgang startet.
 */
export default function useCommunities() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Markiert die Community-Daten als veraltet.
   * Durch Ändern von reloadKey wird der Ladeeffekt erneut ausgeführt.
   */
  const refreshCommunities = useCallback(() => {
    setReloadKey((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true

    const loadCommunities = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getCommunities()

        if (active) {
          setCommunities(data)
        }
      } catch (err) {
        if (active) {
          setError(err.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCommunities()

    return () => {
      active = false
    }
  }, [reloadKey])

  return {
    communities,
    loading,
    error,
    refreshCommunities
  }
}
