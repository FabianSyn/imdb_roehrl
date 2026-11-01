
/**
 * Zeigt eine Community mit Mitgliedschaft, Diskussionsthemen und Antworten.
 * useAuth() verwaltet den Benutzerstatus und useCommunityDiscussions()
 * übernimmt das Laden der Themen und Antworten.
 */

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { getCommunity, joinCommunity, leaveCommunity } from "../services/communities"
import { createCommunityPost, updateCommunityPost, deleteCommunityPost } from "../services/communityPosts"
import { createCommunityReply, updateCommunityReply, deleteCommunityReply } from "../services/communityReplies"
import useCommunityDiscussions from "../hooks/useCommunityDiscussions"

/**
 * Verwaltet die Community-Ansicht mit ihren Formularen und Mitgliedschaften.
 * useParams() liest die Community-ID; die eigenen Hooks liefern
 * Benutzer, Diskussionsthemen und Antworten.
 */
export default function CommunityDetails() {
  const { id } = useParams()

  const { user, loading: authLoading } = useAuth()

  const {
    posts,
    replies,
    loading: discussionsLoading,
    error: discussionsError,
    refreshDiscussions
  } = useCommunityDiscussions(id)

  // Speichert Community-Informationen und ihre Ladezustände.
  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [postError, setPostError] = useState("")

  // Eingaben für neue Diskussionsthemen und deren Bearbeitung.
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [spoiler, setSpoiler] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editSpoiler, setEditSpoiler] = useState(false)

  // Eingaben und Bearbeitungsstatus der Antworten.
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replySpoilers, setReplySpoilers] = useState({})
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editReplyContent, setEditReplyContent] = useState("")
  const [editReplySpoiler, setEditReplySpoiler] = useState(false)

  // Speichert, welche Spoiler bereits aufgedeckt wurden.
  const [revealedPosts, setRevealedPosts] = useState({})
  const [revealedReplies, setRevealedReplies] = useState({})

  /**
   * Lädt die ausgewählte Community anhand ihrer ID.
   * Bei einem Seitenwechsel wird die neue Community geladen.
   * active verhindert State-Updates nach dem Verlassen der Komponente.
   */
  useEffect(() => {
    let active = true

    const loadCommunity = async () => {
      setLoading(true)
      setError("")
      setCommunity(null)

      try {
        const communityData = await getCommunity(id)

        if (active) {
          setCommunity(communityData)
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

    loadCommunity()

    return () => {
      active = false
    }
  }, [id])

  // Ermittelt Mitgliedschaft, Gründerstatus und Mitgliederzahl.
  // some() prüft, ob die Benutzer-ID in der Mitgliederliste vorkommt.
  const isMember =
    community?.community_members?.some(
      (member) => member.user_id === user?.id
    ) || false

  const isCreator = Boolean(
    user && community?.created_by === user.id
  )

  const memberCount = community?.community_members?.length || 0

  /**
   * Ermöglicht den Bei- oder Austritt über die Supabase-Services.
   * Danach wird die Community neu geladen, damit der Status aktuell ist.
   */
  const handleMembership = async () => {
    if (!user || !community || saving || isCreator) return

    setSaving(true)
    setError("")

    try {
      if (isMember) {
        await leaveCommunity(id, user.id)
      } else {
        await joinCommunity(id, user.id)
      }

      setCommunity(await getCommunity(id))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Veröffentlicht ein neues Diskussionsthema mit optionalem Spoiler.
   * refreshDiscussions() fordert anschließend aktualisierte Daten an.
   */
  const handleCreatePost = async (event) => {
    event.preventDefault()
    if (!user || !isMember || saving) return

    setSaving(true)
    setPostError("")

    try {
      await createCommunityPost(id, user.id, title, content, spoiler)
      refreshDiscussions()

      setTitle("")
      setContent("")
      setSpoiler(false)
    } catch (err) {
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Übernimmt die Werte eines vorhandenen Beitrags in das Formular.
   */
  const startEditingPost = (post) => {
    setEditingId(post.id)
    setEditTitle(post.title)
    setEditContent(post.content)
    setEditSpoiler(post.spoiler)
    setPostError("")
  }

  /**
   * Aktualisiert einen Beitrag über den Supabase-Service.
   * Danach werden die Diskussionen erneut geladen.
   */
  const handleUpdatePost = async (event) => {
    event.preventDefault()
    if (!user || saving || editingId === null) return

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
      setEditingId(null)

      setRevealedPosts((current) => ({
        ...current,
        [editingId]: false
      }))
    } catch (err) {
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht ein Thema nach einer Bestätigung mit window.confirm().
   * Anschließend werden Beiträge und Antworten neu geladen.
   */
  const handleDeletePost = async (postId) => {
    if (
      !user ||
      saving ||
      !window.confirm("Dieses Thema und alle Antworten wirklich löschen?")
    ) return

    setSaving(true)
    setPostError("")

    try {
      await deleteCommunityPost(postId, user.id)
      refreshDiscussions()

      if (editingId === postId) {
        setEditingId(null)
      }
    } catch (err) {
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Veröffentlicht eine neue Antwort auf ein Diskussionsthema.
   * trim() entfernt äußere Leerzeichen; leere Antworten werden verhindert.
   */
  const handleCreateReply = async (event, postId) => {
    event.preventDefault()

    const text = replyDrafts[postId]?.trim()
    if (!user || !isMember || saving || !text) return

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
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Übernimmt die Antwortdaten in das Bearbeitungsformular.
   */
  const startEditingReply = (reply) => {
    setEditingReplyId(reply.id)
    setEditReplyContent(reply.content)
    setEditReplySpoiler(reply.spoiler)
    setPostError("")
  }

  /**
   * Aktualisiert eine Antwort und lädt die Diskussionen erneut.
   * Der Bearbeitungsmodus wird danach geschlossen.
   */
  const handleUpdateReply = async (event) => {
    event.preventDefault()
    if (!user || saving || editingReplyId === null) return

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
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Löscht eine Antwort nach Bestätigung und aktualisiert die Liste.
   */
  const handleDeleteReply = async (replyId) => {
    if (
      !user ||
      saving ||
      !window.confirm("Diese Antwort wirklich löschen?")
    ) return

    setSaving(true)
    setPostError("")

    try {
      await deleteCommunityReply(replyId, user.id)
      refreshDiscussions()

      if (editingReplyId === replyId) {
        setEditingReplyId(null)
      }
    } catch (err) {
      setPostError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading || discussionsLoading) {
    return (
      <main className="page">
        <p className="muted">Community wird geladen...</p>
      </main>
    )
  }

  if (!community) {
    return (
      <main className="page">
        <h1>Community nicht gefunden</h1>
        {error && <p role="alert">{error}</p>}
        <Link className="primary-button" to="/communities">
          Zur Übersicht
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <Link className="community-back" to="/communities">
        ← Alle Communities
      </Link>

      {/* Angaben zur Community und ihrem Gründer */}
      <section className="community-detail-hero">
        <div className="community-detail-symbol">
          {community.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="hero-eyebrow">Community Headquarters</p>
          <h1 className="community-detail-title">{community.name}</h1>
          <p className="community-detail-description">
            {community.description}
          </p>
          <p className="community-detail-meta">
            {memberCount} Mitglieder · Gegründet am{" "}
            {new Date(community.created_at).toLocaleDateString("de-DE")}
          </p>
          {isCreator && (
            <span className="community-owner-badge">
              Du bist der Ersteller
            </span>
          )}
        </div>
      </section>

      {/* Beitreten bzw. Verlassen abhängig von Login und Mitgliedschaft */}
      <section className="panel community-membership-panel">
        <div>
          <p className="hero-eyebrow">Join the discussion</p>
          <h2 className="panel-title">
            {isMember ? "Du bist dabei!" : "Werde Mitglied!"}
          </h2>
          <p className="muted">
            {isMember
              ? "Du kannst Themen veröffentlichen und antworten."
              : "Alle dürfen mitlesen. Zum Schreiben musst du Mitglied sein."}
          </p>
        </div>

        {!user ? (
          <Link className="primary-button" to="/login">
            Zum Beitreten anmelden
          </Link>
        ) : (
          <button
            className={isMember ? "secondary-button" : "primary-button"}
            type="button"
            onClick={handleMembership}
            disabled={saving || isCreator}
          >
            {saving
              ? "Speichern..."
              : isCreator
                ? "Gründer"
                : isMember
                  ? "Community verlassen"
                  : "Community beitreten"}
          </button>
        )}
        {error && <p role="alert">{error}</p>}
      </section>

      {/* Nur Mitglieder dürfen Diskussionsthemen erstellen. */}
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
              disabled={saving}
            >
              {saving ? "Veröffentlichen..." : "Thema veröffentlichen"}
            </button>
          </form>
        </section>
      )}

      {/* Für jedes Diskussionsthema wird ein eigener Beitrag angezeigt. */}
      <section className="community-board">
        <div className="community-board-heading">
          <div>
            <p className="hero-eyebrow">Discussion Board</p>
            <h2 className="section-title">
              Die <span>Diskussionen.</span>
            </h2>
          </div>
          <span className="community-count">{posts.length} Themen</span>
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
            const ownPost = Boolean(user && post.author_id === user.id)

            // Wählt die Antworten aus, die zu diesem Beitrag gehören.
            const postReplies = replies.filter(
              (reply) => reply.post_id === post.id
            )

            const hidePost = post.spoiler && !revealedPosts[post.id]

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
                        disabled={saving}
                      >
                        Speichern
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
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
                          disabled={saving}
                        >
                          Bearbeiten
                        </button>
                        <button
                          className="community-delete-button"
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={saving}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Antworten zum aktuellen Thema */}
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
                                  disabled={saving}
                                >
                                  Speichern
                                </button>
                                <button
                                  className="secondary-button"
                                  type="button"
                                  onClick={() => setEditingReplyId(null)}
                                  disabled={saving}
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
                                <small className="muted">
                                  {" "}Bearbeitet
                                </small>
                              )}

                              {ownReply && (
                                <div className="community-reply-actions">
                                  <button
                                    type="button"
                                    onClick={() => startEditingReply(reply)}
                                    disabled={saving}
                                  >
                                    Bearbeiten
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(reply.id)}
                                    disabled={saving}
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

                  {/* Antwortformular für Community-Mitglieder */}
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
                        disabled={saving}
                      >
                        {saving
                          ? "Speichern..."
                          : "Antwort veröffentlichen"}
                      </button>
                    </form>
                  )}
                </section>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
