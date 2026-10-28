
/**
 * Dieser Service verwaltet Manga-Kommentare in Supabase.
 * Kommentare können geladen, erstellt, bearbeitet und gelöscht werden.
 */

import { supabase } from "./supabase"

/**
 * Lädt alle allgemeinen Kommentare eines bestimmten Manga aus Supabase.
 * select() bestimmt die benötigten Daten einschließlich des Benutzernamens,
 * eq() und is() filtern die Kommentare und order() sortiert sie nach Datum.
 */
export async function getComments(mangaId) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      user_id,
      content,
      spoiler,
      created_at,
      updated_at,
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

/**
 * Speichert einen neuen Kommentar in der Supabase-Datenbank.
 * insert() erstellt den Datensatz mit Manga-ID, Benutzer-ID,
 * Kommentartext und Spoiler-Markierung.
 */
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

/**
 * Aktualisiert einen bestehenden Kommentar in Supabase.
 * update() verändert Inhalt und Spoiler-Status, während eq()
 * den Datensatz auf die Kommentar-ID und Benutzer-ID einschränkt.
 */
export async function updateComment(commentId, userId, content, spoiler) {
  const { error } = await supabase
    .from("comments")
    .update({
      content,
      spoiler,
      updated_at: new Date().toISOString()
    })
    .eq("id", commentId)
    .eq("user_id", userId)

  if (error) throw error
}

/**
 * Löscht einen bestehenden Kommentar aus Supabase.
 * delete() entfernt den Datensatz, während eq() die Anfrage
 * auf den angegebenen Kommentar des Benutzers begrenzt.
 */
export async function deleteComment(commentId, userId) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId)

  if (error) throw error
}
