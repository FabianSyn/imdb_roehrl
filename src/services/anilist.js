const API_URL = "https://graphql.anilist.co"

// Manga suchen / Search manga
export async function searchManga(query) {
  const graphqlQuery = `
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

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { search: query }
    })
  })

  if (!response.ok) {
    throw new Error(`AniList-Fehler: ${response.status}`)
  }

  const data = await response.json()
  return data.data.Page.media
}

// Manga laden / Load manga
export async function getManga(id) {
  const graphqlQuery = `
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

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { id: Number(id) }
    })
  })

  if (!response.ok) {
    throw new Error(`AniList-Fehler: ${response.status}`)
  }

  const data = await response.json()
  return data.data.Media
}