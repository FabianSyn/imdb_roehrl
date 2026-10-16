import { Link } from "react-router-dom"

// Startseite / Home page
export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="hero-eyebrow">Internet Manga Database</p>

          <h1 className="hero-title">
            Read.
            <br />
            Rate.
            <br />
            Discuss.
          </h1>

          <p className="hero-subtitle">
            Entdecke Manga, finde neue Reihen, bewerte deine Favoriten und diskutiere mit anderen Fans über Geschichten, Charaktere und Kapitel.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/search">
              Manga entdecken
            </Link>

            <Link className="secondary-button" to="/register">
              Community beitreten
            </Link>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "70px" }}>
        <p className="hero-eyebrow">Your Manga Archive</p>
        <h2 className="section-title">
          Deine Geschichten.
          <br />
          Deine <span>Bewertung.</span>
        </h2>

        <div className="manga-grid">
          <article className="panel">
            <h3>01 / Entdecken</h3>
            <p className="muted">
              Durchsuche tausende Manga und entdecke neue Geschichten.
            </p>
          </article>

          <article className="panel">
            <h3>02 / Bewerten</h3>
            <p className="muted">
              Vergib deine eigene Wertung von 1 bis 10.
            </p>
          </article>

          <article className="panel">
            <h3>03 / Diskutieren</h3>
            <p className="muted">
              Teile deine Meinung mit anderen Manga-Fans.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}