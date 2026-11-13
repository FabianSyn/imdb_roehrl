
/**
 * Zeigt eine einzelne Community mit Mitgliedschaften, Diskussionen und Antworten.
 *
 * Mitglieder können Themen und Antworten erstellen, bearbeiten und löschen.
 * Spoiler können verborgen und wieder angezeigt werden.
 *
 * Nur der Gründer darf die gesamte Community löschen.
 * Ungültige Community-IDs werden vor der Supabase-Abfrage abgefangen.
 */

import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import useAuth from "../hooks/useAuth"
import useCommunityDiscussions from "../hooks/useCommunityDiscussions"

import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  deleteCommunity
} from "../services/communities"

import {
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost
} from "../services/communityPosts"

import {
  createCommunityReply,
  updateCommunityReply,
  deleteCommunityReply
} from "../services/communityReplies"

/**
 * Prüft, ob eine Zeichenfolge dem Format einer UUID entspricht.
 * So verhindern wir Anfragen mit undefined oder ungültigen IDs.
 */
const isValidUuid = (value) => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

/**
 * Hauptkomponente der Community-Detailseite.
 * useParams() liest die ID aus der URL.
 * useNavigate() ermöglicht die Weiterleitung nach dem Löschen.
 */
export default function CommunityDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Prüft die ID, bevor sie an die Datenladefunktionen weitergegeben wird.
  const validId = isValidUuid(id)
  const communityId = validId ? id : null

  // Benutzerstatus und Diskussionen werden über Custom Hooks geladen.
  const { user, loading: authLoading } = useAuth()

  const {
    posts,
    replies,
    loading: discussionsLoading,
    error: discussionsError,
    refreshDiscussions
  } = useCommunityDiscussions(communityId)

  // Community-Daten und allgemeine Statuswerte.
  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [postError, setPostError] = useState("")
  const [deleteError, setDeleteError] = useState("")

  // Eingaben für neue Diskussionsthemen.
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [spoiler, setSpoiler] = useState(false)

  // Bearbeitungsstatus für Diskussionsthemen.
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editSpoiler, setEditSpoiler] = useState(false)

  // Eingaben und Bearbeitungsstatus für Antworten.
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replySpoilers, setReplySpoilers] = useState({})
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editReplyContent, setEditReplyContent] = useState("")
  const [editReplySpoiler, setEditReplySpoiler] = useState(false)

  // Speichert, welche Spoiler sichtbar gemacht wurden.
  const [revealedPosts, setRevealedPosts] = useState({})
  const [revealedReplies, setRevealedReplies] = useState({})

  /**
   * Lädt eine einzelne Community aus Supabase.
   * Wenn die ID ungültig ist, wird keine Datenbankabfrage durchgeführt.
   * active verhindert State-Updates nach dem Verlassen der Komponente.
   */
  useEffect(() => {
    let active = true

    const loadCommunity = async () => {
      setLoading(true)
      setError("")
      setDeleteError("")
      setCommunity(null)

      if (!communityId) {
        setError("Keine gültige Community-ID in der Adresse gefunden.")
        setLoading(false)
        return
      }

      try {
        const communityData = await getCommunity(communityId)

        if (active) {
          setCommunity(communityData)
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Community konnte nicht geladen werden."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCommunity()

    return () => {
      active = false
    }
  }, [communityId])

  /**
   * Ermittelt den Gründerstatus anhand der gespeicherten created_by-ID.
   * Nur der Gründer darf die gesamte Community löschen.
   */
  const isCreator = Boolean(
    user && community?.created_by === user.id
  )

  /**
   * Prüft, ob der Benutzer Mitglied ist.
   * Der Gründer wird für die Oberfläche ebenfalls als Mitglied behandelt.
   */
  const isMember =
    isCreator ||
    Boolean(
      user &&
      community?.community_members?.some(
        (member) => member.user_id === user.id
      )
    )

  // Anzahl der Mitglieder aus der Datenbank.
  const memberCount = community?.community_members?.length || 0

  /**
   * Einheitlicher Status für Gründer und normale Mitglieder.
   * Das Label verwendet die bereits vorhandene CSS-Klasse community-kicker.
   */
  const membershipStatus = isCreator
    ? "GRÜNDER DIESER COMMUNITY"
    : isMember
      ? "MITGLIED DIESER COMMUNITY"
      : null

  /**
   * Verwaltet den Bei- und Austritt.
   * Der Gründer darf seine eigene Community nicht regulär verlassen.
   */
  const handleMembership = async () => {
    if (!user || !community || !communityId || saving || deleting || isCreator) {
      return
    }

    setSaving(true)
    setError("")

    try {
      if (isMember) {
        await leaveCommunity(communityId, user.id)
      } else {
        await joinCommunity(communityId, user.id)
      }

      setCommunity(await getCommunity(communityId))
    } catch (err) {
      setError(err.message || "Mitgliedschaft konnte nicht geändert werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Erstellt ein Diskussionsthema.
   * Nach dem Speichern werden die Diskussionen erneut angefragt.
   */
  const handleCreatePost = async (event) => {
    event.preventDefault()

    if (!user || !isMember || !communityId || saving || deleting) return

    setSaving(true)
    setPostError("")

    try {
      await createCommunityPost(
        communityId,
        user.id,
        title,
        content,
        spoiler
      )

      refreshDiscussions()

      setTitle("")
      setContent("")
      setSpoiler(false)
    } catch (err) {
      setPostError(err.message || "Thema konnte nicht erstellt werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Übernimmt ein vorhandenes Thema in das Bearbeitungsformular.
   */
  const startEditingPost = (post) => {
    setEditingId(post.id)
    setEditTitle(post.title)
    setEditContent(post.content)
    setEditSpoiler(Boolean(post.spoiler))
    setPostError("")
  }

  /**
   * Speichert ein bearbeitetes Diskussionsthema.
   * Ein zuvor geöffneter Spoiler wird danach wieder verborgen.
   */
  const handleUpdatePost = async (event) => {
    event.preventDefault()

    if (!user || saving || deleting || editingId === null) return

    setSaving(true)
    setPostError("")

    try {
      await updateCommunityPost(
        editingId,
        user.id,
        editTitle,
        editContent,
        editSpoiler
      )

      refreshDiscussions()

      setRevealedPosts((current) => ({
        ...current,
        [editingId]: false
      }))

      setEditingId(null)
    } catch (err) {
      setPostError(err.message || "Thema konnte nicht gespeichert werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht ein Thema nach Bestätigung.
   * Die zugehörigen Antworten werden entsprechend der Datenbankregeln gelöscht.
   */
  const handleDeletePost = async (postId) => {
    if (
      !user ||
      saving ||
      deleting ||
      !window.confirm("Dieses Thema und alle Antworten wirklich löschen?")
    ) {
      return
    }

    setSaving(true)
    setPostError("")

    try {
      await deleteCommunityPost(postId, user.id)

      refreshDiscussions()

      if (editingId === postId) {
        setEditingId(null)
      }
    } catch (err) {
      setPostError(err.message || "Thema konnte nicht gelöscht werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Erstellt eine neue Antwort.
   * trim() entfernt Leerzeichen am Anfang und Ende.
   */
  const handleCreateReply = async (event, postId) => {
    event.preventDefault()

    const text = replyDrafts[postId]?.trim()

    if (!user || !isMember || saving || deleting || !text) return

    setSaving(true)
    setPostError("")

    try {
      await createCommunityReply(
        postId,
        user.id,
        text,
        Boolean(replySpoilers[postId])
      )

      refreshDiscussions()

      setReplyDrafts((current) => ({
        ...current,
        [postId]: ""
      }))

      setReplySpoilers((current) => ({
        ...current,
        [postId]: false
      }))
    } catch (err) {
      setPostError(err.message || "Antwort konnte nicht erstellt werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Übernimmt eine Antwort in das Bearbeitungsformular.
   */
  const startEditingReply = (reply) => {
    setEditingReplyId(reply.id)
    setEditReplyContent(reply.content)
    setEditReplySpoiler(Boolean(reply.spoiler))
    setPostError("")
  }

  /**
   * Speichert Änderungen an einer Antwort.
   */
  const handleUpdateReply = async (event) => {
    event.preventDefault()

    if (!user || saving || deleting || editingReplyId === null) return

    setSaving(true)
    setPostError("")

    try {
      await updateCommunityReply(
        editingReplyId,
        user.id,
        editReplyContent,
        editReplySpoiler
      )

      refreshDiscussions()

      setRevealedReplies((current) => ({
        ...current,
        [editingReplyId]: false
      }))

      setEditingReplyId(null)
    } catch (err) {
      setPostError(err.message || "Antwort konnte nicht gespeichert werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht eine Antwort nach einer Bestätigung.
   */
  const handleDeleteReply = async (replyId) => {
    if (
      !user ||
      saving ||
      deleting ||
      !window.confirm("Diese Antwort wirklich löschen?")
    ) {
      return
    }

    setSaving(true)
    setPostError("")

    try {
      await deleteCommunityReply(replyId, user.id)

      refreshDiscussions()

      if (editingReplyId === replyId) {
        setEditingReplyId(null)
      }
    } catch (err) {
      setPostError(err.message || "Antwort konnte nicht gelöscht werden.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht die gesamte Community.
   *
   * Die Löschaktion wird nur für den Gründer angezeigt und ausgeführt.
   * Supabase muss dies zusätzlich mit einer RLS-Policy absichern.
   *
   * Vor dem Löschen wird eine Bestätigung verlangt.
   * Nach erfolgreichem Löschen erfolgt die Weiterleitung zur Übersicht.
   */
  const handleDeleteCommunity = async () => {
    if (
      !user ||
      !community ||
      !communityId ||
      !isCreator ||
      saving ||
      deleting
    ) {
      return
    }

    const confirmed = window.confirm(
      `Möchtest du die Community "${community.name}" wirklich löschen?\n\n` +
      "Alle Mitgliedschaften, Diskussionen und Antworten werden dauerhaft entfernt.\n\n" +
      "Diese Aktion kann nicht rückgängig gemacht werden."
    )

    if (!confirmed) return

    setDeleting(true)
    setDeleteError("")

    try {
      await deleteCommunity(communityId, user.id)

      navigate("/communities", { replace: true })
    } catch (err) {
      setDeleteError(
        err.message || "Die Community konnte nicht gelöscht werden."
      )
    } finally {
      setDeleting(false)
    }
  }

  // Ladeanzeige während der Datenabfragen.
  if (loading || authLoading || (communityId && discussionsLoading)) {
    return (
      <main className="page">
        <p className="muted">Community wird geladen...</p>
      </main>
    )
  }

  // Fehlerseite, wenn die ID ungültig ist oder die Community nicht existiert.
  if (!community) {
    return (
      <main className="page">
        <h1>Community nicht gefunden</h1>

        <p className="muted">
          {error || "Diese Community existiert nicht mehr."}
        </p>

        <Link className="primary-button" to="/communities">
          Zur Community-Übersicht
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <Link className="community-back" to="/communities">
        ← Alle Communities
      </Link>

      {/* Informationen zur Community und zum Mitgliedschaftsstatus */}
      <section className="community-detail-hero">
        <div className="community-detail-symbol">
          {community.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="hero-eyebrow">Community Headquarters</p>

          <h1 className="community-detail-title">
            {community.name}
          </h1>

          <p className="community-detail-description">
            {community.description}
          </p>

          <p className="community-detail-meta">
            {memberCount} Mitglieder · Gegründet am{" "}
            {new Date(community.created_at).toLocaleDateString("de-DE")}
          </p>

          {/* Einheitliche, nicht anklickbare Statusanzeige */}
          {membershipStatus && (
            <p className="community-kicker">
              ★ {membershipStatus}
            </p>
          )}
        </div>
      </section>

      {/* Beitritt und Austritt – der Gründer sieht keinen Button. */}
      <section className="panel community-membership-panel">
        <div>
          <p className="hero-eyebrow">Join the discussion</p>

          <h2 className="panel-title">
            {isCreator
              ? "Deine Community"
              : isMember
                ? "Du bist dabei!"
                : "Werde Mitglied!"}
          </h2>

          <p className="muted">
            {isCreator
              ? "Du hast diese Community gegründet und kannst hier Diskussionen starten und beantworten."
              : isMember
                ? "Du kannst Themen veröffentlichen und antworten."
                : "Alle dürfen mitlesen. Zum Schreiben musst du Mitglied sein."}
          </p>
        </div>

        {!user ? (
          <Link className="primary-button" to="/login">
            Zum Beitreten anmelden
          </Link>
        ) : !isCreator ? (
          <button
            className={isMember ? "secondary-button" : "primary-button"}
            type="button"
            onClick={handleMembership}
            disabled={saving || deleting}
          >
            {saving
              ? "Speichern..."
              : isMember
                ? "Community verlassen"
                : "Community beitreten"}
          </button>
        ) : null}

        {error && <p role="alert">{error}</p>}
      </section>

      {/* Formular für neue Diskussionsthemen */}
      {isMember && (
        <section className="panel">
          <p className="hero-eyebrow">Start a discussion</p>
          <h2 className="panel-title">Neues Thema eröffnen</h2>

          <form className="community-post-form" onSubmit={handleCreatePost}>
            <label htmlFor="post-title">Titel</label>

            <input
              id="post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Worüber möchtest du diskutieren?"
              minLength={3}
              maxLength={100}
              required
            />

            <label htmlFor="post-content">Dein Beitrag</label>

            <textarea
              id="post-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Gedanken, Fragen oder Theorien..."
              maxLength={5000}
              required
            />

            <label className="community-spoiler-checkbox">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(event) => setSpoiler(event.target.checked)}
              />
              Mein Thema enthält Spoiler
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={saving || deleting}
            >
              {saving ? "Veröffentlichen..." : "Thema veröffentlichen"}
            </button>
          </form>
        </section>
      )}

      {/* Diskussionsübersicht */}
      <section className="community-board">
        <div className="community-board-heading">
          <div>
            <p className="hero-eyebrow">Discussion Board</p>

            <h2 className="section-title">
              Die <span>Diskussionen.</span>
            </h2>
          </div>

          <span className="community-count">
            {posts.length} Themen
          </span>
        </div>

        {postError && (
          <p className="auth-message" role="alert">
            {postError}
          </p>
        )}

        {discussionsError && (
          <p className="auth-message" role="alert">
            {discussionsError}
          </p>
        )}

        {posts.length === 0 && !discussionsError && (
          <div className="panel">
            <p className="muted">
              Noch keine Diskussionen vorhanden.
            </p>
          </div>
        )}

        <div className="community-post-list">
          {posts.map((post) => {
            const ownPost = Boolean(
              user && post.author_id === user.id
            )

            // filter() wählt nur Antworten zum jeweiligen Thema aus.
            const postReplies = replies.filter(
              (reply) => reply.post_id === post.id
            )

            const hidePost =
              post.spoiler && !revealedPosts[post.id]

            return (
              <article className="community-post" key={post.id}>
                {editingId === post.id ? (
                  <form
                    className="community-post-form"
                    onSubmit={handleUpdatePost}
                  >
                    <label htmlFor={`edit-title-${post.id}`}>
                      Titel bearbeiten
                    </label>

                    <input
                      id={`edit-title-${post.id}`}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      minLength={3}
                      maxLength={100}
                      required
                    />

                    <label htmlFor={`edit-content-${post.id}`}>
                      Beitrag bearbeiten
                    </label>

                    <textarea
                      id={`edit-content-${post.id}`}
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      maxLength={5000}
                      required
                    />

                    <label className="community-spoiler-checkbox">
                      <input
                        type="checkbox"
                        checked={editSpoiler}
                        onChange={(event) => setEditSpoiler(event.target.checked)}
                      />
                      Mein Thema enthält Spoiler
                    </label>

                    <div className="community-post-actions">
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={saving || deleting}
                      >
                        Speichern
                      </button>

                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={saving || deleting}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="community-post-meta">
                      <span className="community-post-author">
                        {post.profiles?.username || "Manga-Fan"}
                      </span>

                      <time dateTime={post.created_at}>
                        {new Date(post.created_at).toLocaleString("de-DE")}
                      </time>
                    </div>

                    {post.spoiler && (
                      <span className="spoiler-badge">Spoiler</span>
                    )}

                    {hidePost ? (
                      <div className="community-spoiler-cover">
                        <p>
                          <strong>
                            Dieses Diskussionsthema enthält Spoiler.
                          </strong>
                        </p>

                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => setRevealedPosts((current) => ({
                            ...current,
                            [post.id]: true
                          }))}
                        >
                          Spoiler anzeigen
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3>{post.title}</h3>

                        <p className="community-post-content">
                          {post.content}
                        </p>

                        {post.spoiler && (
                          <button
                            className="community-spoiler-toggle"
                            type="button"
                            onClick={() => setRevealedPosts((current) => ({
                              ...current,
                              [post.id]: false
                            }))}
                          >
                            Spoiler wieder verbergen
                          </button>
                        )}
                      </>
                    )}

                    {post.updated_at !== post.created_at && (
                      <small className="muted"> Bearbeitet</small>
                    )}

                    {ownPost && (
                      <div className="community-post-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => startEditingPost(post)}
                          disabled={saving || deleting}
                        >
                          Bearbeiten
                        </button>

                        <button
                          className="community-delete-button"
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={saving || deleting}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Antworten zum Diskussionsthema */}
                <section className="community-replies">
                  <h4 className="community-replies-title">
                    Antworten <span>{postReplies.length}</span>
                  </h4>

                  {postReplies.length === 0 && (
                    <p className="muted">
                      Noch keine Antworten auf dieses Thema.
                    </p>
                  )}

                  <div className="community-reply-list">
                    {postReplies.map((reply) => {
                      const ownReply = Boolean(
                        user && reply.author_id === user.id
                      )

                      const hideReply =
                        reply.spoiler && !revealedReplies[reply.id]

                      return (
                        <div className="community-reply" key={reply.id}>
                          {editingReplyId === reply.id ? (
                            <form
                              className="community-post-form"
                              onSubmit={handleUpdateReply}
                            >
                              <label htmlFor={`edit-reply-${reply.id}`}>
                                Antwort bearbeiten
                              </label>

                              <textarea
                                id={`edit-reply-${reply.id}`}
                                value={editReplyContent}
                                onChange={(event) => setEditReplyContent(event.target.value)}
                                maxLength={2000}
                                required
                              />

                              <label className="community-spoiler-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editReplySpoiler}
                                  onChange={(event) => setEditReplySpoiler(event.target.checked)}
                                />
                                Diese Antwort enthält Spoiler
                              </label>

                              <div className="community-post-actions">
                                <button
                                  className="primary-button"
                                  type="submit"
                                  disabled={saving || deleting}
                                >
                                  Speichern
                                </button>

                                <button
                                  className="secondary-button"
                                  type="button"
                                  onClick={() => setEditingReplyId(null)}
                                  disabled={saving || deleting}
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="community-post-meta">
                                <span className="community-post-author">
                                  {reply.profiles?.username || "Manga-Fan"}
                                </span>

                                <time dateTime={reply.created_at}>
                                  {new Date(reply.created_at).toLocaleString("de-DE")}
                                </time>
                              </div>

                              {reply.spoiler && (
                                <span className="spoiler-badge">
                                  Spoiler
                                </span>
                              )}

                              {hideReply ? (
                                <div className="community-spoiler-cover">
                                  <p>Diese Antwort enthält Spoiler.</p>

                                  <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={() => setRevealedReplies((current) => ({
                                      ...current,
                                      [reply.id]: true
                                    }))}
                                  >
                                    Spoiler anzeigen
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="community-reply-content">
                                    {reply.content}
                                  </p>

                                  {reply.spoiler && (
                                    <button
                                      className="community-spoiler-toggle"
                                      type="button"
                                      onClick={() => setRevealedReplies((current) => ({
                                        ...current,
                                        [reply.id]: false
                                      }))}
                                    >
                                      Spoiler wieder verbergen
                                    </button>
                                  )}
                                </>
                              )}

                              {reply.updated_at !== reply.created_at && (
                                <small className="muted"> Bearbeitet</small>
                              )}

                              {ownReply && (
                                <div className="community-reply-actions">
                                  <button
                                    type="button"
                                    onClick={() => startEditingReply(reply)}
                                    disabled={saving || deleting}
                                  >
                                    Bearbeiten
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(reply.id)}
                                    disabled={saving || deleting}
                                  >
                                    Löschen
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Antwortformular für Mitglieder und Gründer */}
                  {isMember && (
                    <form
                      className="community-reply-form"
                      onSubmit={(event) => handleCreateReply(event, post.id)}
                    >
                      <label htmlFor={`reply-${post.id}`}>
                        Deine Antwort
                      </label>

                      <textarea
                        id={`reply-${post.id}`}
                        value={replyDrafts[post.id] || ""}
                        onChange={(event) => setReplyDrafts((current) => ({
                          ...current,
                          [post.id]: event.target.value
                        }))}
                        placeholder="Was denkst du über dieses Thema?"
                        maxLength={2000}
                        required
                      />

                      <label className="community-spoiler-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(replySpoilers[post.id])}
                          onChange={(event) => setReplySpoilers((current) => ({
                            ...current,
                            [post.id]: event.target.checked
                          }))}
                        />
                        Diese Antwort enthält Spoiler
                      </label>

                      <button
                        className="primary-button"
                        type="submit"
                        disabled={saving || deleting}
                      >
                        {saving ? "Speichern..." : "Antwort veröffentlichen"}
                      </button>
                    </form>
                  )}
                </section>
              </article>
            )
          })}
        </div>
      </section>

      {/* Ausschließlich der Gründer sieht die Löschfunktion. */}
      {isCreator && (
        <section
          className="panel"
          aria-labelledby="delete-community-title"
        >
          <p className="hero-eyebrow">Community verwalten</p>

          <h2 className="panel-title" id="delete-community-title">
            Community löschen
          </h2>

          <p className="muted">
            Beim Löschen werden alle Mitgliedschaften,
            Diskussionsthemen und Antworten dieser Community
            dauerhaft entfernt. Diese Aktion kann nicht
            rückgängig gemacht werden.
          </p>

          <button
            className="community-delete-button"
            type="button"
            onClick={handleDeleteCommunity}
            disabled={saving || deleting}
          >
            {deleting
              ? "Community wird gelöscht..."
              : "Community endgültig löschen"}
          </button>

          {deleteError && (
            <p className="auth-message" role="alert">
              {deleteError}
            </p>
          )}
        </section>
      )}
    </main>
  )
}
