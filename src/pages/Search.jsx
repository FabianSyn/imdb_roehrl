
/**
 * Diese Seite stellt das Manga-Archiv mit Suchfunktion, Filtern,
 * Sortierung und Seitennavigation bereit.
 */

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { browseManga } from "../services/anilist"

// Enthält die auswählbaren Genres für den Manga-Filter.
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"]

// Ordnet den englischen AniList-Statuswerten deutsche Bezeichnungen zu.
const STATUS_LABELS = {
  FINISHED: "Abgeschlossen",
  RELEASING: "Laufend",
  NOT_YET_RELEASED: "Angekündigt",
  HIATUS: "Pausiert",
  CANCELLED: "Abgebrochen"
}

/**
 * Verwaltet die Manga-Suche und zeigt die Ergebnisse an.
 * useState speichert Suchbegriff, Filter, Sortierung, Seitenzahl und Ergebnisse.
 * useEffect lädt bei Änderungen dieser Werte passende Manga über browseManga().
 */
export default function Search() {
  // Trennt den aktuellen Eingabetext vom tatsächlich verwendeten Suchbegriff.
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")

  // Speichert die ausgewählten Filter und die aktuelle Ergebnisseite.
  const [genre, setGenre] = useState("")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("POPULARITY_DESC")
  const [page, setPage] = useState(1)

  // Speichert Suchergebnisse, weitere verfügbare Seiten und Ladezustände.
  const [results, setResults] = useState([])
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  /**
   * Lädt Manga über den AniList-Service browseManga().
   * Der Effekt wird beim Öffnen sowie bei Änderungen von Suche, Filtern,
   * Sortierung oder Seitenzahl ausgeführt. active verhindert verspätete
   * State-Updates, falls sich die Anfrage zwischenzeitlich geändert hat.
   */
  useEffect(() => {
    let active = true

    const loadManga = async () => {
      setLoading(true)
      setError("")

      try {
        const data = await browseManga({ search, genre, status, sort, page })
        if (!active) return

        setResults(data.manga)
        setHasNextPage(data.hasNextPage)
      } catch (err) {
        if (!active) return

        setResults([])
        setHasNextPage(false)
        setError(err.message || "Manga konnten nicht geladen werden.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadManga()
    return () => { active = false }
  }, [search, genre, status, sort, page])

  /**
   * Startet eine neue Suche mit dem eingegebenen Titel.
   * preventDefault() verhindert das Neuladen der Seite, trim() entfernt
   * äußere Leerzeichen und setPage(1) beginnt bei der ersten Ergebnisseite.
   */
  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(input.trim())
  }

  /**
   * Setzt Suchbegriff, Filter, Sortierung und Seitenzahl zurück.
   * Durch die State-Änderungen wird useEffect erneut ausgeführt
   * und das Manga-Archiv mit den Standardwerten geladen.
   */
  const handleReset = () => {
    setInput("")
    setSearch("")
    setGenre("")
    setStatus("")
    setSort("POPULARITY_DESC")
    setPage(1)
  }

  return (
    <main className="page">
      {/* Kopfbereich des Manga-Archivs */}
      <section className="search-heading">
        <div>
          <p className="hero-eyebrow">The Manga Archive</p>
          <h1 className="section-title">Manga <span>entdecken.</span></h1>
          <p className="muted">Suche Manga, entdecke neue Reihen und filtere das Archiv nach deinen Interessen.</p>
        </div>
        <span className="search-sfx">FIND!</span>
      </section>

      {/* Suchformular */}
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Manga-Titel eingeben..."
          aria-label="Manga-Titel"
        />
        <button className="primary-button" type="submit">Suchen</button>
      </form>

      {/* Filter und Sortierung mit Zurücksetzen der Seitenzahl */}
      <section className="archive-filters" aria-label="Manga-Filter">
        <div className="archive-filter">
          <label htmlFor="genre">Genre</label>
          <select id="genre" value={genre} onChange={(event) => { setGenre(event.target.value); setPage(1) }}>
            <option value="">Alle Genres</option>
            {GENRES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="archive-filter">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
            <option value="">Alle Status</option>
            <option value="RELEASING">Laufend</option>
            <option value="FINISHED">Abgeschlossen</option>
            <option value="NOT_YET_RELEASED">Angekündigt</option>
            <option value="HIATUS">Pausiert</option>
          </select>
        </div>

        <div className="archive-filter">
          <label htmlFor="sort">Sortierung</label>
          <select id="sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            <option value="POPULARITY_DESC">Beliebteste</option>
            <option value="SCORE_DESC">Beste Bewertung</option>
            <option value="TITLE_ROMAJI">Titel A–Z</option>
            <option value="TITLE_ROMAJI_DESC">Titel Z–A</option>
            <option value="START_DATE_DESC">Neueste</option>
          </select>
        </div>

        <button className="secondary-button archive-reset" type="button" onClick={handleReset}>Zurücksetzen</button>
      </section>

      {/* Ergebnisübersicht mit Lade- und Fehlermeldungen */}
      <div className="archive-results-heading">
        <h2 className="panel-title">Manga-Archiv</h2>
        <span className="archive-page-label">Seite {page}</span>
      </div>

      {loading && <p className="muted" role="status">Manga werden geladen...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="muted">Keine Manga gefunden. Probiere andere Filter.</p>
      )}

      {/* map() erstellt für jeden gefundenen Manga eine eigene Karte. */}
      {!loading && !error && (
        <div className="manga-grid">
          {results.map((manga) => {
            const title = manga.title.english || manga.title.romaji

            return (
              <article className="manga-card" key={manga.id}>
                <Link to={`/manga/${manga.id}`}>
                  <img className="manga-card-image" src={manga.coverImage.large} alt={title} loading="lazy" />
                  <div className="manga-card-content">
                    <span className="score-badge">
                      ★ {manga.averageScore != null ? `${(manga.averageScore / 10).toFixed(1)}/10` : "N/A"}
                    </span>
                    <h3 className="manga-card-title">{title}</h3>
                    <p className="archive-manga-status">
                      {STATUS_LABELS[manga.status] || "Status unbekannt"}
                    </p>
                    <span className="hot-details">Details →</span>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      )}

      {/* Seitennavigation für weitere Ergebnisse von AniList */}
      {!loading && !error && (page > 1 || hasNextPage) && (
        <nav className="archive-pagination" aria-label="Archiv-Seiten">
          <button className="secondary-button" type="button" disabled={page === 1} onClick={() => { setPage((value) => value - 1); window.scrollTo(0, 0) }}>
            ← Zurück
          </button>
          <strong>Seite {page}</strong>
          <button className="primary-button" type="button" disabled={!hasNextPage} onClick={() => { setPage((value) => value + 1); window.scrollTo(0, 0) }}>
            Weiter →
          </button>
        </nav>
      )}
    </main>
  )
}
