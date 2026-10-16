import { supabase } from "./supabase"

// Manga-Kommentare laden / Load manga comments
export async function getComments(mangaId) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      user_id,
      content,
      spoiler,
      created_at,
      profiles (
        username
      )
    `)
    .eq("manga_id", mangaId)
    .is("chapter_id", null)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Kommentar speichern / Save comment
export async function addComment(mangaId, userId, content, spoiler = false) {
  const { error } = await supabase
    .from("comments")
    .insert({
      manga_id: mangaId,
      user_id: userId,
      content,
      spoiler,
      chapter_id: null
    })

  if (error) throw error
}

// Kommentar löschen / Delete comment
export async function deleteComment(commentId, userId) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId)

  if (error) throw error
}