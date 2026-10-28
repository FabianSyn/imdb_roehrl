
/**
 * Dieser Service verwaltet Manga-Bewertungen in Supabase.
 * Er lädt persönliche Bewertungen, berechnet Durchschnittswerte
 * und ermöglicht das Speichern oder Ändern einer Bewertung.
 */

import { supabase } from "./supabase"

/**
 * Lädt die persönliche Bewertung eines Benutzers für einen Manga.
 * eq() filtert nach Manga und Benutzer, während maybeSingle()
 * höchstens einen Datensatz zurückgibt, ohne bei fehlendem Eintrag
 * einen Fehler auszulösen.
 */
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

/**
 * Berechnet die durchschnittliche Community-Bewertung eines Manga.
 * select() lädt sämtliche Bewertungen, reduce() addiert deren Werte
 * und die Summe wird durch ihre Anzahl geteilt.
 * toFixed(1) formatiert das Ergebnis auf eine Nachkommastelle.
 */
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

/**
 * Speichert eine neue Bewertung oder aktualisiert eine vorhandene.
 * upsert() kombiniert Einfügen und Aktualisieren. onConflict legt
 * fest, dass pro Benutzer und Manga nur eine Bewertung existieren soll.
 */
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
