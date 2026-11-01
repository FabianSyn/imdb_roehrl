
/**
 * Dieser Hook lädt die Detailinformationen eines Manga über AniList.
 * Er verwaltet die geladenen Daten, den Ladezustand und mögliche Fehler.
 */

import { useEffect, useState } from "react"
import { getManga } from "../services/anilist"

/**
 * Lädt die Manga-Daten anhand einer ID.
 * useEffect() startet eine neue Anfrage, wenn sich mangaId ändert.
 * Die active-Variable verhindert State-Updates veralteter Anfragen.
 */
export default function useManga(mangaId) {
  const [manga, setManga] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const loadManga = async () => {
      setLoading(true)
      setError(null)
      setManga(null)

      try {
        const data = await getManga(mangaId)

        if (active) {
          setManga(data)
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

    if (mangaId) {
      loadManga()
    } else {
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [mangaId])

  return { manga, loading, error }
}
