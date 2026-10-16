import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getManga } from "../services/anilist"
import { supabase } from "../services/supabase"
import { getUserRating, getAverageRating, saveRating } from "../services/ratings"
import { getComments, addComment, updateComment, deleteComment } from "../services/comments"

// Manga-Details laden / Load manga details
export default function MangaDetails() {
  const { id } = useParams()
  const [manga, setManga] = useState(null)
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState("")
  const [averageRating, setAverageRating] = useState(null)
  const [ratingMessage, setRatingMessage] = useState("")
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState("")
  const [spoiler, setSpoiler] = useState(false)
  const [commentMessage, setCommentMessage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [editSpoiler, setEditSpoiler] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadManga = async () => {
      try {
        setLoading(true)
        setError("")

        // Manga laden / Load manga
        const data = await getManga(id)
        setManga(data)

        // Nutzer laden / Load user
        const { data: userData } = await supabase.auth.getUser()
        const currentUser = userData.user
        setUser(currentUser)

        // Bewertungen laden / Load ratings
        const average = await getAverageRating(Number(id))
        setAverageRating(average)

        if (currentUser) {
          const ownRating = await getUserRating(Number(id), currentUser.id)
          if (ownRating) setRating(ownRating)
        }

        // Kommentare laden / Load comments
        const commentData = await getComments(Number(id))
        setComments(commentData)
      } catch {
        setError("Fehler beim Laden des Manga.")
      } finally {
        setLoading(false)
      }
    }

    loadManga()
  }, [id])

  // Bewertung speichern / Save rating
  const handleRating = async (event) => {
    event.preventDefault()
    if (!user) {
      setRatingMessage("Bitte zuerst einloggen.")
      return
    }

    try {
      await saveRating(Number(id), user.id, Number(rating))
      const average = await getAverageRating(Number(id))
      setAverageRating(average)
      setRatingMessage("Bewertung gespeichert.")
    } catch {
      setRatingMessage("Bewertung konnte nicht gespeichert werden.")
    }
  }

  // Kommentar speichern / Save comment
  const handleComment = async (event) => {
    event.preventDefault()
    if (!user) {
      setCommentMessage("Bitte zuerst einloggen.")
      return
    }

    if (!comment.trim()) return

    try {
      await addComment(Number(id), user.id, comment.trim(), spoiler)
      const commentData = await getComments(Number(id))
      setComments(commentData)
      setComment("")
      setSpoiler(false)
      setCommentMessage("Kommentar gespeichert.")
    } catch {
      setCommentMessage("Kommentar konnte nicht gespeichert werden.")
    }
  }

  // Bearbeitung starten / Start editing
  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditContent(item.content)
    setEditSpoiler(item.spoiler)
    setCommentMessage("")
  }

  // Bearbeitung abbrechen / Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
    setEditSpoiler(false)
  }

  // Kommentar aktualisieren / Update comment
  const handleUpdateComment = async (event, commentId) => {
    event.preventDefault()
    if (!user || !editContent.trim()) return

    try {
      await updateComment(
        commentId,
        user.id,
        editContent.trim(),
        editSpoiler
      )

      const commentData = await getComments(Number(id))
      setComments(commentData)
      setEditingId(null)
      setEditContent("")
      setEditSpoiler(false)
      setCommentMessage("Kommentar aktualisiert.")
    } catch {
      setCommentMessage("Kommentar konnte nicht aktualisiert werden.")
    }
  }

  // Kommentar löschen / Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!user) return

    try {
      await deleteComment(commentId, user.id)
      setComments(comments.filter((item) => item.id !== commentId))

      if (editingId === commentId) {
        handleCancelEdit()
      }

      setCommentMessage("Kommentar gelöscht.")
    } catch {
      setCommentMessage("Kommentar konnte nicht gelöscht werden.")
    }
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Manga wird geladen...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page">
        <p>{error}</p>
      </main>
    )
  }

  if (!manga) {
    return (
      <main className="page">
        <p>Manga nicht gefunden.</p>
      </main>
    )
  }

  const title = manga.title.english || manga.title.romaji

  return (
    <main className="page">
      {/* Banner / Banner */}
      {manga.bannerImage && (
        <img
          className="manga-banner"
          src={manga.bannerImage}
          alt=""
        />
      )}

      {/* Manga-Kopfbereich / Manga header */}
      <section className="manga-detail-grid">
        <div>
          <img
            className="manga-cover-large"
            src={manga.coverImage.extraLarge}
            alt={title}
          />
        </div>

        <div className="manga-detail-content">
          <p className="hero-eyebrow">Internet Manga Database</p>

          <h1 className="manga-title">
            {title}
          </h1>

          {manga.title.native && (
            <p className="muted">
              {manga.title.native}
            </p>
          )}

          <div className="genre-list">
            {manga.genres.map((genre) => (
              <span
                className="genre-tag"
                key={genre}
              >
                {genre}
              </span>
            ))}
          </div>

          <p>
            AniList Score:{" "}
            <strong>
              {manga.averageScore || "Keine Bewertung"}
            </strong>
          </p>

          <p>
            Status:{" "}
            <strong>
              {manga.status || "Unbekannt"}
            </strong>
          </p>

          <p>
            Kapitel:{" "}
            <strong>
              {manga.chapters || "Unbekannt"}
            </strong>
          </p>

          <p>
            Bände:{" "}
            <strong>
              {manga.volumes || "Unbekannt"}
            </strong>
          </p>
        </div>
      </section>

      {/* Beschreibung / Description */}
      <section className="panel">
        <h2 className="panel-title">
          Über diesen Manga
        </h2>

        <div
          className="muted"
          dangerouslySetInnerHTML={{
            __html:
              manga.description ||
              "Keine Beschreibung verfügbar."
          }}
        />
      </section>

      {/* Community Bewertung / Community rating */}
      <section className="panel">
        <p className="hero-eyebrow">
          Community Score
        </p>

        <h2 className="panel-title">
          IMDB Bewertung
        </h2>

        <p>
          Community Score:{" "}
          <strong>
            {averageRating
              ? `${averageRating}/10`
              : "Noch keine Bewertungen"}
          </strong>
        </p>

        {user ? (
          <form onSubmit={handleRating}>
            <label htmlFor="rating">
              Deine Bewertung
            </label>

            <select
              id="rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            >
              <option value="">
                Bewertung wählen
              </option>

              {[1,2,3,4,5,6,7,8,9,10].map((value) => (
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
            >
              Bewertung speichern
            </button>
          </form>
        ) : (
          <p className="muted">
            Bitte einloggen, um diesen Manga zu bewerten.
          </p>
        )}

        {ratingMessage && (
          <p>{ratingMessage}</p>
        )}
      </section>

      {/* Staff / Staff */}
      <section className="panel">
        <h2 className="panel-title">
          Staff
        </h2>

        {manga.staff.edges.length === 0 ? (
          <p className="muted">
            Keine Staff-Informationen verfügbar.
          </p>
        ) : (
          manga.staff.edges.map((entry) => (
            <p key={`${entry.node.id}-${entry.role}`}>
              <strong>
                {entry.node.name.full}
              </strong>
              {" – "}
              <span className="muted">
                {entry.role}
              </span>
            </p>
          ))
        )}
      </section>

      {/* Kommentare / Comments */}
      <section className="panel">
        <p className="hero-eyebrow">
          Community
        </p>

        <h2 className="panel-title">
          Kommentare
        </h2>

        {user ? (
          <form onSubmit={handleComment}>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Was denkst du über diesen Manga?"
              maxLength="2000"
              required
            />

            <label>
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(event) => setSpoiler(event.target.checked)}
              />
              {" "}
              Enthält Spoiler
            </label>

            <div style={{ marginTop: "14px" }}>
              <button
                className="primary-button"
                type="submit"
              >
                Kommentar veröffentlichen
              </button>
            </div>
          </form>
        ) : (
          <p className="muted">
            Bitte einloggen, um einen Kommentar zu schreiben.
          </p>
        )}

        {commentMessage && (
          <p>{commentMessage}</p>
        )}

        <div>
          {comments.length === 0 ? (
            <p className="muted">
              Noch keine Kommentare. Sei der Erste.
            </p>
          ) : (
            comments.map((item) => (
              <article
                className="comment"
                key={item.id}
              >
                <div className="comment-head">
                  <strong>
                    {item.profiles?.username || "Unbekannter Nutzer"}
                  </strong>

                  <small className="muted">
                    {new Date(item.created_at).toLocaleString()}
                  </small>
                </div>

                {editingId === item.id ? (
                  <form
                    onSubmit={(event) =>
                      handleUpdateComment(event, item.id)
                    }
                  >
                    <textarea
                      value={editContent}
                      onChange={(event) =>
                        setEditContent(event.target.value)
                      }
                      maxLength="2000"
                      required
                    />

                    <label>
                      <input
                        type="checkbox"
                        checked={editSpoiler}
                        onChange={(event) =>
                          setEditSpoiler(event.target.checked)
                        }
                      />
                      {" "}
                      Enthält Spoiler
                    </label>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "14px",
                        flexWrap: "wrap"
                      }}
                    >
                      <button
                        className="primary-button"
                        type="submit"
                      >
                        Speichern
                      </button>

                      <button
                        className="secondary-button"
                        type="button"
                        onClick={handleCancelEdit}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {item.spoiler && (
                      <span className="spoiler-badge">
                        Spoiler
                      </span>
                    )}

                    <p>
                      {item.content}
                    </p>

                    {item.updated_at &&
                      item.updated_at !== item.created_at && (
                        <small className="muted">
                          Bearbeitet
                        </small>
                      )}

                    {user?.id === item.user_id && (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "14px",
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleStartEdit(item)}
                        >
                          Bearbeiten
                        </button>

                        <button
                          className="nav-button"
                          type="button"
                          onClick={() => handleDeleteComment(item.id)}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}