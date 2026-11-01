
/**
 * Dieser Hook verwaltet die Bewertungen eines Manga.
 * Er lädt die persönliche Bewertung sowie den Community-Durchschnitt
 * und ermöglicht das Speichern einer neuen Bewertung.
 */

import { useEffect, useState } from "react"
import {
  getUserRating,
  getAverageRating,
  saveRating
} from "../services/ratings"

/**
 * Lädt Bewertungen anhand der Manga-ID und Benutzer-ID.
 * Promise.all() führt die benötigten Datenbankabfragen parallel aus.
 * Bei Änderungen von mangaId oder userId wird erneut geladen.
 */
export default function useMangaRatings(mangaId, userId) {
  const [rating, setRating] = useState("")
  const [averageRating, setAverageRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Fordert ein erneutes Laden der Bewertungen an.
   * Dadurch wird nach Änderungen der aktuelle Durchschnitt angezeigt.
   */
  const refreshRatings = () => {
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    let active = true

    const loadRatings = async () => {
      setLoading(true)
      setError("")
      setRating("")
      setAverageRating(null)

      if (!mangaId) {
        setLoading(false)
        return
      }

      try {
        const [average, ownRating] = await Promise.all([
          getAverageRating(Number(mangaId)),
          userId
            ? getUserRating(Number(mangaId), userId)
            : Promise.resolve(null)
        ])

        if (!active) return

        setAverageRating(average)

        if (ownRating != null) {
          setRating(
            String(
              typeof ownRating === "object"
                ? ownRating.rating
                : ownRating
            )
          )
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Bewertungen konnten nicht geladen werden.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRatings()

    return () => {
      active = false
    }
  }, [mangaId, userId, reloadKey])

  /**
   * Speichert die ausgewählte Bewertung des angemeldeten Benutzers.
   * Anschließend wird der neue Community-Durchschnitt geladen.
   */
  const submitRating = async () => {
    if (!userId || !mangaId || !rating || saving) return false

    setSaving(true)
    setError("")
    setMessage("")

    try {
      await saveRating(
        Number(mangaId),
        userId,
        Number(rating)
      )

      const average = await getAverageRating(Number(mangaId))
      setAverageRating(average)
      setMessage("Deine Bewertung wurde gespeichert.")

      return true
    } catch (err) {
      setError(err.message || "Bewertung konnte nicht gespeichert werden.")
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    rating,
    setRating,
    averageRating,
    loading,
    saving,
    error,
    message,
    submitRating,
    refreshRatings
  }
}
