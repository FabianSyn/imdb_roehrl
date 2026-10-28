
/**
 * Diese Datei stellt die Verbindung zur Supabase-Datenbank
 * und zum Supabase-Authentifizierungsdienst bereit.
 */

import { createClient } from "@supabase/supabase-js"

// Liest die Supabase-Projektadresse aus den Vite-Umgebungsvariablen.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Liest den öffentlichen Supabase-Schlüssel aus den Umgebungsvariablen.
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Erstellt mit createClient() eine zentrale Supabase-Clientinstanz.
 * Über diesen Client können andere Dateien Datenbankabfragen ausführen
 * und Authentifizierungsfunktionen von Supabase verwenden.
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
