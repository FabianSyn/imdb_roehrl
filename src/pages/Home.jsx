
/**
 * Diese Datei erstellt die Startseite mit beliebten Manga,
 * einer Community-Vorschau und einer Übersicht der Plattformfunktionen.
 * Die Daten werden über eigene React-Hooks geladen.
 */

import { Link } from "react-router-dom"
import useHotManga from "../hooks/useHotManga"
import useCommunities from "../hooks/useCommunities"

/**
 * Erstellt die Startseite und zeigt Manga- und Community-Daten an.
 * useHotManga() lädt beliebte Manga von AniList.
 * useCommunities() lädt die Communities aus Supabase.
 * Beide Hooks verwalten ihre Lade- und Fehlerzustände selbst.
 */
export default function Home() {
  // Lädt beliebte Manga über den eigenen Hook.
  const {
    hotManga,
    loading,
    error
  } = useHotManga()

  // Lädt Communities für die Vorschau auf der Startseite.
  const {
    communities: allCommunities,
    loading: communitiesLoading,
    error: communityError
  } = useCommunities()

  /**
   * Erstellt einen Ausschnitt aus den ersten drei Communities.
   * slice(0, 3) verändert das ursprüngliche Array nicht.
   */
  const communities = allCommunities.slice(0, 3)

  return (
    <main className="page">
      {/* Zeigt die geladenen Manga mithilfe von map() als einzelne Karten an. */}
      <section className="hot-section hot-section-top">
        <div className="hot-heading">
          <div>
            <p className="hero-eyebrow">Trending Now</p>
            <h1 className="section-title">
              Hot <span>Manga!</span>
            </h1>
            <p className="muted">
              Entdecke eine wechselnde Auswahl beliebter Manga.
            </p>
          </div>

          <span className="hot-sfx">HOT!!</span>
        </div>

        {loading && (
          <p className="muted">Hot Manga werden geladen...</p>
        )}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <div className="manga-grid home-hot-grid">
            {hotManga.map((manga) => {
              const title =
                manga.title.english || manga.title.romaji

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
                        loading="lazy"
                      />
                      <span className="hot-label">HOT</span>
                    </div>

                    <div className="manga-card-content">
                      <span className="score-badge">
                        ★{" "}
                        {manga.averageScore != null
                          ? `${(manga.averageScore / 10).toFixed(1)}/10`
                          : "N/A"}
                      </span>

                      <h2 className="manga-card-title">{title}</h2>

                      <div className="hot-genres">
                        {(manga.genres || [])
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

      {/* Stellt die Plattform vor und verlinkt ihre wichtigsten Bereiche. */}
      <section className="home-intro">
        <div className="home-intro-content">
          <p className="hero-eyebrow">
            Internet Manga Database
          </p>

          <h2 className="home-intro-title">
            Read.<br />
            Rate.<br />
            Discuss.
          </h2>

          <p className="home-intro-text">
            Entdecke neue Manga, bewerte deine Favoriten
            und finde andere Fans in unseren Communities.
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
              to="/communities"
            >
              Communities entdecken
            </Link>
          </div>
        </div>

        <div
          className="home-intro-art"
          aria-hidden="true"
        >
          <span>漫画</span>
        </div>
      </section>

      {/* Zeigt eine Vorschau der ersten drei Communities über map() an. */}
      <section className="home-communities">
        <div className="home-communities-heading">
          <div>
            <p className="hero-eyebrow">
              Find your people
            </p>

            <h2 className="section-title">
              Manga <span>Communities!</span>
            </h2>

            <p className="muted">
              Entdecke Gruppen von Manga-Fans.
              Du kannst alle Communities ansehen,
              auch ohne Anmeldung.
            </p>
          </div>

          <Link
            className="secondary-button"
            to="/communities"
          >
            Alle Communities →
          </Link>
        </div>

        {communitiesLoading && (
          <p className="muted">
            Communities werden geladen...
          </p>
        )}

        {communityError && (
          <p role="alert">{communityError}</p>
        )}

        {!communitiesLoading &&
          !communityError &&
          communities.length === 0 && (
            <div className="panel">
              <h3>
                Hier entstehen neue Communities!
              </h3>

              <p className="muted">
                Sobald Benutzer Communities erstellen,
                werden sie hier vorgestellt.
              </p>

              <Link
                className="primary-button"
                to="/communities"
              >
                Communities ansehen
              </Link>
            </div>
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
                <span className="community-kicker">
                  FAN COMMUNITY
                </span>

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

      {/* Statische Übersicht der drei wichtigsten Plattformfunktionen. */}
      <section className="home-features">
        <p className="hero-eyebrow">
          Your Manga Archive
        </p>

        <h2 className="section-title">
          Deine Geschichten.<br />
          Deine <span>Bewertung.</span>
        </h2>

        <div className="manga-grid">
          <article className="panel home-feature">
            <span className="feature-number">01</span>
            <h3>Entdecken</h3>
            <p className="muted">
              Durchsuche tausende Manga und finde neue Reihen.
            </p>
          </article>

          <article className="panel home-feature">
            <span className="feature-number">02</span>
            <h3>Bewerten</h3>
            <p className="muted">
              Vergib deine persönliche Wertung von 1 bis 10.
            </p>
          </article>

          <article className="panel home-feature">
            <span className="feature-number">03</span>
            <h3>Diskutieren</h3>
            <p className="muted">
              Finde Communities und tausche dich
              mit anderen Manga-Fans aus.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
