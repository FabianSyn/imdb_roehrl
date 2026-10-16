import { supabase } from "./supabase"

// Profildaten laden / Load profile data
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}

// Eigene Bewertungen laden / Load own ratings
export async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("id, manga_id, rating, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

// Eigene Kommentare laden / Load own comments
export async function getUserComments(userId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, manga_id, content, spoiler, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

// Profil speichern / Save profile
export async function updateProfile(userId, username, avatarUrl) {
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)

  if (error) throw error
}