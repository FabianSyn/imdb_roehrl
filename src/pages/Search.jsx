
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { searchManga } from "../services/anilist"

// Manga-Suche und Sortierung / Manga search and sorting
export default function Search() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [sort, setSort] = useState("default")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)

  // Manga sortieren / Sort manga
  const sortedResults = useMemo(() => {
    const manga = [...results]
    const title = (item) => item.title.english || item.title.romaji || ""
    const score = (item) => item.averageScore ?? -1

    switch (sort) {
      case "az":
        return manga.sort((a, b) => title(a).localeCompare(title(b)))
      case "za":
        return manga.sort((a, b) => title(b).localeCompare(title(a)))
      case "best":
        return manga.sort((a, b) => score(b) - score(a))
      case "worst":
        return manga.sort((a, b) => {
          if (a.averageScore == null) return 1
          if (b.averageScore == null) return -1
          return score(a) - score(b)
        })
      default:
        return manga
    }
  }, [results, sort])

  // Manga suchen / Search manga
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!query.trim()) return

    try {
      setLoading(true)
      setError("")
      setSearched(true)
      setResults([])
      setSort("default")
      const manga = await searchManga(query.trim())
      setResults(manga)
    } catch (error) {
      setError(`Manga konnten nicht geladen werden: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      {/* Seitenkopf / Page header */}
      <section className="search-heading">
        <div>
          <p className="hero-eyebrow">Manga Archive</p>
          <h1 className="section-title">Manga <span>entdecken.</span></h1>
          <p className="muted">Finde deine nächsten Lieblings-Manga, entdecke neue Geschichten und vergleiche Bewertungen.</p>
        </div>
        <span className="search-sfx">FIND!</span>
      </section>

      {/* Suche / Search */}
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nach einem Manga suchen..."
          aria-label="Manga-Titel"
          required
        />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Suche..." : "Suchen"}
        </button>
      </form>

      {/* Sortierung / Sorting */}
      {results.length > 0 && (
        <div className="search-toolbar">
          <p><strong>{results.length}</strong> Manga gefunden</p>
          <label htmlFor="manga-sort">Sortieren nach</label>
          <select id="manga-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="default">Unsortiert-Reihenfolge</option>
            <option value="az">Alphabetisch A–Z</option>
            <option value="za">Alphabetisch Z–A</option>
            <option value="best">Beste Bewertung</option>
            <option value="worst">Niedrigste Bewertung</option>
          </select>
        </div>
      )}

      {/* Ergebnisse / Results */}
      {loading && <p className="muted" role="status">Manga werden geladen...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && searched && results.length === 0 && (
        <p className="muted">Keine Manga gefunden. Versuche einen anderen Titel.</p>
      )}

      <div className="manga-grid">
        {sortedResults.map((manga) => {
          const title = manga.title.english || manga.title.romaji
          return (
            <article className="manga-card" key={manga.id}>
              <Link to={`/manga/${manga.id}`}>
                <img className="manga-card-image" src={manga.coverImage.large} alt={title} loading="lazy" />
                <div className="manga-card-content">
                  <span className="score-badge">
                    ★ {manga.averageScore != null ? `${(manga.averageScore / 10).toFixed(1)}/10` : "N/A"}
                  </span>
                  <h2 className="manga-card-title">{title}</h2>
                  <span className="hot-details">Details →</span>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}
