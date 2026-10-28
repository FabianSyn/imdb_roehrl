
/**
 * Diese Seite zeigt alle Informationen zu einem Manga an und ermöglicht
 * angemeldeten Benutzern, Bewertungen und Kommentare zu verwalten.
 */

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../services/supabase"
import { getManga } from "../services/anilist"
import { getUserRating, getAverageRating, saveRating } from "../services/ratings"
import { getComments, addComment, updateComment, deleteComment } from "../services/comments"
import SpoilerContent from "../components/SpoilerContent"

/**
 * Verwaltet Manga-Informationen, Bewertungen, Kommentare und deren Bearbeitung.
 * useParams liest die Manga-ID aus der URL, useState speichert die Daten und
 * Eingaben, während useEffect die Daten über AniList und Supabase lädt.
 */
export default function MangaDetails() {
  const { id } = useParams()

  // Speichert Manga-Daten, Benutzer, Bewertungen und Kommentare.
  const [manga, setManga] = useState(null)
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState("")
  const [averageRating, setAverageRating] = useState(null)
  const [comments, setComments] = useState([])

  // Speichert Eingaben für neue und zu bearbeitende Kommentare.
  const [commentText, setCommentText] = useState("")
  const [spoiler, setSpoiler] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  const [editSpoiler, setEditSpoiler] = useState(false)

  // Verwaltet Ladezustände und Rückmeldungen.
  const [loading, setLoading] = useState(true)
  const [savingRating, setSavingRating] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [commentError, setCommentError] = useState("")

  /**
   * Lädt beim Öffnen oder Wechseln eines Manga alle benötigten Daten.
   * Promise.all() lädt Manga, Benutzer, Durchschnittsbewertung und Kommentare parallel. 
   * Anschließend wird gegebenenfalls die eigene Bewertung geladen.
   * active verhindert State-Updates nach dem Verlassen der Komponente.
   */
  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      setLoading(true)
      setError("")
      setManga(null)
      setRating("")
      setComments([])

      try {
        const [mangaData, auth, average, commentData] = await Promise.all([
          getManga(id),
          supabase.auth.getUser(),
          getAverageRating(Number(id)),
          getComments(Number(id))
        ])

        if (!active) return
        if (auth.error) throw auth.error

        setManga(mangaData)
        setUser(auth.data.user)
        setAverageRating(average)
        setComments(commentData)

        if (auth.data.user) {
          const ownRating = await getUserRating(Number(id), auth.data.user.id)

          if (active && ownRating != null) {
            setRating(String(
              typeof ownRating === "object" ? ownRating.rating : ownRating
            ))
          }
        }
      } catch (err) {
        if (active) setError(err.message || "Manga konnten nicht geladen werden.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDetails()
    return () => { active = false }
  }, [id])

  /**
   * Aktualisiert die Community-Bewertung und die Kommentare.
   * Beide Supabase-Anfragen werden mit Promise.all() parallel ausgeführt,
   * damit Änderungen direkt auf der Seite sichtbar werden.
   */
  const refreshCommunityData = async () => {
    const [average, commentData] = await Promise.all([
      getAverageRating(Number(id)),
      getComments(Number(id))
    ])
    setAverageRating(average)
    setComments(commentData)
  }

  /**
   * Speichert die ausgewählte Bewertung des angemeldeten Benutzers.
   * saveRating() überträgt die Bewertung an Supabase und
   * getAverageRating() lädt anschließend den neuen Durchschnitt.
   */
  const handleSaveRating = async (event) => {
    event.preventDefault()
    if (!user || savingRating || !rating) return

    setSavingRating(true)
    setMessage("")

    try {
      await saveRating(Number(id), user.id, Number(rating))
      setAverageRating(await getAverageRating(Number(id)))
      setMessage("Deine Bewertung wurde gespeichert.")
    } catch (err) {
      setMessage(err.message || "Bewertung konnte nicht gespeichert werden.")
    } finally {
      setSavingRating(false)
    }
  }

  /**
   * Erstellt einen Kommentar über addComment() in Supabase.
   * trim() entfernt überflüssige Leerzeichen, anschließend werden
   * die Kommentare neu geladen und das Formular zurückgesetzt.
   */
  const handleAddComment = async (event) => {
    event.preventDefault()
    if (!user || savingComment || !commentText.trim()) return

    setSavingComment(true)
    setCommentError("")

    try {
      await addComment(Number(id), user.id, commentText.trim(), spoiler)
      await refreshCommunityData()
      setCommentText("")
      setSpoiler(false)
    } catch (err) {
      setCommentError(err.message || "Kommentar konnte nicht gespeichert werden.")
    } finally {
      setSavingComment(false)
    }
  }

  /**
   * Öffnet das Bearbeitungsformular für einen vorhandenen Kommentar.
   * Die aktuellen Werte werden mit den State-Settern in die
   * Bearbeitungsfelder übernommen.
   */
  const startEditing = (comment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
    setEditSpoiler(Boolean(comment.spoiler))
    setCommentError("")
  }

  /**
   * Aktualisiert einen bestehenden Kommentar über updateComment().
   * Nach erfolgreichem Speichern werden die Kommentare neu geladen
   * und der Bearbeitungsmodus beendet.
   */
  const handleUpdateComment = async (event) => {
    event.preventDefault()
    if (!user || editingId === null || savingComment || !editText.trim()) return

    setSavingComment(true)
    setCommentError("")

    try {
      await updateComment(editingId, user.id, editText.trim(), editSpoiler)
      await refreshCommunityData()
      setEditingId(null)
      setEditText("")
      setEditSpoiler(false)
    } catch (err) {
      setCommentError(err.message || "Kommentar konnte nicht aktualisiert werden.")
    } finally {
      setSavingComment(false)
    }
  }

  /**
   * Löscht einen eigenen Kommentar nach einer Bestätigung.
   * window.confirm() fragt den Benutzer, deleteComment() entfernt den
   * Eintrag aus Supabase und refreshCommunityData() aktualisiert die Anzeige.
   */
  const handleDeleteComment = async (commentId) => {
    if (!user || savingComment) return
    if (!window.confirm("Möchtest du diesen Kommentar wirklich löschen?")) return

    setSavingComment(true)
    setCommentError("")

    try {
      await deleteComment(commentId, user.id)
      await refreshCommunityData()
      if (editingId === commentId) setEditingId(null)
    } catch (err) {
      setCommentError(err.message || "Kommentar konnte nicht gelöscht werden.")
    } finally {
      setSavingComment(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Manga wird geladen...</p>
      </main>
    )
  }

  if (error || !manga) {
    return (
      <main className="page">
        <h1>Manga nicht gefunden</h1>
        <p role="alert">{error || "Dieser Manga konnte nicht geladen werden."}</p>
        <Link className="primary-button" to="/search">Zur Manga-Suche</Link>
      </main>
    )
  }

  // Verwendet bevorzugt den englischen, ansonsten den japanischen Titel.
  const title = manga.title?.english || manga.title?.romaji || "Unbekannter Manga"

  /**
   * Formatiert ein AniList-Datum als Tag.Monat.Jahr.
   * filter(Boolean) entfernt fehlende Datumsbestandteile und
   * join(".") verbindet die übrigen Werte mit Punkten.
   */
  const formatDate = (date) => {
    if (!date?.year) return "Unbekannt"
    return [date.day, date.month, date.year].filter(Boolean).join(".")
  }

  return (
    <main className="page">
      <Link className="community-back" to="/search">
        ← Zurück zum Manga-Archiv
      </Link>

      {manga.bannerImage && (
        <img
          className="manga-banner"
          src={manga.bannerImage}
          alt={`${title} Banner`}
        />
      )}

      {/* Manga-Informationen aus der AniList-API */}
      <section className="manga-detail-grid">
        <div>
          {manga.coverImage?.extraLarge && (
            <img
              className="manga-cover-large"
              src={manga.coverImage.extraLarge}
              alt={`Cover von ${title}`}
            />
          )}
        </div>

        <div className="manga-detail-content">
          <p className="hero-eyebrow">Manga Details</p>
          <h1 className="manga-title">{title}</h1>

          {manga.title?.native && (
            <p className="muted">{manga.title.native}</p>
          )}

          <div className="genre-list">
            {(manga.genres || []).map((genre) => (
              <span className="genre-tag" key={genre}>{genre}</span>
            ))}
          </div>

          <div className="manga-score-overview">
            <div className="manga-score-box">
              <span>AniList Score</span>
              <strong>
                {manga.averageScore != null
                  ? `${(manga.averageScore / 10).toFixed(1)}/10`
                  : "N/A"}
              </strong>
            </div>

            <div className="manga-score-box manga-score-community">
              <span>IMDB Community</span>
              <strong>
                {averageRating != null ? `${averageRating}/10` : "N/A"}
              </strong>
            </div>
          </div>

          <div className="manga-facts">
            <p><strong>Status:</strong> {manga.status?.replaceAll("_", " ") || "Unbekannt"}</p>
            <p><strong>Kapitel:</strong> {manga.chapters ?? "Unbekannt"}</p>
            <p><strong>Bände:</strong> {manga.volumes ?? "Unbekannt"}</p>
            <p><strong>Beginn:</strong> {formatDate(manga.startDate)}</p>
            <p><strong>Ende:</strong> {formatDate(manga.endDate)}</p>
          </div>

          <h2 className="panel-title">Beschreibung</h2>
          <div className="manga-description">
            {manga.description
              ? manga.description
                  .replace(/<br\s*\/?>/gi, "\n")
                  .replace(/<[^>]*>/g, "")
                  .split("\n")
                  .map((line, index) => (
                    <p key={index}>{line || "\u00a0"}</p>
                  ))
              : <p className="muted">Keine Beschreibung vorhanden.</p>}
          </div>

          {manga.staff?.edges?.length > 0 && (
            <div className="manga-staff">
              <h2 className="panel-title">Mitwirkende</h2>
              {manga.staff.edges.slice(0, 8).map((edge, index) => (
                <p key={`${edge.node.id}-${index}`}>
                  <strong>{edge.role}:</strong> {edge.node.name.full}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bewertungssystem für angemeldete Benutzer */}
      <section className="panel">
        <p className="hero-eyebrow">Rate this Manga</p>
        <h2 className="panel-title">Deine Bewertung</h2>

        {!user ? (
          <p>
            Du musst <Link className="community-text-link" to="/login">angemeldet</Link> sein,
            um diesen Manga zu bewerten.
          </p>
        ) : (
          <form className="manga-rating-form" onSubmit={handleSaveRating}>
            <label htmlFor="manga-rating">Bewertung von 1 bis 10</label>
            <select
              id="manga-rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            >
              <option value="">Bewertung auswählen</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}/10
                </option>
              ))}
            </select>

            <button
              className="primary-button"
              type="submit"
              disabled={savingRating}
            >
              {savingRating ? "Speichern..." : "Bewertung speichern"}
            </button>
          </form>
        )}

        {message && <p role="status">{message}</p>}
      </section>

      {/* Kommentare erstellen, anzeigen, bearbeiten und löschen */}
      <section className="panel">
        <p className="hero-eyebrow">Manga Discussion</p>
        <h2 className="panel-title">Kommentare ({comments.length})</h2>

        {user ? (
          <form className="manga-comment-form" onSubmit={handleAddComment}>
            <label htmlFor="new-comment">Dein Kommentar</label>
            <textarea
              id="new-comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Was denkst du über diesen Manga?"
              maxLength={2000}
              required
            />

            <label className="community-spoiler-checkbox">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(event) => setSpoiler(event.target.checked)}
              />
              Dieser Kommentar enthält Spoiler
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={savingComment}
            >
              {savingComment ? "Veröffentlichen..." : "Kommentar veröffentlichen"}
            </button>
          </form>
        ) : (
          <p>
            <Link className="community-text-link" to="/login">Melde dich an</Link>,
            um einen Kommentar zu schreiben.
          </p>
        )}

        {commentError && <p className="auth-message" role="alert">{commentError}</p>}

        {comments.length === 0 && (
          <p className="muted">Noch keine Kommentare vorhanden. Schreibe den ersten!</p>
        )}

        <div className="manga-comments-list">
          {comments.map((comment) => {
            // Prüft, ob der Kommentar dem angemeldeten Benutzer gehört.
            const ownComment = Boolean(user && comment.user_id === user.id)

            return (
              <article className="comment" key={comment.id}>
                {editingId === comment.id ? (
                  <form className="manga-comment-form" onSubmit={handleUpdateComment}>
                    <label htmlFor={`edit-comment-${comment.id}`}>
                      Kommentar bearbeiten
                    </label>

                    <textarea
                      id={`edit-comment-${comment.id}`}
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                      maxLength={2000}
                      required
                    />

                    <label className="community-spoiler-checkbox">
                      <input
                        type="checkbox"
                        checked={editSpoiler}
                        onChange={(event) => setEditSpoiler(event.target.checked)}
                      />
                      Dieser Kommentar enthält Spoiler
                    </label>

                    <div className="community-post-actions">
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={savingComment}
                      >
                        Speichern
                      </button>

                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={savingComment}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="comment-head">
                      <strong>{comment.profiles?.username || "Manga-Fan"}</strong>
                      <small className="muted">
                        {new Date(comment.created_at).toLocaleString("de-DE")}
                      </small>
                    </div>

                    {/* Die Komponente zeigt markierte Spoiler erst nach einem Klick. */}
                    <SpoilerContent
                      key={`${comment.id}-${comment.updated_at}`}
                      spoiler={Boolean(comment.spoiler)}
                    >
                      <p className="manga-comment-content">{comment.content}</p>
                    </SpoilerContent>

                    {comment.updated_at !== comment.created_at && (
                      <small className="muted">Bearbeitet</small>
                    )}

                    {ownComment && (
                      <div className="community-post-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => startEditing(comment)}
                          disabled={savingComment}
                        >
                          Bearbeiten
                        </button>

                        <button
                          className="community-delete-button"
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={savingComment}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
