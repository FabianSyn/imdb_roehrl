
/**
 * Diese Komponente blendet Spoiler-Inhalte aus und zeigt sie erst nach einem Klick an.
 */

import { useState } from "react"

/**
 * Steuert die Sichtbarkeit eines Spoilers mithilfe von useState.
 * spoiler gibt an, ob der Inhalt geschützt werden soll, während children
 * den übergebenen Inhalt enthält. Über setVisible wird der State geändert,
 * wodurch React die entsprechende Ansicht neu rendert.
 */
export default function SpoilerContent({ spoiler = false, children }) {
  // Speichert, ob der Spoiler aktuell sichtbar ist.
  const [visible, setVisible] = useState(false)

  // Ohne Spoiler-Markierung wird der Inhalt direkt angezeigt.
  if (!spoiler) return <>{children}</>

  return (
    <div className="spoiler-content">
      {!visible ? (
        <div className="spoiler-hidden">
          <span className="spoiler-badge">SPOILER!</span>
          <p>Dieser Inhalt enthält Spoiler.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setVisible(true)}
          >
            Spoiler anzeigen
          </button>
        </div>
      ) : (
        <div className="spoiler-visible">
          <div className="spoiler-visible-header">
            <span className="spoiler-badge">SPOILER!</span>
            <button
              className="spoiler-hide-button"
              type="button"
              onClick={() => setVisible(false)}
            >
              Spoiler verbergen
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
