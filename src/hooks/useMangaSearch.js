
/**
 * Dieser Hook verwaltet Suchergebnisse aus der AniList-API.
 * Er reagiert auf Änderungen von Suchbegriff, Genre, Status,
 * Sortierung und Seitenzahl.
 */

import { useEffect, useState } from "react"

/**
 * Lädt Manga anhand der übergebenen Suchparameter.
 * loadSearchResults ist eine Funktion, die den bestehenden
 * AniList-Service aufruft und die Ergebnisse zurückgibt.
 *
 * useEffect() startet bei Filteränderungen eine neue Suche.
 * Die active-Variable verhindert die Anzeige veralteter Ergebnisse.
 */
export default function useMangaSearch({
  query = "",
  genre = "",
  status = "",
  sort = "",
  page = 1,
  loadSearchResults
}) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadManga = async () => {
      setLoading(true)
      setError("")

      try {
        const data = await loadSearchResults({
          query,
          genre,
          status,
          sort,
          page
        })

        if (active) {
          setResults(data)
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Manga konnten nicht geladen werden.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadManga()

    return () => {
      active = false
    }
  }, [query, genre, status, sort, page, loadSearchResults])

  return { results, loading, error }
}
