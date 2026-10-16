import { useState } from "react"
import { Link } from "react-router-dom"
import { searchManga } from "../services/anilist"

// Manga-Suche / Manga search
export default function Search() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!query.trim()) return

    try {
      setLoading(true)
      setError("")
      const manga = await searchManga(query)
      setResults(manga)
    } catch {
      setError("Fehler beim Laden der Manga.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <p className="hero-eyebrow">Discover</p>

      <h1 className="section-title">
        Manga <span>finden.</span>
      </h1>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Titel eingeben..."
        />

        <button className="primary-button" type="submit">
          Suchen
        </button>
      </form>

      {loading && <p className="muted">Manga werden geladen...</p>}
      {error && <p>{error}</p>}

      <div className="manga-grid">
        {results.map((manga) => {
          const title = manga.title.english || manga.title.romaji

          return (
            <article className="manga-card" key={manga.id}>
              <img
                className="manga-card-image"
                src={manga.coverImage.large}
                alt={title}
              />

              <div className="manga-card-content">
                <span className="score-badge">
                  ★ {manga.averageScore || "N/A"}
                </span>

                <h2 className="manga-card-title">
                  {title}
                </h2>

                <Link className="nav-link" to={`/manga/${manga.id}`}>
                  Details →
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}