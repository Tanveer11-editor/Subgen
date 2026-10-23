import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, Video, Zap, Globe, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/stores/editorStore"

export default function LandingPage() {
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loadNewVideo, loadDemoProject } = useEditorStore()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file (MP4, MOV, WebM).")
      return
    }
    // Limit to 2GB
    if (file.size > 2 * 1024 * 1024 * 1024) {
      alert("File size exceeds 2GB limit.")
      return
    }

    loadNewVideo(file)
    navigate("/editor")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length) {
      processFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length) {
      processFile(files[0])
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">LingoVision</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-text-secondary">
          <a href="#" className="hover:text-text-primary transition-colors">Templates</a>
          <a href="#" className="hover:text-text-primary transition-colors">Pricing</a>
          <a href="#" className="hover:text-text-primary transition-colors">About</a>
        </nav>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/editor")}>Open Editor</Button>
          <Button variant="accent" onClick={() => navigate("/editor")}>Start for Free</Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center pt-24 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-8">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase">New: Tanglish Support</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Captivate Your Audience With <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-600">
            Pro Animated Subtitles
          </span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-12">
          Word-level accurate AI transcription in Tamil, Tanglish, and English.
          Export stunning 4K videos ready for Reels & Shorts in seconds.
        </p>

        {/* Upload Area */}
        <div
          className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ${
            isDragging
              ? "border-accent bg-accent/5 scale-[1.02]"
              : "border-border bg-bg-panel hover:border-text-muted"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-bg-control flex items-center justify-center mb-6 text-text-secondary">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Upload your video</h3>
            <p className="text-text-muted text-sm mb-8">
              Drag and drop your file here, or click to browse.<br/>
              Supports MP4, MOV, WebM up to 2GB.
            </p>
            <div className="flex gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                className="hidden"
              />
              <Button
                variant="accent"
                size="lg"
                className="px-8 shadow-[0_0_20px_rgba(255,176,0,0.3)]"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  loadDemoProject()
                  navigate("/editor")
                }}
              >
                Try Demo Project
              </Button>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mt-24">
          <div className="p-6 rounded-2xl bg-bg-panel border border-border text-left">
            <Globe className="text-accent mb-4" size={24} />
            <h4 className="text-lg font-bold mb-2">Multilingual AI</h4>
            <p className="text-text-secondary text-sm">Flawless transcription for English, Tamil, and Tanglish. Our custom models understand Indian accents perfectly.</p>
          </div>
          <div className="p-6 rounded-2xl bg-bg-panel border border-border text-left">
            <Video className="text-accent mb-4" size={24} />
            <h4 className="text-lg font-bold mb-2">Word-Level Timing</h4>
            <p className="text-text-secondary text-sm">Every word is timestamped perfectly. Easily edit text, merge lines, or change timings in the intuitive timeline.</p>
          </div>
          <div className="p-6 rounded-2xl bg-bg-panel border border-border text-left">
            <Zap className="text-accent mb-4" size={24} />
            <h4 className="text-lg font-bold mb-2">One-Click Animations</h4>
            <p className="text-text-secondary text-sm">Apply stunning templates like Karaoke, Pop, and Bounce instantly. No After Effects needed.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
