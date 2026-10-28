
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
