import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Search from "./pages/Search"
import MangaDetails from "./pages/MangaDetails"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"

// Seitenstruktur / Page structure
export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/manga/:id" element={<MangaDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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