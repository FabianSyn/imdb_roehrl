
import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Search from "./pages/Search"
import MangaDetails from "./pages/MangaDetails"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Communities from "./pages/Communities"
import CommunityDetails from "./pages/CommunityDetails"

/**
 * Definiert die Seitenstruktur und Navigation der Website.
 * React Router ordnet mit Routes und Route jeder URL eine Komponente zu.
 * Dynamische Pfade (:id) ermöglichen individuelle Manga- und Community-Seiten.
 * Der Header bleibt immer sichtbar und ProtectedRoute schützt das Profil.
 * ProtectedRoute: Eine Schutzkomponente, die nur angemeldeten Benutzern den Zugriff auf bestimmte Seiten erlaubt.
 */
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/manga/:id" element={<MangaDetails />} />
        <Route path="/communities/:id" element={<CommunityDetails />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
