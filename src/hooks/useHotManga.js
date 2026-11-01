
/**
 * Dieser Hook lädt beliebte Manga über die AniList-API.
 * Er verwaltet die Ergebnisse, den Ladezustand und mögliche Fehler.
 */

import { useEffect, useState } from "react"
import { getHotManga } from "../services/anilist"

/**
 * Lädt beliebte Manga beim Einbinden der Komponente.
 * useEffect() startet die Anfrage, useState() speichert die Ergebnisse.
 * Die active-Variable verhindert State-Updates nach dem Verlassen der Seite.
 */
export default function useHotManga() {
  const [hotManga, setHotManga] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadHotManga = async () => {
      setLoading(true)
      setError("")

      try {
        const data = await getHotManga()

        if (active) {
          setHotManga(data || [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Beliebte Manga konnten nicht geladen werden.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadHotManga()

    return () => {
      active = false
    }
  }, [])

  return { hotManga, loading, error }
}
