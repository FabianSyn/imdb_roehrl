
/**
 * Dieser Service verwaltet persönliche Benutzerdaten in Supabase.
 * Er lädt Profilinformationen und Aktivitäten und ermöglicht
 * das Aktualisieren des Benutzerprofils.
 */

import { supabase } from "./supabase"

/**
 * Lädt die Profildaten eines bestimmten Benutzers.
 * eq() sucht nach der Benutzer-ID und single() gibt
 * den gefundenen Datensatz als einzelnes Objekt zurück.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Lädt alle Manga-Bewertungen eines bestimmten Benutzers.
 * eq() filtert nach der Benutzer-ID und order() sortiert
 * die Bewertungen nach dem letzten Bearbeitungsdatum.
 */
export async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("id, manga_id, rating, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

/**
 * Lädt alle Manga-Kommentare eines bestimmten Benutzers.
 * select() bestimmt die benötigten Spalten und order()
 * zeigt die zuletzt bearbeiteten Kommentare zuerst an.
 */
export async function getUserComments(userId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, manga_id, content, spoiler, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

/**
 * Aktualisiert Benutzername und Avatar-Adresse in Supabase.
 * update() speichert die neuen Werte, eq() wählt das Profil
 * anhand der Benutzer-ID aus und updated_at dokumentiert die Änderung.
 */
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
