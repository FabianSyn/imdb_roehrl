import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getHotManga } from "../services/anilist"

// Startseite / Home page
export default function Home() {
  const [hotManga, setHotManga] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadHotManga = async () => {
      try {
        setLoading(true)
        setError("")
        const manga = await getHotManga()
        setHotManga(manga)
      } catch {
        setError("Hot Manga konnten nicht geladen werden.")
      } finally {
        setLoading(false)
      }
    }

    loadHotManga()
  }, [])

  return (
    <main className="page">
      {/* Hot Manga zuerst / Hot manga first */}
      <section className="hot-section hot-section-top">
        <div className="hot-heading">
          <div>
            <p className="hero-eyebrow">
              Trending Now
            </p>

            <h1 className="section-title">
              Hot <span>Manga!</span>
            </h1>

            <p className="muted">
              Entdecke eine wechselnde Auswahl beliebter Manga.
            </p>
          </div>

          <span className="hot-sfx">
            HOT!!
          </span>
        </div>

        {loading && (
          <p className="muted">
            Hot Manga werden geladen...
          </p>
        )}

        {error && (
          <p>
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="manga-grid home-hot-grid">
            {hotManga.map((manga) => {
              const title =
                manga.title.english ||
                manga.title.romaji

              return (
                <article
                  className="manga-card hot-card"
                  key={manga.id}
                >
                  <Link to={`/manga/${manga.id}`}>
                    <div className="hot-image-wrapper">
                      <img
                        className="manga-card-image"
                        src={manga.coverImage.large}
                        alt={title}
                      />

                      <span className="hot-label">
                        HOT
                      </span>
                    </div>

                    <div className="manga-card-content">
                      <span className="score-badge">
                        ★ {manga.averageScore || "N/A"}
                      </span>

                      <h2 className="manga-card-title">
                        {title}
                      </h2>

                      <div className="hot-genres">
                        {manga.genres
                          .slice(0, 2)
                          .map((genre) => (
                            <span
                              className="genre-tag"
                              key={genre}
                            >
                              {genre}
                            </span>
                          ))}
                      </div>

                      <span className="hot-details">
                        Details →
                      </span>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Kompakter Hero / Compact hero */}
      <section className="home-intro">
        <div className="home-intro-content">
          <p className="hero-eyebrow">
            Internet Manga Database
          </p>

          <h2 className="home-intro-title">
            Read.
            <br />
            Rate.
            <br />
            Discuss.
          </h2>

          <p className="home-intro-text">
            Finde neue Manga, bewerte deine Favoriten und diskutiere mit anderen Fans über Geschichten, Charaktere und Kapitel.
          </p>

          <div className="hero-actions">
            <Link
              className="primary-button"
              to="/search"
            >
              Manga entdecken
            </Link>

            <Link
              className="secondary-button"
              to="/register"
            >
              Community beitreten
            </Link>
          </div>
        </div>

        <div className="home-intro-art">
          <span>
            漫画
          </span>
        </div>
      </section>

      {/* Funktionen / Features */}
      <section className="home-features">
        <p className="hero-eyebrow">
          Your Manga Archive
        </p>

        <h2 className="section-title">
          Deine Geschichten.
          <br />
          Deine <span>Bewertung.</span>
        </h2>

        <div className="manga-grid">
          <article className="panel home-feature">
            <span className="feature-number">
              01
            </span>

            <h3>
              Entdecken
            </h3>

            <p className="muted">
              Durchsuche tausende Manga und finde neue Reihen.
            </p>
          </article>

          <article className="panel home-feature">
            <span className="feature-number">
              02
            </span>

            <h3>
              Bewerten
            </h3>

            <p className="muted">
              Vergib deine persönliche Wertung von 1 bis 10.
            </p>
          </article>

          <article className="panel home-feature">
            <span className="feature-number">
              03
            </span>

            <h3>
              Diskutieren
            </h3>

            <p className="muted">
              Teile deine Meinung mit anderen Manga-Fans.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}