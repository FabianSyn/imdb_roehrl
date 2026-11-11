
/**
 * Diese Seite zeigt Informationen zu einem Manga und ermöglicht
 * angemeldeten Benutzern, Bewertungen und Kommentare zu verwalten.
 *
 * Manga-Fakten, Beschreibung und Mitwirkende sind ausklappbar.
 * Sprunglinks ermöglichen direkten Zugriff auf Bewertung und Kommentare.
 */

import { useState } from "react"
import { useParams, Link } from "react-router-dom"

import useAuth from "../hooks/useAuth"
import useManga from "../hooks/useManga"
import useMangaRatings from "../hooks/useMangaRatings"
import useComments from "../hooks/useComments"

import SpoilerContent from "../components/SpoilerContent"

/**
 * Verwaltet die Manga-Detailseite mithilfe mehrerer Custom Hooks.
 * useParams() liest die Manga-ID aus der URL.
 * Die Hooks übernehmen das Laden und Speichern der Daten,
 * während useState() die lokalen Formulareingaben verwaltet.
 */
export default function MangaDetails() {
  const { id } = useParams()

  // Lädt die Manga-Informationen aus AniList.
  const {
    manga,
    loading: mangaLoading,
    error: mangaError
  } = useManga(id)

  // Lädt den aktuell angemeldeten Benutzer.
  const {
    user,
    loading: authLoading
  } = useAuth()

  // Verwaltet die persönliche Bewertung und den Community-Durchschnitt.
  const {
    rating,
    setRating,
    averageRating,
    loading: ratingsLoading,
    saving: savingRating,
    error: ratingsError,
    message,
    submitRating
  } = useMangaRatings(id, user?.id)

  // Verwaltet Kommentare und stellt Funktionen zum Ändern bereit.
  const {
    comments,
    loading: commentsLoading,
    saving: savingComment,
    error: commentsError,
    createComment,
    editComment,
    removeComment
  } = useComments(id, user?.id)

  // Speichert Eingaben für neue und zu bearbeitende Kommentare.
  const [commentText, setCommentText] = useState("")
  const [spoiler, setSpoiler] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  const [editSpoiler, setEditSpoiler] = useState(false)

  /**
   * Speichert die ausgewählte Bewertung über useMangaRatings().
   * preventDefault() verhindert das Neuladen der Seite.
   */
  const handleSaveRating = async (event) => {
    event.preventDefault()
    await submitRating()
  }

  /**
   * Erstellt einen neuen Kommentar über useComments().
   * Nach erfolgreichem Speichern werden die Eingabefelder geleert.
   */
  const handleAddComment = async (event) => {
    event.preventDefault()

    if (!commentText.trim()) return

    const success = await createComment(commentText, spoiler)

    if (success) {
      setCommentText("")
      setSpoiler(false)
    }
  }

  /**
   * Öffnet das Bearbeitungsformular eines Kommentars.
   * Die aktuellen Werte werden in die lokalen States übernommen.
   */
  const startEditing = (comment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
    setEditSpoiler(Boolean(comment.spoiler))
  }

  /**
   * Aktualisiert einen vorhandenen Kommentar über useComments().
   * Nach erfolgreichem Speichern wird der Bearbeitungsmodus beendet.
   */
  const handleUpdateComment = async (event) => {
    event.preventDefault()

    if (editingId === null || !editText.trim()) return

    const success = await editComment(
      editingId,
      editText,
      editSpoiler
    )

    if (success) {
      setEditingId(null)
      setEditText("")
      setEditSpoiler(false)
    }
  }

  /**
   * Löscht einen Kommentar nach Bestätigung durch window.confirm().
   * removeComment() entfernt ihn über den Custom Hook aus Supabase.
   */
  const handleDeleteComment = async (commentId) => {
    if (
      !window.confirm(
        "Möchtest du diesen Kommentar wirklich löschen?"
      )
    ) {
      return
    }

    const success = await removeComment(commentId)

    if (success && editingId === commentId) {
      setEditingId(null)
    }
  }

  // Wartet auf Manga-Daten, Anmeldung, Bewertungen und Kommentare.
  const loading =
    mangaLoading ||
    authLoading ||
    ratingsLoading ||
    commentsLoading

  if (loading) {
    return (
      <main className="page">
        <p className="muted">
          Manga wird geladen...
        </p>
      </main>
    )
  }

  if (mangaError || !manga) {
    return (
      <main className="page">
        <h1>Manga nicht gefunden</h1>

        <p role="alert">
          {mangaError || "Dieser Manga konnte nicht geladen werden."}
        </p>

        <Link className="primary-button" to="/search">
          Zur Manga-Suche
        </Link>
      </main>
    )
  }

  // Verwendet bevorzugt den englischen, sonst den Romaji-Titel.
  const title =
    manga.title?.english ||
    manga.title?.romaji ||
    "Unbekannter Manga"

  /**
   * Formatiert AniList-Datumsangaben als Tag.Monat.Jahr.
   * filter(Boolean) entfernt fehlende Bestandteile,
   * join(".") verbindet die übrigen Werte mit Punkten.
   */
  const formatDate = (date) => {
    if (!date?.year) return "Unbekannt"

    return [
      date.day,
      date.month,
      date.year
    ].filter(Boolean).join(".")
  }

  return (
    <main className="page">
      <Link className="community-back" to="/search">
        ← Zurück zum Manga-Archiv
      </Link>

      {/* Direkte Navigation zu den wichtigsten Interaktionen. */}
      <nav
        className="manga-quick-nav"
        aria-label="Schnellnavigation zum Manga"
      >
        <a
          className="primary-button"
          href="#manga-rating-section"
        >
          ★ Manga bewerten
        </a>

        <a
          className="secondary-button"
          href="#manga-comments-section"
        >
          Kommentare ({comments.length}) ↓
        </a>
      </nav>

      {/* Banner aus der AniList-API */}
      {manga.bannerImage && (
        <img
          className="manga-banner"
          src={manga.bannerImage}
          alt={`${title} Banner`}
        />
      )}

      {/* Manga-Titel, Cover und die wichtigsten Informationen. */}
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

          <h1 className="manga-title">
            {title}
          </h1>

          {manga.title?.native && (
            <p className="muted">
              {manga.title.native}
            </p>
          )}

          {/* Genres bleiben direkt sichtbar. */}
          <div className="genre-list">
            {(manga.genres || []).map((genre) => (
              <span
                className="genre-tag"
                key={genre}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* AniList- und Community-Bewertung bleiben immer sichtbar. */}
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
                {averageRating != null
                  ? `${averageRating}/10`
                  : "N/A"}
              </strong>
            </div>
          </div>

          {/* Ausklappbarer Bereich: Manga-Fakten */}
          <details className="manga-accordion">
            <summary className="manga-accordion-summary">
              <span>Allgemeine Informationen</span>
              <span
                className="manga-accordion-icon"
                aria-hidden="true"
              >
                +
              </span>
            </summary>

            <div className="manga-accordion-content">
              <div className="manga-facts">
                <p>
                  <strong>Status:</strong>{" "}
                  {manga.status?.replaceAll("_", " ") || "Unbekannt"}
                </p>

                <p>
                  <strong>Kapitel:</strong>{" "}
                  {manga.chapters ?? "Unbekannt"}
                </p>

                <p>
                  <strong>Bände:</strong>{" "}
                  {manga.volumes ?? "Unbekannt"}
                </p>

                <p>
                  <strong>Beginn:</strong>{" "}
                  {formatDate(manga.startDate)}
                </p>

                <p>
                  <strong>Ende:</strong>{" "}
                  {formatDate(manga.endDate)}
                </p>
              </div>
            </div>
          </details>

          {/* Ausklappbarer Bereich: Manga-Beschreibung */}
          <details className="manga-accordion">
            <summary className="manga-accordion-summary">
              <span>Beschreibung</span>
              <span
                className="manga-accordion-icon"
                aria-hidden="true"
              >
                +
              </span>
            </summary>

            <div className="manga-accordion-content">
              <div className="manga-description">
                {manga.description ? (
                  manga.description
                    .replace(/<br\s*\/?>/gi, "\n")
                    .replace(/<[^>]*>/g, "")
                    .split("\n")
                    .map((line, index) => (
                      <p key={index}>
                        {line || "\u00a0"}
                      </p>
                    ))
                ) : (
                  <p className="muted">
                    Keine Beschreibung vorhanden.
                  </p>
                )}
              </div>
            </div>
          </details>

          {/* Ausklappbarer Bereich: Mitwirkende */}
          {manga.staff?.edges?.length > 0 && (
            <details className="manga-accordion">
              <summary className="manga-accordion-summary">
                <span>Mitwirkende</span>
                <span
                  className="manga-accordion-icon"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>

              <div className="manga-accordion-content">
                <div className="manga-staff">
                  {manga.staff.edges
                    .slice(0, 8)
                    .map((edge, index) => (
                      <p key={`${edge.node.id}-${index}`}>
                        <strong>{edge.role}:</strong>{" "}
                        {edge.node.name.full}
                      </p>
                    ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Bewertungssystem für angemeldete Benutzer */}
      <section
        className="panel"
        id="manga-rating-section"
      >
        <p className="hero-eyebrow">
          Rate this Manga
        </p>

        <h2 className="panel-title">
          Deine Bewertung
        </h2>

        {!user ? (
          <p>
            Du musst{" "}
            <Link
              className="community-text-link"
              to="/login"
            >
              angemeldet
            </Link>{" "}
            sein, um diesen Manga zu bewerten.
          </p>
        ) : (
          <form
            className="manga-rating-form"
            onSubmit={handleSaveRating}
          >
            <label htmlFor="manga-rating">
              Bewertung von 1 bis 10
            </label>

            <select
              id="manga-rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            >
              <option value="">
                Bewertung auswählen
              </option>

              {Array.from(
                { length: 10 },
                (_, index) => index + 1
              ).map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}/10
                </option>
              ))}
            </select>

            <button
              className="primary-button"
              type="submit"
              disabled={savingRating}
            >
              {savingRating
                ? "Speichern..."
                : "Bewertung speichern"}
            </button>
          </form>
        )}

        {message && (
          <p role="status">
            {message}
          </p>
        )}

        {ratingsError && (
          <p role="alert">
            {ratingsError}
          </p>
        )}
      </section>

      {/* Kommentare erstellen, anzeigen, bearbeiten und löschen */}
      <section
        className="panel"
        id="manga-comments-section"
      >
        <p className="hero-eyebrow">
          Manga Discussion
        </p>

        <h2 className="panel-title">
          Kommentare ({comments.length})
        </h2>

        {user ? (
          <form
            className="manga-comment-form"
            onSubmit={handleAddComment}
          >
            <label htmlFor="new-comment">
              Dein Kommentar
            </label>

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
              {savingComment
                ? "Veröffentlichen..."
                : "Kommentar veröffentlichen"}
            </button>
          </form>
        ) : (
          <p>
            <Link
              className="community-text-link"
              to="/login"
            >
              Melde dich an
            </Link>
            , um einen Kommentar zu schreiben.
          </p>
        )}

        {commentsError && (
          <p
            className="auth-message"
            role="alert"
          >
            {commentsError}
          </p>
        )}

        {comments.length === 0 && !commentsError && (
          <p className="muted">
            Noch keine Kommentare vorhanden. Schreibe den ersten!
          </p>
        )}

        <div className="manga-comments-list">
          {comments.map((comment) => {
            // Prüft, ob der Kommentar dem angemeldeten Benutzer gehört.
            const ownComment = Boolean(
              user && comment.user_id === user.id
            )

            return (
              <article
                className="comment"
                key={comment.id}
              >
                {editingId === comment.id ? (
                  <form
                    className="manga-comment-form"
                    onSubmit={handleUpdateComment}
                  >
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
                      <strong>
                        {comment.profiles?.username || "Manga-Fan"}
                      </strong>

                      <small className="muted">
                        {new Date(comment.created_at).toLocaleString("de-DE")}
                      </small>
                    </div>

                    {/* Spoiler werden erst nach dem Bestätigen angezeigt. */}
                    <SpoilerContent
                      key={`${comment.id}-${comment.updated_at}`}
                      spoiler={Boolean(comment.spoiler)}
                    >
                      <p className="manga-comment-content">
                        {comment.content}
                      </p>
                    </SpoilerContent>

                    {comment.updated_at !== comment.created_at && (
                      <small className="muted">
                        Bearbeitet
                      </small>
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
