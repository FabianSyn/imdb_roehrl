
/**
 * Diese Seite zeigt das Benutzerprofil mit Statistiken, Communities,
 * Diskussionen, Manga-Bewertungen und Kommentaren an.
 * Außerdem kann der Benutzer seinen Benutzernamen bearbeiten.
 *
 * useAuth() verwaltet den angemeldeten Benutzer und useProfile()
 * übernimmt das Laden und Aktualisieren der Profildaten.
 */

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../services/supabase"
import { getMangaByIds } from "../services/anilist"
import { getCommunities } from "../services/communities"
import useAuth from "../hooks/useAuth"
import useProfile from "../hooks/useProfile"

/**
 * Lädt die Profildaten eines Benutzers aus Supabase und AniList.
 * Promise.allSettled() startet mehrere Abfragen parallel und liefert
 * auch dann Ergebnisse, wenn einzelne Anfragen fehlschlagen.
 *
 * Die Funktion steht außerhalb der React-Komponente, damit sie
 * eine stabile Funktionsreferenz besitzt und useProfile()
 * nicht bei jedem Rendern erneut Daten lädt.
 */
async function loadProfileData(userId) {
  const [
    profileResult,
    ratingResult,
    commentResult,
    communityResult,
    postResult,
    replyResult
  ] = await Promise.allSettled([
    supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single(),

    supabase
      .from("ratings")
      .select("manga_id, rating, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("comments")
      .select("id, manga_id, content, spoiler, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    getCommunities(),

    supabase
      .from("community_posts")
      .select("id, community_id, title, content, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("community_replies")
      .select("id, post_id, content, created_at, community_posts(title, community_id)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
  ])

  /**
   * Liest ein Ergebnis von Promise.allSettled() aus.
   * Wenn eine Anfrage fehlgeschlagen ist, wird der Ersatzwert
   * zurückgegeben, damit andere Profildaten sichtbar bleiben.
   */
  const readResult = (result, fallback) => {
    if (
      result.status === "rejected" ||
      result.value?.error
    ) {
      return fallback
    }

    return result.value?.data ?? result.value ?? fallback
  }

  const profile = readResult(profileResult, null)
  const ratings = readResult(ratingResult, [])
  const comments = readResult(commentResult, [])
  const communities = readResult(communityResult, [])
  const posts = readResult(postResult, [])
  const replies = readResult(replyResult, [])

  // Prüft, ob mindestens eine der Datenbankabfragen fehlgeschlagen ist.
  const failed = [
    profileResult,
    ratingResult,
    commentResult,
    communityResult,
    postResult,
    replyResult
  ].some(
    (result) =>
      result.status === "rejected" ||
      result.value?.error
  )

  let warning = failed
    ? "Einige Profildaten konnten nicht geladen werden."
    : ""

  /**
   * Trennt selbst erstellte Communities von Mitgliedschaften.
   * filter() wählt passende Communities aus und some()
   * überprüft, ob der Benutzer Mitglied der Gruppe ist.
   */
  const createdCommunities = communities.filter(
    (item) => item.created_by === userId
  )

  const joinedCommunities = communities.filter(
    (item) =>
      item.created_by !== userId &&
      item.community_members?.some(
        (member) => member.user_id === userId
      )
  )

  /**
   * Sammelt sämtliche Manga-IDs aus Bewertungen und Kommentaren.
   * map() liest die IDs aus und Set entfernt doppelte Einträge.
   */
  const ids = [
    ...new Set([
      ...ratings.map((item) => item.manga_id),
      ...comments.map((item) => item.manga_id)
    ])
  ]

  // Speichert die AniList-Daten als Nachschlageobjekt nach Manga-ID.
  let mangaMap = {}

  if (ids.length > 0) {
    try {
      const manga = await getMangaByIds(ids)

      manga.forEach((item) => {
        mangaMap[item.id] = item
      })
    } catch {
      warning = "Einige Manga-Cover konnten nicht geladen werden."
    }
  }

  /**
   * Gibt die fertig aufbereiteten Daten zurück.
   * useProfile() speichert dieses Objekt in seinem State,
   * sodass Profile.jsx die Daten zur Darstellung verwenden kann.
   */
  return {
    username: profile?.username || "",
    ratings,
    comments,
    createdCommunities,
    joinedCommunities,
    posts,
    replies,
    mangaMap,
    warning
  }
}

/**
 * Zeigt das Profil des angemeldeten Benutzers an.
 * useAuth() liefert den Benutzer, useProfile() die Profildaten.
 * useState() verwaltet den bearbeitbaren Benutzernamen
 * sowie den Speicherstatus und die Rückmeldungen.
 */
export default function Profile() {
  // Lädt den angemeldeten Benutzer über den eigenen Auth-Hook.
  const {
    user,
    loading: authLoading
  } = useAuth()

  // Lädt sämtliche Profildaten mithilfe des eigenen Profil-Hooks.
  const {
    profileData,
    loading: profileLoading,
    error: profileError
  } = useProfile(user?.id, loadProfileData)

  // Speichert die Benutzernamen-Eingabe und den Speicherstatus.
  const [username, setUsername] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  /**
   * Übernimmt nach dem Laden den Benutzernamen aus den Profildaten.
   * useEffect() reagiert auf Änderungen der geladenen Daten
   * und aktualisiert die Eingabe des Bearbeitungsformulars.
   */
  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username)
    }
  }, [profileData])

  // Liest die geladenen Daten aus dem Ergebnis des Profil-Hooks.
  const ratings = profileData?.ratings || []
  const comments = profileData?.comments || []
  const mangaMap = profileData?.mangaMap || {}

  const createdCommunities =
    profileData?.createdCommunities || []

  const joinedCommunities =
    profileData?.joinedCommunities || []

  const posts = profileData?.posts || []
  const replies = profileData?.replies || []

  // Das Registrierungsdatum stammt aus dem Supabase-Benutzerobjekt.
  const createdAt = user?.created_at || ""

  /**
   * Speichert einen geänderten Benutzernamen in Supabase.
   * update() aktualisiert den Datensatz, eq() beschränkt
   * die Änderung auf den angemeldeten Benutzer.
   */
  const handleSave = async (event) => {
    event.preventDefault()

    if (!user || saving) return

    setSaving(true)
    setMessage("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      setMessage("Profil erfolgreich gespeichert.")
    } catch (err) {
      setMessage(
        err.message || "Profil konnte nicht gespeichert werden."
      )
    } finally {
      setSaving(false)
    }
  }

  /**
   * Ermittelt den Titel eines Manga anhand seiner ID.
   * Über mangaMap wird der Manga gesucht.
   * Bevorzugt wird der englische, sonst der Romaji-Titel.
   */
  const getMangaTitle = (id) => {
    const manga = mangaMap[id]

    return (
      manga?.title?.english ||
      manga?.title?.romaji ||
      `Manga #${id}`
    )
  }

  // Berechnet die Gesamtzahl eigener und beigetretener Communities.
  const totalCommunities =
    createdCommunities.length + joinedCommunities.length

  // Wartet, bis Anmeldung und Profildaten vollständig geladen wurden.
  if (authLoading || profileLoading) {
    return (
      <main className="page">
        <p className="muted">Profil wird geladen...</p>
      </main>
    )
  }

  // Zeigt eine Meldung, wenn kein Benutzer angemeldet ist.
  if (!user) {
    return (
      <main className="page">
        <h1>Anmeldung erforderlich</h1>
        <p>Du musst angemeldet sein, um dein Profil anzusehen.</p>
        <Link className="primary-button" to="/login">
          Zum Login
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      {/* Profilinformationen mit Benutzername, E-Mail und Registrierungsdatum */}
      <section className="profile-v2-hero">
        <div className="profile-v2-avatar">
          {username
            ? username.charAt(0).toUpperCase()
            : "?"}
        </div>

        <div className="profile-v2-identity">
          <p className="hero-eyebrow">
            IMDB Member Profile
          </p>

          <h1>{username || "Manga-Fan"}</h1>
          <p>{user.email}</p>

          <span className="profile-v2-member">
            Mitglied seit{" "}
            {createdAt
              ? new Date(createdAt).toLocaleDateString("de-DE")
              : "Unbekannt"}
          </span>
        </div>

        <span className="profile-v2-stamp">
          MEMBER!
        </span>
      </section>

      {/* Statistiken werden aus den geladenen Arrays berechnet. */}
      <section className="profile-v2-stats">
        <div className="profile-v2-stat">
          <strong>{ratings.length}</strong>
          <span>Bewertungen</span>
        </div>

        <div className="profile-v2-stat">
          <strong>{comments.length}</strong>
          <span>Kommentare</span>
        </div>

        <div className="profile-v2-stat">
          <strong>{totalCommunities}</strong>
          <span>Communities</span>
        </div>

        <div className="profile-v2-stat">
          <strong>{posts.length}</strong>
          <span>Diskussionen</span>
        </div>
      </section>

      {/* Formular zur Änderung des Benutzernamens */}
      <section className="panel profile-v2-edit">
        <h2 className="panel-title">
          Profil bearbeiten
        </h2>

        <form onSubmit={handleSave}>
          <div>
            <label htmlFor="username">
              Benutzername
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Dein Benutzername"
              maxLength={40}
              required
            />
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </form>

        {message && (
          <p role="status">{message}</p>
        )}

        {profileError && (
          <p role="alert">{profileError}</p>
        )}

        {profileData?.warning && (
          <p role="alert">{profileData.warning}</p>
        )}
      </section>

      {/* Eigene Communities und weitere Mitgliedschaften */}
      <section className="profile-v2-section">
        <div className="profile-v2-heading">
          <div>
            <p className="hero-eyebrow">
              My Communities
            </p>

            <h2 className="section-title">
              Meine <span>Communities.</span>
            </h2>
          </div>

          <Link
            className="secondary-button"
            to="/communities"
          >
            Communities entdecken
          </Link>
        </div>

        <div className="profile-v2-columns">
          <div className="panel">
            <h3 className="panel-title">
              Von mir erstellt
            </h3>

            {createdCommunities.length === 0 && (
              <p className="muted">
                Noch keine eigene Community erstellt.
              </p>
            )}

            <div className="profile-list">
              {createdCommunities.map((community) => (
                <Link
                  className="profile-entry"
                  key={community.id}
                  to={`/communities/${community.id}`}
                >
                  <div>
                    <strong>{community.name}</strong>
                    <p className="muted">
                      {community.community_members?.length || 0} Mitglieder
                    </p>
                  </div>

                  <strong className="profile-v2-arrow">
                    →
                  </strong>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">
              Mitgliedschaften
            </h3>

            {joinedCommunities.length === 0 && (
              <p className="muted">
                Du bist noch keiner weiteren Community beigetreten.
              </p>
            )}

            <div className="profile-list">
              {joinedCommunities.map((community) => (
                <Link
                  className="profile-entry"
                  key={community.id}
                  to={`/communities/${community.id}`}
                >
                  <div>
                    <strong>{community.name}</strong>
                    <p className="muted">
                      {community.community_members?.length || 0} Mitglieder
                    </p>
                  </div>

                  <strong className="profile-v2-arrow">
                    →
                  </strong>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eigene Diskussionsthemen und Antworten */}
      <section className="profile-v2-section">
        <p className="hero-eyebrow">
          Discussion History
        </p>

        <h2 className="section-title">
          Meine <span>Diskussionen.</span>
        </h2>

        <div className="profile-v2-columns">
          <div className="panel">
            <h3 className="panel-title">
              Meine Themen ({posts.length})
            </h3>

            {posts.length === 0 && (
              <p className="muted">
                Du hast noch kein Diskussionsthema eröffnet.
              </p>
            )}

            <div className="profile-list">
              {posts.slice(0, 10).map((post) => (
                <Link
                  className="profile-entry"
                  key={post.id}
                  to={`/communities/${post.community_id}`}
                >
                  <div>
                    <strong>{post.title}</strong>

                    <p className="muted">
                      {new Date(post.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>

                  <strong className="profile-v2-arrow">
                    →
                  </strong>
                </Link>
              ))}
            </div>

            {posts.length > 10 && (
              <p className="muted">
                Die 10 neuesten Themen werden angezeigt.
              </p>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">
              Meine Antworten ({replies.length})
            </h3>

            {replies.length === 0 && (
              <p className="muted">
                Du hast noch auf keine Diskussion geantwortet.
              </p>
            )}

            <div className="profile-list">
              {replies.slice(0, 10).map((reply) => (
                <Link
                  className="profile-entry"
                  key={reply.id}
                  to={
                    reply.community_posts?.community_id
                      ? `/communities/${reply.community_posts.community_id}`
                      : "/communities"
                  }
                >
                  <div>
                    <strong>
                      {reply.community_posts?.title || "Diskussion"}
                    </strong>

                    <p>
                      {reply.content.length > 110
                        ? `${reply.content.slice(0, 110)}...`
                        : reply.content}
                    </p>

                    <small className="muted">
                      {new Date(reply.created_at).toLocaleDateString("de-DE")}
                    </small>
                  </div>

                  <strong className="profile-v2-arrow">
                    →
                  </strong>
                </Link>
              ))}
            </div>

            {replies.length > 10 && (
              <p className="muted">
                Die 10 neuesten Antworten werden angezeigt.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Manga-Bewertungen mit Titeln und Coverbildern aus AniList */}
      <section className="profile-v2-section">
        <p className="hero-eyebrow">
          My Ratings
        </p>

        <h2 className="section-title">
          Meine <span>Bewertungen.</span>
        </h2>

        <div className="panel">
          {ratings.length === 0 && (
            <p className="muted">
              Du hast noch keine Manga bewertet.
            </p>
          )}

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
                        loading="lazy"
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
        </div>
      </section>

      {/* Eigene Manga-Kommentare mit Spoiler-Kennzeichnung */}
      <section className="profile-v2-section">
        <p className="hero-eyebrow">
          My Comments
        </p>

        <h2 className="section-title">
          Meine <span>Kommentare.</span>
        </h2>

        <div className="panel">
          {comments.length === 0 && (
            <p className="muted">
              Du hast noch keine Manga kommentiert.
            </p>
          )}

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
                        loading="lazy"
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
                        {item.spoiler
                          ? "Spoiler-Kommentar – auf der Manga-Seite ansehen"
                          : item.content.length > 140
                            ? `${item.content.slice(0, 140)}...`
                            : item.content}
                      </p>

                      <small className="muted">
                        {new Date(item.created_at).toLocaleString("de-DE")}
                      </small>
                    </div>
                  </div>

                  <strong className="profile-v2-arrow">
                    →
                  </strong>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
