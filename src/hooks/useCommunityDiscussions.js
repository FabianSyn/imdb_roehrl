
/**
 * Dieser Hook verwaltet Diskussionsthemen und Antworten einer Community.
 * Er lädt die Beiträge aus Supabase und stellt eine Funktion bereit,
 * um die Diskussionen nach Änderungen zu aktualisieren.
 */

import { useEffect, useState } from "react"
import { getCommunityPosts } from "../services/communityPosts"
import { getCommunityReplies } from "../services/communityReplies"

/**
 * Lädt alle Diskussionsthemen einer Community und ihre Antworten.
 * Promise.all() wird hier nicht benötigt, da zuerst die Beitrags-IDs
 * geladen werden müssen, bevor ihre Antworten abgefragt werden können.
 */
export default function useCommunityDiscussions(communityId) {
  const [posts, setPosts] = useState([])
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Fordert ein erneutes Laden der Diskussionen an.
   * Die Änderung von reloadKey startet den useEffect() erneut.
   */
  const refreshDiscussions = () => {
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    let active = true

    const loadDiscussions = async () => {
      setLoading(true)
      setError("")
      setPosts([])
      setReplies([])

      if (!communityId) {
        setLoading(false)
        return
      }

      try {
        // Lädt zunächst sämtliche Diskussionsthemen.
        const postData = await getCommunityPosts(communityId)

        // Erstellt eine Liste der Beitrags-IDs für die Antwortabfrage.
        const postIds = postData.map((post) => post.id)

        // Lädt die Antworten zu den gefundenen Beiträgen.
        const replyData = await getCommunityReplies(postIds)

        if (!active) return

        setPosts(postData)
        setReplies(replyData)
      } catch (err) {
        if (active) {
          setError(
            err.message || "Diskussionen konnten nicht geladen werden."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDiscussions()

    return () => {
      active = false
    }
  }, [communityId, reloadKey])

  return {
    posts,
    replies,
    loading,
    error,
    refreshDiscussions
  }
}
