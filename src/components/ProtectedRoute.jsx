
/**
 * Diese Komponente schützt Seiten, die nur für angemeldete
 * Benutzer zugänglich sein sollen.
 * useAuth() übernimmt die Überprüfung des Anmeldestatus.
 */

import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"

/**
 * Prüft mithilfe von useAuth(), ob ein Benutzer angemeldet ist.
 * Während der Überprüfung wird ein Ladetext angezeigt.
 * Nicht angemeldete Benutzer werden zur Login-Seite weitergeleitet.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Anmeldestatus wird überprüft...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
