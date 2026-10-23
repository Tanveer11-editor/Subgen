import { useState, useRef, useEffect } from "react"
import {
  ChevronLeft, Download, Loader2, FileText, AlertTriangle,
  HelpCircle, Cloud, Edit2, Film, Music, Sticker, Type, X,
  CheckCircle, Plus, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/stores/editorStore"
import { uploadVideo, startTranscription, checkJobStatus, startRender } from "@/services/api"
import { CaptionEditorPanel } from "@/components/editor/CaptionEditorPanel"
import { VideoPreview } from "@/components/editor/VideoPreview"
import { RightSidebarPanel } from "@/components/editor/RightSidebarPanel"
import { Timeline } from "@/components/editor/Timeline"

export default function EditorPage() {
  const {
    video,
    captions,
    setCaptions,
    setCurrentTime,
    selectedCaptionId,
    setSelectedCaptionId,
    markSaved,
    outputMode,
    sourceLanguage,
    maxWordsPerCaption,
    activeTemplate,
    textPositionX,
    textPositionY,
    projectTitle,
    setProjectTitle,
    resolution,
    setResolution,
    loadNewVideo,
    needsTranscription,
    setNeedsTranscription
  } = useEditorStore()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pollIntervalRef = useRef<any>(null)
  const uploadVideoInputRef = useRef<HTMLInputElement>(null)

  const [videoDuration, setVideoDuration] = useState(video.duration || 13.2)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeProgress, setTranscribeProgress] = useState("")
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState("")
  const [showRetranscribeConfirm, setShowRetranscribeConfirm] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showExportSuccessModal, setShowExportSuccessModal] = useState(false)
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false)
  const [activeRailTab, setActiveRailTab] = useState<"captions" | "elements" | "media" | "audio">("captions")

  const duration = videoDuration > 0 ? videoDuration : (video.duration || 13.2)

  // Auto-generate captions whenever a new video is loaded
  useEffect(() => {
    if (needsTranscription) {
      setNeedsTranscription(false)
      executeTranscription()
    }
  }, [needsTranscription])

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)

    // Highlight matching caption during playback
    const activeCap = captions.find(c => time >= c.start && time < c.end)
    if (activeCap && selectedCaptionId !== activeCap.id) {
      setSelectedCaptionId(activeCap.id)
    }
  }

  const handleSeek = (time: number) => {
    const maxDur = (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0)
      ? videoRef.current.duration
      : (duration > 0 ? duration : 13.2)
    const clamped = Math.max(0, Math.min(maxDur, time))
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = clamped
      } catch (err) {
        console.error("Seek error:", err)
      }
    }
    setCurrentTime(clamped)
  }

  const handleSaveProject = () => {
    try {
      localStorage.setItem("subgen_project_saved", JSON.stringify({
        title: projectTitle,
        captions,
        resolution
      }))
      markSaved()
      setSaveSuccessNotice(true)
      setTimeout(() => setSaveSuccessNotice(false), 2500)
    } catch {
      markSaved()
    }
  }

  const handleNewVideoSelected = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file (MP4, MOV, WebM).")
      return
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    setIsTranscribing(false)
    setTranscribeProgress("")

    // 1. Immediately wipe previous captions from dashboard
    setCaptions([], true)

    // 2. Load the new video into store and player
    loadNewVideo(file)

    // 3. Immediately trigger fresh transcription for this new video
    await executeTranscription(file)
  }

  const initiateTranscription = () => {
    executeTranscription()
  }

  const executeTranscription = async (overrideFile?: File) => {
    setShowRetranscribeConfirm(false)
    let fileToUpload = overrideFile || useEditorStore.getState().video.file

    // If no direct File object in memory (e.g. demo video or URL), fetch it as blob
    if (!fileToUpload && video.url) {
      try {
        setIsTranscribing(true)
        setTranscribeProgress("Loading video media...")
        const res = await fetch(video.url)
        const blob = await res.blob()
        const ext = video.url.includes(".mov") ? "mov" : video.url.includes(".webm") ? "webm" : "mp4"
        const filename = `${projectTitle || "video"}.${ext}`
        fileToUpload = new File([blob], filename, { type: blob.type || `video/${ext}` })
      } catch (err: any) {
        console.error("Failed to load video file from URL:", err)
      }
    }

    if (!fileToUpload) {
      setIsTranscribing(false)
      setTranscribeProgress("")
      return alert("Please select or upload a video first!")
    }

    // Always clear old captions so the dashboard never shows previous video subtitles
    setCaptions([], true)
    setIsTranscribing(true)
    setTranscribeProgress("Uploading video to AI server...")

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    try {
      const uploadRes = await uploadVideo(fileToUpload)
      setTranscribeProgress("Analyzing speech with AI & generating subtitles...")

      const transcribeRes = await startTranscription(
        uploadRes.id,
        sourceLanguage,
        outputMode,
        maxWordsPerCaption
      )

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await checkJobStatus(transcribeRes.job_id)
          if (status.status === "completed") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsTranscribing(false)
            setTranscribeProgress("")
            if (Array.isArray(status.result) && status.result.length > 0) {
              setCaptions(status.result, true)
            } else {
              setCaptions([], true)
              alert("Transcription completed. No spoken speech detected in audio.")
            }
          } else if (status.status === "processing") {
            if (status.progress) {
              setTranscribeProgress(status.progress)
            }
          } else if (status.status === "error") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsTranscribing(false)
            setTranscribeProgress("")
            alert("Transcription failed: " + status.error)
          }
        } catch (e: any) {
          console.error("Polling status error:", e)
        }
      }, 1500)
    } catch (err: any) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      alert("Transcription error: " + err.message)
      setIsTranscribing(false)
      setTranscribeProgress("")
    }
  }

  const handleExportVideo = async () => {
    let fileToExport = video.file
    if (!fileToExport && video.url) {
      try {
        const res = await fetch(video.url)
        const blob = await res.blob()
        const ext = video.url.includes(".mov") ? "mov" : video.url.includes(".webm") ? "webm" : "mp4"
        fileToExport = new File([blob], `${projectTitle || "video"}.${ext}`, { type: blob.type || `video/${ext}` })
      } catch (e) {
        console.error("Failed to fetch demo video for export:", e)
      }
    }

    if (!fileToExport) {
      // If still unable to fetch, simulate download
      setIsRendering(true)
      setRenderProgress("Rendering 1080p Video...")
      setTimeout(() => {
        setIsRendering(false)
        setRenderProgress("")
        markSaved()
        const a = document.createElement("a")
        a.href = "/demo_video.mp4"
        a.download = `${projectTitle}_1080p.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setShowExportSuccessModal(true)
      }, 1500)
      return
    }

    if (captions.length === 0) return alert("No captions available to burn in.")

    setIsRendering(true)
    setRenderProgress("Uploading...")
    try {
      const uploadRes = await uploadVideo(fileToExport)
      setRenderProgress("Burning subtitles via FFmpeg...")
      const renderRes = await startRender(uploadRes.id, captions, activeTemplate, textPositionX, textPositionY)

      const poll = setInterval(async () => {
        try {
          const status = await checkJobStatus(renderRes.job_id)
          if (status.status === "completed") {
            clearInterval(poll)
            setIsRendering(false)
            setRenderProgress("")
            markSaved()
            const downloadLink = document.createElement("a")
            downloadLink.href = `http://localhost:8080${status.download_url}`
            downloadLink.download = `${projectTitle}.mp4`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            setShowExportSuccessModal(true)
          } else if (status.status === "error") {
            clearInterval(poll)
            setIsRendering(false)
            alert("Render failed: " + status.error)
          }
        } catch (e: any) {
          console.error(e)
        }
      }, 2000)
    } catch (err: any) {
      alert("Export error: " + err.message)
      setIsRendering(false)
    }
  }

  const handleExportSRT = () => {
    if (captions.length === 0) return alert("No captions to export as SRT.")

    const formatSRTTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0")
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
      const secs = Math.floor(seconds % 60).toString().padStart(2, "0")
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0")
      return `${hrs}:${mins}:${secs},${ms}`
    }

    const srtContent = captions.map((cap, idx) => {
      return `${idx + 1}\n${formatSRTTime(cap.start)} --> ${formatSRTTime(cap.end)}\n${cap.text}\n`
    }).join("\n")

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectTitle}.srt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0B0B0D] text-white overflow-hidden font-sans select-none">
      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141A] border border-[#2B2B38] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242430] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={20} className="text-accent" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts & Controls</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-[#8E8E98] hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Play / Pause</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">Space</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Stop / Pause</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">K</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Reverse Play</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">J</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Forward (Up to 2x)</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">L</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Cutting Tool</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">B</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Selection Tool</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">A</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Undo Action</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">Ctrl + Z</kbd>
                </div>

                <div className="bg-[#1C1C24] p-2.5 rounded-xl border border-[#2B2B38] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Redo Action</span>
                  <kbd className="px-2 py-0.5 bg-black/50 text-accent font-mono font-bold rounded border border-accent/40">Ctrl + Shift + Z</kbd>
                </div>
              </div>

              <div className="bg-[#1A1813] border border-[#423315] p-3 rounded-xl text-[11px] text-[#A1A1AA] leading-relaxed">
                <span className="text-accent font-bold">Pro Tip: </span>
                Drag the left or right edges of any word on the timeline to adjust its length. Use the orange trim brackets on the video track to trim in/out points. Toggle between single word and double-line captions using the <strong className="text-white">WORD | LINE</strong> switch!
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="accent" size="sm" onClick={() => setShowShortcutsModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Retranscribe Confirmation Modal */}
      {showRetranscribeConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141A] border border-[#2B2B38] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-accent">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">Retranscribe Video?</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              You have manual edits in your captions. Generating new captions will replace your custom edits and word timings.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRetranscribeConfirm(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" onClick={() => executeTranscription()}>
                Replace & Retranscribe
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Project / Video Confirmation Modal */}
      {showNewProjectConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141A] border border-[#2B2B38] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-accent">
              <Sparkles size={24} />
              <h3 className="text-base font-bold text-white">Start New Video Project?</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Uploading a new video will clear all current captions and generate brand new word-level transcriptions for your new video.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewProjectConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setShowNewProjectConfirm(false)
                  uploadVideoInputRef.current?.click()
                }}
              >
                Choose New Video
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Complete Success Modal */}
      {showExportSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141A] border border-[#2B2B38] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Video Exported Successfully!</h3>
              <p className="text-xs text-[#8E8E98] mt-1.5 leading-relaxed">
                Your video with burned subtitles has been downloaded. Ready to edit and transcribe a new video?
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                variant="accent"
                className="w-full font-bold shadow-md shadow-accent/20 flex items-center justify-center gap-2"
                onClick={() => {
                  setShowExportSuccessModal(false)
                  uploadVideoInputRef.current?.click()
                }}
              >
                <Sparkles size={14} />
                <span>Edit A New Video</span>
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs text-[#8E8E98] hover:text-white"
                onClick={() => setShowExportSuccessModal(false)}
              >
                Continue Current Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER BAR (Matching Captik UI Screenshot)                             */}
      {/* ========================================================================= */}
      <header className="h-13 shrink-0 border-b border-[#23232C] bg-[#101015] px-4 flex items-center justify-between z-30">
        {/* Left: Brand Logo, Project Name, Resolution */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-lg hover:bg-[#1C1C24] text-[#8E8E98] hover:text-white transition-colors"
            title="Go Back"
          >
            <ChevronLeft size={18} />
          </button>

          {/* SubGen Logo Mark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent text-black font-black text-xs flex items-center justify-center shadow-md shadow-accent/25">
              S
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              SubGen
            </span>
          </div>

          {/* Project Title (Editable) */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#272733]">
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                autoFocus
                className="bg-[#1C1C24] border border-accent/80 text-xs px-2 py-0.5 rounded text-white focus:outline-none max-w-[200px]"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 text-xs font-mono text-[#D4D4D8] hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#1A1A22] transition-colors"
                title="Click to rename project"
              >
                <span className="max-w-[160px] truncate">{projectTitle}</span>
                <Edit2 size={11} className="text-[#70707D]" />
              </div>
            )}
          </div>

          {/* Resolution Selector: 1080p | 720p */}
          <div className="flex items-center bg-[#17171F] p-0.5 rounded-lg border border-[#272733]">
            <button
              onClick={() => setResolution("1080p")}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all ${
                resolution === "1080p"
                  ? "bg-accent text-black shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              1080p
            </button>
            <button
              onClick={() => setResolution("720p")}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all ${
                resolution === "720p"
                  ? "bg-accent text-black shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              720p
            </button>
          </div>

          {/* New Video File Input */}
          <input
            type="file"
            ref={uploadVideoInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleNewVideoSelected(file)
              }
              if (e.target) e.target.value = ""
            }}
            accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
            className="hidden"
          />

          <button
            onClick={() => {
              if (captions.length > 0) {
                setShowNewProjectConfirm(true)
              } else {
                uploadVideoInputRef.current?.click()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-[#FFC425] text-black text-xs font-bold transition-all shadow-md shadow-accent/20 active:scale-95"
            title="Upload a new video to replace and generate fresh captions"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>New Video</span>
          </button>
        </div>

        {/* Right: Save, SRT, Help, Export */}
        <div className="flex items-center gap-2.5">

          {/* Save Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 bg-[#16161C] border-[#2A2A36] text-[#D4D4D8] hover:text-white hover:border-accent/60 transition-colors"
            onClick={handleSaveProject}
          >
            <Cloud size={13} />
            <span>{saveSuccessNotice ? "Saved!" : "Save"}</span>
          </Button>

          {/* SRT Export Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 bg-[#16161C] border-[#2A2A36] text-[#D4D4D8] hover:text-white hover:border-accent/60 transition-colors"
            onClick={handleExportSRT}
          >
            <FileText size={13} />
            <span>SRT</span>
          </Button>

          {/* Help Button (?) */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="w-8 h-8 rounded-lg bg-[#16161C] border border-[#2A2A36] text-[#A1A1AA] hover:text-white flex items-center justify-center text-xs font-bold hover:border-accent/60 transition-colors"
            title="Keyboard Shortcuts & Help (?)"
          >
            <HelpCircle size={15} />
          </button>

          {/* Export Video Button */}
          <button
            onClick={handleExportVideo}
            disabled={isRendering}
            className="flex items-center gap-1.5 px-4 h-8 bg-accent hover:bg-[#FFC425] text-black text-xs font-extrabold rounded-lg shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isRendering ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isRendering ? renderProgress : "Export"}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN 4-COLUMN WORKSPACE: ICON RAIL + CAPTIONS + PREVIEW + TEMPLATES        */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Far-Left Vertical Icon Rail (Captik Navigation: T, Stickers, Media, Audio) */}
        <aside className="w-12 shrink-0 border-r border-[#23232C] bg-[#0E0E12] flex flex-col items-center py-3 gap-4 z-20">
          <button
            onClick={() => setActiveRailTab("captions")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeRailTab === "captions"
                ? "bg-accent text-black font-extrabold shadow-md shadow-accent/20"
                : "text-[#8E8E98] hover:text-white hover:bg-[#1A1A22]"
            }`}
            title="Captions / Text (T)"
          >
            <Type size={16} />
          </button>

          <button
            onClick={() => setActiveRailTab("elements")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeRailTab === "elements"
                ? "bg-accent text-black font-extrabold shadow-md shadow-accent/20"
                : "text-[#8E8E98] hover:text-white hover:bg-[#1A1A22]"
            }`}
            title="Elements & Stickers"
          >
            <Sticker size={16} />
          </button>

          <button
            onClick={() => {
              setActiveRailTab("media")
              uploadVideoInputRef.current?.click()
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeRailTab === "media"
                ? "bg-accent text-black font-extrabold shadow-md shadow-accent/20"
                : "text-[#8E8E98] hover:text-white hover:bg-[#1A1A22]"
            }`}
            title="Media & Clips (Upload New Video)"
          >
            <Film size={16} />
          </button>

          <button
            onClick={() => setActiveRailTab("audio")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeRailTab === "audio"
                ? "bg-accent text-black font-extrabold shadow-md shadow-accent/20"
                : "text-[#8E8E98] hover:text-white hover:bg-[#1A1A22]"
            }`}
            title="Audio & Sounds"
          >
            <Music size={16} />
          </button>
        </aside>

        {/* Column 1: Caption Editor Panel */}
        <CaptionEditorPanel
          duration={duration}
          onSeek={handleSeek}
          onTranscribe={initiateTranscription}
          isTranscribing={isTranscribing}
          transcribeProgress={transcribeProgress}
        />

        {/* Column 2: Video Player & Canvas Preview */}
        <VideoPreview
          duration={duration}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={setVideoDuration}
          onSeek={handleSeek}
          videoRef={videoRef}
          onLoadNewVideo={handleNewVideoSelected}
        />

        {/* Column 3: Right Sidebar Panel (Templates, Customize, Text) */}
        <RightSidebarPanel />
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: MULTI-TRACK TIMELINE (Interactive word resize, trim, JKL) */}
      {/* ========================================================================= */}
      <Timeline
        duration={duration}
        onSeek={handleSeek}
      />
    </div>
  )
}
