
/**
 * Dieser Hook verwaltet Manga-Kommentare über Supabase.
 * Er lädt Kommentare und stellt Funktionen zum Erstellen,
 * Bearbeiten und Löschen bereit.
 */

import { useEffect, useState } from "react"
import {
  getComments,
  addComment,
  updateComment,
  deleteComment
} from "../services/comments"

/**
 * Verwaltet Kommentare eines Manga.
 * useEffect() lädt die Kommentare, useState() speichert Daten
 * und Statuswerte. Nach Änderungen wird die Liste erneut geladen.
 */
export default function useComments(mangaId, userId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Fordert ein erneutes Laden der Kommentare an.
   * Die Änderung von reloadKey startet den Ladeeffekt erneut.
   */
  const refreshComments = () => {
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    let active = true

    const loadComments = async () => {
      setLoading(true)
      setError("")
      setComments([])

      if (!mangaId) {
        setLoading(false)
        return
      }

      try {
        const data = await getComments(Number(mangaId))

        if (active) {
          setComments(data || [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Kommentare konnten nicht geladen werden.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadComments()

    return () => {
      active = false
    }
  }, [mangaId, reloadKey])

  /**
   * Erstellt einen neuen Kommentar für den ausgewählten Manga.
   * trim() entfernt äußere Leerzeichen, danach wird die Liste aktualisiert.
   */
  const createComment = async (content, spoiler = false) => {
    if (!userId || !mangaId || saving || !content.trim()) return false

    setSaving(true)
    setError("")

    try {
      await addComment(
        Number(mangaId),
        userId,
        content.trim(),
        spoiler
      )

      refreshComments()
      return true
    } catch (err) {
      setError(err.message || "Kommentar konnte nicht erstellt werden.")
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * Bearbeitet einen vorhandenen Kommentar.
   * updateComment() speichert Text und Spoiler-Status in Supabase.
   */
  const editComment = async (commentId, content, spoiler) => {
    if (!userId || saving || !content.trim()) return false

    setSaving(true)
    setError("")

    try {
      await updateComment(
        commentId,
        userId,
        content.trim(),
        spoiler
      )

      refreshComments()
      return true
    } catch (err) {
      setError(err.message || "Kommentar konnte nicht bearbeitet werden.")
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht einen Kommentar des angemeldeten Benutzers.
   * Die Bestätigung über window.confirm() bleibt in der React-Page.
   */
  const removeComment = async (commentId) => {
    if (!userId || saving) return false

    setSaving(true)
    setError("")

    try {
      await deleteComment(commentId, userId)

      refreshComments()
      return true
    } catch (err) {
      setError(err.message || "Kommentar konnte nicht gelöscht werden.")
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    comments,
    loading,
    saving,
    error,
    createComment,
    editComment,
    removeComment,
    refreshComments
  }
}
