
/**
 * Diese Seite zeigt alle Communities an und ermöglicht angemeldeten Benutzern,
 * eigene Communities zu erstellen.
 */

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import { getCommunities, createCommunity } from "../services/communities"

/**
 * Verwaltet die Community-Übersicht und das Erstellungsformular.
 * useState speichert Communities, Benutzerdaten, Formulareingaben und Statuswerte.
 * useEffect lädt die Daten beim Öffnen, useNavigate ermöglicht die Weiterleitung.
 */
export default function Communities() {
  const navigate = useNavigate()
  const [communities, setCommunities] = useState([])
  const [user, setUser] = useState(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  /**
   * Lädt Communities und den aktuellen Benutzer parallel mit Promise.all().
    * Lädt Communities und Benutzerdaten parallel.
    * Promise.all() wartet, bis beide asynchronen Anfragen abgeschlossen sind, 
    * und gibt ihre Ergebnisse in der ursprünglichen Reihenfolge zurück.
   * getCommunities() liest die Daten aus Supabase und getUser() prüft die Anmeldung.
   * Die Variable active verhindert State-Updates nach dem Entfernen der Komponente.
   */
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [items, auth] = await Promise.all([
          getCommunities(),
          supabase.auth.getUser()
        ])
        if (!active) return
        setCommunities(items)
        setUser(auth.data.user)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  /**
   * Erstellt eine neue Community über createCommunity() in Supabase.
   * preventDefault() verhindert das Neuladen der Seite beim Absenden.
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
          <p className="muted">Finde andere Manga-Fans, entdecke Communities oder gründe deine eigene Gruppe.</p>
        </div>
        <span className="community-sfx">JOIN!</span>
      </section>

      <section className="panel">
        <p className="hero-eyebrow">Create your world</p>
        <h2 className="panel-title">Neue Community erstellen</h2>
        {!user ? (
          <p>Du musst angemeldet sein, um eine Community zu erstellen. <Link className="community-text-link" to="/login">Jetzt anmelden</Link></p>
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
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Wird erstellt..." : "Community erstellen"}
            </button>
          </form>
        )}
        {error && <p role="alert">{error}</p>}
      </section>

      <section className="community-list-section">
        <div className="community-list-heading">
          <h2 className="panel-title">Alle Communities</h2>
          <span className="community-count">{communities.length} Gruppen</span>
        </div>
        {loading && <p className="muted">Communities werden geladen...</p>}
        {!loading && communities.length === 0 && !error && (
          <p className="muted">Noch keine Communities vorhanden. Erstelle die erste!</p>
        )}
        <div className="community-grid">
          {communities.map((community, index) => (
            <Link className="community-card" to={`/communities/${community.id}`} key={community.id}>
              <div className="community-card-art">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{community.name.charAt(0).toUpperCase()}</strong>
              </div>
              <div className="community-card-body">
                <span className="community-kicker">FAN COMMUNITY</span>
                <h3>{community.name}</h3>
                <p>{community.description}</p>
                <div className="community-card-footer">
                  <span>{community.community_members?.length || 0} Mitglieder</span>
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
