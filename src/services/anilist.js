
/**
 * Dieser Service stellt die Verbindung zur AniList-API her und
 * liefert Manga-Daten für Suche, Detailseiten, Profile und Startseite.
 */

// Speichert die Adresse der GraphQL-Schnittstelle von AniList.
const API_URL = "https://graphql.anilist.co"

/**
 * Sendet eine GraphQL-Anfrage an die AniList-API.
 * fetch() überträgt die Abfrage per POST, JSON.stringify() wandelt
 * die Daten in JSON um und response.json() liest die Antwort aus.
 * Bei HTTP- oder GraphQL-Fehlern wird eine Fehlermeldung ausgelöst.
 */
async function requestAniList(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) throw new Error(`AniList-Fehler: ${response.status}`)

  const data = await response.json()
  if (data.errors?.length) throw new Error(data.errors[0].message)

  return data.data
}

/**
 * Sucht Manga anhand eines eingegebenen Titels.
 * Eine GraphQL-Abfrage fordert die 20 beliebtesten Treffer
 * samt Titel, Cover, Beschreibung, Bewertung und weiteren Daten an.
 */
export async function searchManga(search) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          description
          coverImage { large }
          averageScore
          status
          genres
        }
      }
    }
  `

  const data = await requestAniList(query, { search })
  return data.Page.media
}

/**
 * Lädt die vollständigen Informationen eines bestimmten Manga.
 * Die Manga-ID wird als GraphQL-Variable übergeben und mit Number()
 * in eine Zahl umgewandelt. AniList liefert dazu die Detaildaten.
 */
export async function getManga(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title { romaji english native }
        description
        coverImage { extraLarge }
        bannerImage
        averageScore
        status
        genres
        chapters
        volumes
        startDate { year month day }
        endDate { year month day }
        staff {
          edges {
            role
            node {
              id
              name { full }
            }
          }
        }
      }
    }
  `

  const data = await requestAniList(query, { id: Number(id) })
  return data.Media
}

/**
 * Lädt mehrere Manga anhand ihrer IDs, beispielsweise für das Benutzerprofil.
 * Da eine Anfrage maximal 50 Einträge anfordert, werden die IDs mit
 * slice() in Gruppen aufgeteilt und die Ergebnisse mit push() gesammelt.
 */
export async function getMangaByIds(ids) {
  if (!ids.length) return []

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: MANGA) {
          id
          title { romaji english }
          coverImage { medium }
        }
      }
    }
  `

  const results = []

  for (let i = 0; i < ids.length; i += 50) {
    const data = await requestAniList(query, { ids: ids.slice(i, i + 50) })
    results.push(...data.Page.media)
  }

  return results
}

/**
 * Lädt die 50 beliebtesten nicht als Erwachseneninhalt markierten Manga
 * und wählt daraus sechs zufällige für die Startseite aus.
 * Dafür wird eine Kopie des Arrays mit dem Fisher-Yates-Verfahren gemischt.
 */
export async function getHotManga() {
  const query = `
    query {
      Page(page: 1, perPage: 50) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          id
          title { romaji english }
          coverImage { large }
          averageScore
          genres
        }
      }
    }
  `

  const data = await requestAniList(query)
  const manga = [...data.Page.media]

  for (let i = manga.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[manga[i], manga[j]] = [manga[j], manga[i]]
  }

  return manga.slice(0, 6)
}

// Enthält alle Manga-Status, die beim ungefilterten Archiv berücksichtigt werden.
const ALL_MANGA_STATUSES = [
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "HIATUS",
  "CANCELLED"
]

/**
 * Lädt Manga für das Archiv anhand von Suche, Genre, Status und Sortierung.
 * Die Filter werden als GraphQL-Variablen an AniList übertragen.
 * Pro Seite werden maximal 50 Manga sowie die Information zurückgegeben,
 * ob eine weitere Ergebnisseite existiert.
 */
export async function browseManga({ search = "", genre = "", status = "", sort = "POPULARITY_DESC", page = 1 }) {
  const query = `
    query (
      $page: Int
      $search: String
      $genre: String
      $statuses: [MediaStatus]
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        media(
          type: MANGA
          search: $search
          genre: $genre
          status_in: $statuses
          sort: $sort
          isAdult: false
        ) {
          id
          title { romaji english }
          coverImage { large }
          averageScore
          status
          genres
        }
      }
    }
  `

  // Erstellt die Variablen für die GraphQL-Abfrage.
  const variables = {
    page,
    search: search.trim() || null,
    genre: genre || null,
    statuses: status ? [status] : ALL_MANGA_STATUSES,
    sort: [sort]
  }

  const data = await requestAniList(query, variables)

  return {
    manga: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage
  }
}
