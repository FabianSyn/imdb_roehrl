import { supabase } from "./supabase"

// Eigene Bewertung laden / Load own rating
export async function getUserRating(mangaId, userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("manga_id", mangaId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return data?.rating || null
}

// Durchschnitt berechnen / Calculate average
export async function getAverageRating(mangaId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("manga_id", mangaId)

  if (error) throw error
  if (!data.length) return null

  const sum = data.reduce((total, item) => total + item.rating, 0)
  return (sum / data.length).toFixed(1)
}

// Bewertung speichern oder ändern / Save or update rating
export async function saveRating(mangaId, userId, rating) {
  const { error } = await supabase
    .from("ratings")
    .upsert(
      {
        manga_id: mangaId,
        user_id: userId,
        rating,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,manga_id"
      }
    )

  if (error) throw error
}