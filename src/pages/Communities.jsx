
/**
 * Diese Seite zeigt alle Communities an und ermöglicht angemeldeten
 * Benutzern, eigene Communities zu erstellen.
 * Die Daten und der Anmeldestatus werden über eigene Hooks geladen.
 */

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createCommunity } from "../services/communities"
import useAuth from "../hooks/useAuth"
import useCommunities from "../hooks/useCommunities"

/**
 * Verwaltet die Community-Übersicht und das Erstellungsformular.
 * useCommunities() lädt die Community-Liste, useAuth() liefert den
 * angemeldeten Benutzer und useState() verwaltet die Formulareingaben.
 */
export default function Communities() {
  const navigate = useNavigate()

  // Lädt Communities sowie den aktuellen Anmeldestatus über eigene Hooks.
  const {
    communities,
    loading,
    error: communitiesError
  } = useCommunities()

  const { user, loading: authLoading } = useAuth()

  // Speichert die Eingaben und den Status des Erstellungsformulars.
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  /**
   * Erstellt eine neue Community über createCommunity() in Supabase.
   * preventDefault() verhindert das Neuladen der Seite.
   * Nach erfolgreicher Erstellung leitet navigate() zur Community weiter.
   */
  const handleCreate = async (event) => {
    event.preventDefault()
    if (!user || saving) return

    setSaving(true)
    setError("")

    try {
      const community = await createCommunity(name, description, user.id)
      navigate(`/communities/${community.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <main className="page">
      <section className="community-heading">
        <div>
          <p className="hero-eyebrow">Manga Community</p>
          <h1 className="section-title">Find your <span>people!</span></h1>
          <p className="muted">
            Finde andere Manga-Fans, entdecke Communities oder gründe deine eigene Gruppe.
          </p>
        </div>
        <span className="community-sfx">JOIN!</span>
      </section>

      <section className="panel">
        <p className="hero-eyebrow">Create your world</p>
        <h2 className="panel-title">Neue Community erstellen</h2>

        {authLoading ? (
          <p className="muted">Anmeldestatus wird überprüft...</p>
        ) : !user ? (
          <p>
            Du musst angemeldet sein, um eine Community zu erstellen.{" "}
            <Link className="community-text-link" to="/login">
              Jetzt anmelden
            </Link>
          </p>
        ) : (
          <form className="community-create-form" onSubmit={handleCreate}>
            <div>
              <label htmlFor="community-name">Community-Name</label>
              <input
                id="community-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={3}
                maxLength={60}
                placeholder="z. B. Dark Fantasy Fans"
                required
              />
            </div>

            <div>
              <label htmlFor="community-description">Beschreibung</label>
              <textarea
                id="community-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                placeholder="Worum geht es in deiner Community?"
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Wird erstellt..." : "Community erstellen"}
            </button>
          </form>
        )}

        {error && <p role="alert">{error}</p>}
      </section>

      <section className="community-list-section">
        <div className="community-list-heading">
          <h2 className="panel-title">Alle Communities</h2>
          <span className="community-count">
            {communities.length} Gruppen
          </span>
        </div>

        {loading && (
          <p className="muted">Communities werden geladen...</p>
        )}

        {communitiesError && (
          <p role="alert">{communitiesError}</p>
        )}

        {!loading && communities.length === 0 && !communitiesError && (
          <p className="muted">
            Noch keine Communities vorhanden. Erstelle die erste!
          </p>
        )}

        <div className="community-grid">
          {communities.map((community, index) => (
            <Link
              className="community-card"
              to={`/communities/${community.id}`}
              key={community.id}
            >
              <div className="community-card-art">
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>
                  {community.name.charAt(0).toUpperCase()}
                </strong>
              </div>

              <div className="community-card-body">
                <span className="community-kicker">FAN COMMUNITY</span>
                <h3>{community.name}</h3>
                <p>{community.description}</p>

                <div className="community-card-footer">
                  <span>
                    {community.community_members?.length || 0} Mitglieder
                  </span>
                  <strong>ANSEHEN →</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
