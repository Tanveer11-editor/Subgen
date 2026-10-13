import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import EditorPage from "@/pages/EditorPage"
// import ProjectsPage from "@/pages/ProjectsPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        {/* <Route path="/projects" element={<ProjectsPage />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
