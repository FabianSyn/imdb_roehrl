
/**
 * Dieser Service verwaltet Diskussionsthemen in Communities.
 * Er ermöglicht das Laden, Erstellen, Bearbeiten und Löschen von Beiträgen.
 */

import { supabase } from "./supabase"

/**
 * Lädt die neuesten 100 Diskussionsthemen einer Community.
 * select() liest die Beitragsdaten und den Autorennamen, eq() filtert
 * nach der Community und order() sortiert die neuesten Beiträge zuerst.
 */
export async function getCommunityPosts(communityId) {
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, community_id, author_id, title, content, spoiler, created_at, updated_at, profiles(username)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

/**
 * Erstellt ein neues Diskussionsthema über insert() in Supabase.
 * trim() bereinigt Titel und Inhalt; die Datenbank prüft über RLS,
 * ob der angemeldete Benutzer Mitglied der Community ist.
 */
export async function createCommunityPost(communityId, userId, title, content, spoiler = false) {
  const { error } = await supabase
    .from("community_posts")
    .insert({
      community_id: communityId,
      author_id: userId,
      title: title.trim(),
      content: content.trim(),
      spoiler
    })

  if (error) throw error
}

/**
 * Aktualisiert Titel, Inhalt und Spoiler-Markierung eines Beitrags.
 * update() speichert die Änderungen; eq() begrenzt die Anfrage auf
 * den Beitrag und seinen Autor. updated_at hält die Bearbeitungszeit fest.
 */
export async function updateCommunityPost(postId, userId, title, content, spoiler = false) {
  const { error } = await supabase
    .from("community_posts")
    .update({
      title: title.trim(),
      content: content.trim(),
      spoiler,
      updated_at: new Date().toISOString()
    })
    .eq("id", postId)
    .eq("author_id", userId)

  if (error) throw error
}

/**
 * Löscht einen eigenen Beitrag über delete().
 * eq() grenzt den betroffenen Beitrag ein. Zugehörige Antworten
 * werden durch die CASCADE-Regel der Datenbank automatisch mitgelöscht.
 */
export async function deleteCommunityPost(postId, userId) {
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId)

  if (error) throw error
}
