import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../services/supabase"
import { getMangaByIds } from "../services/anilist"

// Profil laden / Load profile
export default function Profile() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState("")
  const [createdAt, setCreatedAt] = useState("")
  const [ratings, setRatings] = useState([])
  const [comments, setComments] = useState([])
  const [mangaMap, setMangaMap] = useState({})
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const currentUser = userData.user

        if (!currentUser) {
          setLoading(false)
          return
        }

        setUser(currentUser)
        setCreatedAt(currentUser.created_at)

        // Profil laden / Load profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", currentUser.id)
          .single()

        if (profileError) throw profileError
        setUsername(profileData?.username || "")

        // Bewertungen laden / Load ratings
        const { data: ratingData, error: ratingError } = await supabase
          .from("ratings")
          .select("manga_id, rating, created_at, updated_at")
          .eq("user_id", currentUser.id)
          .order("updated_at", { ascending: false })

        if (ratingError) throw ratingError

        // Kommentare laden / Load comments
        const { data: commentData, error: commentError } = await supabase
          .from("comments")
          .select("id, manga_id, content, spoiler, created_at, updated_at")
          .eq("user_id", currentUser.id)
          .order("updated_at", { ascending: false })

        if (commentError) throw commentError

        const loadedRatings = ratingData || []
        const loadedComments = commentData || []

        setRatings(loadedRatings)
        setComments(loadedComments)

        // Manga-IDs sammeln / Collect manga IDs
        const mangaIds = [
          ...new Set([
            ...loadedRatings.map((item) => item.manga_id),
            ...loadedComments.map((item) => item.manga_id)
          ])
        ]

        if (mangaIds.length > 0) {
          const mangaData = await getMangaByIds(mangaIds)

          const map = mangaData.reduce((result, manga) => {
            result[manga.id] = manga
            return result
          }, {})

          setMangaMap(map)
        }
      } catch {
        setMessage("Profildaten konnten nicht vollständig geladen werden.")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Profil speichern / Save profile
  const handleSave = async (event) => {
    event.preventDefault()
    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Profil gespeichert.")
    }
  }

  // Manga-Titel bestimmen / Get manga title
  const getMangaTitle = (mangaId) => {
    const manga = mangaMap[mangaId]
    return manga?.title?.english || manga?.title?.romaji || `Manga #${mangaId}`
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Profil wird geladen...</p>
      </main>
    )
  }

  return (
    <main className="page">
      {/* Profilkopf / Profile header */}
      <section className="profile-hero">
        <div className="profile-avatar">
          {username ? username.charAt(0).toUpperCase() : "?"}
        </div>

        <div>
          <p className="hero-eyebrow">Member Profile</p>

          <h1 className="profile-title">
            {username || "Unbekannter Nutzer"}
          </h1>

          <p className="muted">
            {user?.email}
          </p>

          <p className="muted">
            Mitglied seit:{" "}
            {createdAt
              ? new Date(createdAt).toLocaleDateString()
              : "Unbekannt"}
          </p>
        </div>
      </section>

      {/* Profil bearbeiten / Edit profile */}
      <section className="panel">
        <h2 className="panel-title">
          Profil bearbeiten
        </h2>

        <form onSubmit={handleSave}>
          <label htmlFor="username">
            Benutzername
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Benutzername"
            required
          />

          <button
            className="primary-button"
            type="submit"
          >
            Speichern
          </button>
        </form>

        {message && (
          <p>{message}</p>
        )}
      </section>

      {/* Eigene Bewertungen / Own ratings */}
      <section className="panel">
        <p className="hero-eyebrow">My Ratings</p>

        <h2 className="panel-title">
          Meine Bewertungen
        </h2>

        {ratings.length === 0 ? (
          <p className="muted">
            Du hast noch keine Manga bewertet.
          </p>
        ) : (
          <div className="profile-list">
            {ratings.map((item) => {
              const manga = mangaMap[item.manga_id]

              return (
                <Link
                  className="profile-entry"
                  key={item.manga_id}
                  to={`/manga/${item.manga_id}`}
                >
                  <div className="profile-manga-info">
                    {manga?.coverImage?.medium && (
                      <img
                        className="profile-manga-cover"
                        src={manga.coverImage.medium}
                        alt={getMangaTitle(item.manga_id)}
                      />
                    )}

                    <div>
                      <strong>
                        {getMangaTitle(item.manga_id)}
                      </strong>

                      <p className="muted">
                        Deine Bewertung
                      </p>
                    </div>
                  </div>

                  <span className="profile-rating">
                    {item.rating}/10
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Eigene Kommentare / Own comments */}
      <section className="panel">
        <p className="hero-eyebrow">My Comments</p>

        <h2 className="panel-title">
          Meine Kommentare
        </h2>

        {comments.length === 0 ? (
          <p className="muted">
            Du hast noch keine Kommentare geschrieben.
          </p>
        ) : (
          <div className="profile-list">
            {comments.map((item) => {
              const manga = mangaMap[item.manga_id]

              return (
                <Link
                  className="profile-entry profile-comment-entry"
                  key={item.id}
                  to={`/manga/${item.manga_id}`}
                >
                  <div className="profile-manga-info">
                    {manga?.coverImage?.medium && (
                      <img
                        className="profile-manga-cover"
                        src={manga.coverImage.medium}
                        alt={getMangaTitle(item.manga_id)}
                      />
                    )}

                    <div>
                      <strong>
                        {getMangaTitle(item.manga_id)}
                      </strong>

                      {item.spoiler && (
                        <span className="spoiler-badge">
                          Spoiler
                        </span>
                      )}

                      <p>
                        {item.content.length > 140
                          ? `${item.content.slice(0, 140)}...`
                          : item.content}
                      </p>

                      <small className="muted">
                        {new Date(item.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>

                  <span>
                    →
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}