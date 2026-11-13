
import { supabase } from "./supabase"

// Communities laden / Load communities
export async function getCommunities() {
  const { data, error } = await supabase
    .from("communities")
    .select("id, name, description, created_by, created_at, community_members(user_id)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

// Einzelne Community laden / Load one community
export async function getCommunity(id) {
  const { data, error } = await supabase
    .from("communities")
    .select("id, name, description, created_by, created_at, community_members(user_id)")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

// Community erstellen / Create community
export async function createCommunity(name, description, userId) {
  const { data, error } = await supabase
    .from("communities")
    .insert({ name: name.trim(), description: description.trim(), created_by: userId })
    .select("id")
    .single()
  if (error) throw error
  return data
}

// Einer Community beitreten / Join a community
export async function joinCommunity(communityId, userId) {
  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: userId })
  if (error) throw error
}

// Eine Community verlassen / Leave a community
export async function leaveCommunity(communityId, userId) {
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId)
  if (error) throw error
}


/**
 * Löscht eine Community aus Supabase.
 *
 * Die Anfrage wird auf die Community-ID und den Gründer begrenzt.
 * Zusätzlich muss eine RLS-Regel in Supabase sicherstellen,
 * dass ausschließlich der tatsächlich angemeldete Gründer löschen darf.
 */
export async function deleteCommunity(communityId, userId) {
  if (!communityId || !userId) {
    throw new Error("Community-ID oder Benutzer-ID fehlt.")
  }

  const { data, error } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId)
    .eq("created_by", userId)
    .select("id")
    .maybeSingle()

  if (error) {
    throw error
  }

  // Auch bei fehlender Berechtigung kann Supabase null zurückgeben.
  // Deshalb darf ein fehlender Datensatz nicht als Erfolg gelten.
  if (!data) {
    throw new Error(
      "Die Community konnte nicht gelöscht werden. " +
      "Möglicherweise bist du nicht der Gründer oder sie existiert nicht mehr."
    )
  }

  return data
}
