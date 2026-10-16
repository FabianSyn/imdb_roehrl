const API_URL = "https://graphql.anilist.co"

// GraphQL Anfrage senden / Send GraphQL request
async function requestAniList(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  if (!response.ok) {
    throw new Error(`AniList-Fehler: ${response.status}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "AniList-Fehler")
  }

  return data.data
}

// Manga suchen / Search manga
export async function searchManga(search) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
          }
          description
          coverImage {
            large
          }
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

// Manga laden / Load manga
export async function getManga(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
        }
        bannerImage
        averageScore
        status
        genres
        chapters
        volumes
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        staff {
          edges {
            role
            node {
              id
              name {
                full
              }
            }
          }
        }
      }
    }
  `

  const data = await requestAniList(query, {
    id: Number(id)
  })

  return data.Media
}

// Mehrere Manga laden / Load multiple manga
export async function getMangaByIds(ids) {
  if (!ids.length) return []

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: MANGA) {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
          }
        }
      }
    }
  `

  const data = await requestAniList(query, { ids })
  return data.Page.media
}

// Populäre Manga laden / Load popular manga
export async function getHotManga() {
  const query = `
    query {
      Page(page: 1, perPage: 50) {
        media(
          type: MANGA
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          averageScore
          genres
        }
      }
    }
  `

  const data = await requestAniList(query)

  // Zufällige Auswahl / Random selection
  return [...data.Page.media]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
}