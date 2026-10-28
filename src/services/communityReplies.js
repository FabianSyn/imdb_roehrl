
/**
 * Dieser Service verwaltet Antworten auf Community-Diskussionen.
 * Antworten können geladen, erstellt, bearbeitet und gelöscht werden.
 */

import { supabase } from "./supabase"

/**
 * Lädt die Antworten zu den angegebenen Diskussionsthemen.
 * in() filtert nach mehreren Beitrags-IDs, order() sortiert die
 * Antworten chronologisch und limit() begrenzt die Anzahl auf 1000.
 */
export async function getCommunityReplies(postIds) {
  if (!postIds.length) return []

  const { data, error } = await supabase
    .from("community_replies")
    .select("id, post_id, author_id, content, spoiler, created_at, updated_at, profiles(username)")
    .in("post_id", postIds)
    .order("created_at", { ascending: true })
    .limit(1000)

  if (error) throw error
  return data || []
}

/**
 * Erstellt eine Antwort auf ein Diskussionsthema.
 * insert() speichert Text, Autor und Spoiler-Markierung.
 * Die Datenbank kontrolliert über RLS die Schreibberechtigung.
 */
export async function createCommunityReply(postId, userId, content, spoiler = false) {
  const { error } = await supabase
    .from("community_replies")
    .insert({
      post_id: postId,
      author_id: userId,
      content: content.trim(),
      spoiler
    })

  if (error) throw error
}

/**
 * Bearbeitet eine vorhandene Antwort über update().
 * trim() bereinigt den Text, eq() filtert nach Antwort und Autor
 * und updated_at speichert den Zeitpunkt der letzten Änderung.
 */
export async function updateCommunityReply(replyId, userId, content, spoiler = false) {
  const { error } = await supabase
    .from("community_replies")
    .update({
      content: content.trim(),
      spoiler,
      updated_at: new Date().toISOString()
    })
    .eq("id", replyId)
    .eq("author_id", userId)

  if (error) throw error
}

/**
 * Löscht eine eigene Antwort aus Supabase.
 * delete() entfernt den Eintrag und die eq()-Bedingungen
 * begrenzen die Anfrage auf die angegebene Antwort des Autors.
 */
export async function deleteCommunityReply(replyId, userId) {
  const { error } = await supabase
    .from("community_replies")
    .delete()
    .eq("id", replyId)
    .eq("author_id", userId)

  if (error) throw error
}
