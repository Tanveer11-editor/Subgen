import { useState, useRef, useEffect } from "react"
import { 
  ChevronLeft, Download, Loader2, FileText, Check, AlertTriangle, Play, Pause, ZoomIn, ZoomOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/stores/editorStore"
import { uploadVideo, startTranscription, checkJobStatus, startRender } from "@/services/api"
import { CaptionEditorPanel } from "@/components/editor/CaptionEditorPanel"
import { VideoPreview } from "@/components/editor/VideoPreview"
import { RightSidebarPanel } from "@/components/editor/RightSidebarPanel"
import { formatClockTime } from "@/lib/timeUtils"

export default function EditorPage() {
  const { 
    video, 
    captions, 
    setCaptions, 
    currentTime, 
    setCurrentTime, 
    isPlaying, 
    setIsPlaying, 
    selectedCaptionId, 
    setSelectedCaptionId, 
    hasUnsavedEdits, 
    markSaved,
    outputMode,
    sourceLanguage,
    maxWordsPerCaption,
    activeTemplate,
    textPositionX,
    textPositionY
  } = useEditorStore()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const [videoDuration, setVideoDuration] = useState(video.duration || 10)
  const [timelineZoom, setTimelineZoom] = useState(1.0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeProgress, setTranscribeProgress] = useState("")
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState("")
  const [showRetranscribeConfirm, setShowRetranscribeConfirm] = useState(false)

  const duration = videoDuration > 0 ? videoDuration : (video.duration || 10)

  // Sync isPlaying state with HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false))
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying, setIsPlaying])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)

    // Highlight matching caption during playback
    const activeCap = captions.find(c => time >= c.start && time < c.end)
    if (activeCap && selectedCaptionId !== activeCap.id) {
      setSelectedCaptionId(activeCap.id)
    }
  }

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(duration, time))
    if (videoRef.current) {
      videoRef.current.currentTime = clamped
    }
    setCurrentTime(clamped)
  }

  const initiateTranscription = () => {
    if (hasUnsavedEdits && captions.length > 0) {
      setShowRetranscribeConfirm(true)
    } else {
      executeTranscription()
    }
  }

  const executeTranscription = async () => {
    setShowRetranscribeConfirm(false)
    if (!video.file) return alert("Please select or upload a video first!")
    setIsTranscribing(true)
    setTranscribeProgress("Uploading video...")
    try {
      const uploadRes = await uploadVideo(video.file)
      setTranscribeProgress("Transcribing Tamil speech...")
      
      const transcribeRes = await startTranscription(
        uploadRes.id, 
        sourceLanguage, 
        outputMode, 
        maxWordsPerCaption
      )
      
      const poll = setInterval(async () => {
        try {
          const status = await checkJobStatus(transcribeRes.job_id)
          if (status.status === "completed") {
            setCaptions(status.result, true)
            clearInterval(poll)
            setIsTranscribing(false)
            setTranscribeProgress("")
          } else if (status.status === "error") {
            clearInterval(poll)
            setIsTranscribing(false)
            alert("Transcription failed: " + status.error)
          }
        } catch (e: any) {
          console.error(e)
        }
      }, 1500)
    } catch (err: any) {
      alert("Transcription error: " + err.message)
      setIsTranscribing(false)
    }
  }

  const handleExportVideo = async () => {
    if (!video.file) return alert("No video loaded to export.")
    if (captions.length === 0) return alert("No captions available to burn in.")
    
    setIsRendering(true)
    setRenderProgress("Uploading...")
    try {
      const uploadRes = await uploadVideo(video.file)
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
            downloadLink.download = "subgen_video.mp4"
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
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
    a.download = "subtitles.srt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen w-full flex flex-col bg-bg-primary text-text-primary overflow-hidden font-sans select-none">
      {/* Retranscribe Warning Modal */}
      {showRetranscribeConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-accent">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-text-primary">Retranscribe Video?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              You have manual edits in your captions. Generating new captions will replace your custom edits and word timings.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRetranscribeConfirm(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" onClick={executeTranscription}>
                Replace & Retranscribe
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-14 shrink-0 border-b border-border bg-bg-panel px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="p-1.5 rounded-lg hover:bg-bg-control text-text-muted hover:text-text-primary transition-colors"
            title="Go Back"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold tracking-wide text-text-primary">
              {video.file ? video.file.name.replace(/\.[^/.]+$/, "") : "SubGen Video Editor"}
            </h1>
            <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
              hasUnsavedEdits 
                ? "bg-amber-500/15 text-accent border border-accent/30" 
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            }`}>
              {hasUnsavedEdits ? "Unsaved edits" : <><Check size={11} /> Saved</>}
            </span>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-xs h-8 border-border hover:border-accent hover:text-accent transition-colors" 
            onClick={handleExportSRT}
          >
            <FileText size={14} /> Export SRT
          </Button>

          <Button 
            variant="accent" 
            size="sm" 
            className="gap-2 text-xs h-8 px-4 font-bold shadow-md shadow-accent/20" 
            onClick={handleExportVideo} 
            disabled={isRendering}
          >
            {isRendering ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isRendering ? renderProgress : "Export Video"}
          </Button>
        </div>
      </header>

      {/* Main 3-Column Split Body: Left Caption Editor + Center Video Preview + Right Templates Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Caption Editor */}
        <CaptionEditorPanel 
          duration={duration}
          onSeek={handleSeek}
          onTranscribe={initiateTranscription}
          isTranscribing={isTranscribing}
          transcribeProgress={transcribeProgress}
        />

        {/* Center Panel: Real Video Preview */}
        <VideoPreview 
          duration={duration}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={setVideoDuration}
          onSeek={handleSeek}
          videoRef={videoRef}
        />

        {/* Right Panel: Templates, Customize & Text Sidebar */}
        <RightSidebarPanel />
      </div>

      {/* Bottom Timeline Section (Functional & Connected) */}
      <footer className="h-56 shrink-0 border-t border-border bg-bg-panel flex flex-col z-20">
        {/* Timeline Header Toolbar */}
        <div className="h-9 border-b border-border flex items-center justify-between px-4 bg-bg-primary/70 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded hover:bg-bg-control text-text-primary hover:text-accent transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="font-mono text-xs text-text-secondary">
              <span className="text-accent font-bold">{currentTime.toFixed(2)}s</span>
              <span className="mx-1 text-text-muted">/</span>
              <span>{duration.toFixed(2)}s</span>
            </div>
          </div>

          {/* Timeline Zoom */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <button
              onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
              className="p-1 hover:bg-bg-control rounded text-text-muted hover:text-text-primary"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-[11px] w-8 text-center">{timelineZoom.toFixed(1)}x</span>
            <button
              onClick={() => setTimelineZoom(Math.min(3.0, timelineZoom + 0.25))}
              className="p-1 hover:bg-bg-control rounded text-text-muted hover:text-text-primary"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        {/* Timeline Tracks Area */}
        <div 
          ref={timelineRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft
            const clickRatio = Math.max(0, Math.min(1, clickX / rect.width))
            handleSeek(clickRatio * duration)
          }}
          className="flex-1 relative overflow-x-auto overflow-y-hidden select-none bg-[#0B0B0D] cursor-pointer"
        >
          {/* Time Ruler */}
          <div className="h-5 border-b border-border/80 bg-bg-control/70 sticky top-0 flex items-end px-2 text-[9px] text-text-muted font-mono">
            {[...Array(20)].map((_, i) => {
              const tick = (duration / 20) * i
              return (
                <div key={i} className="flex-1 border-l border-border/40 pl-1 pb-0.5 h-full">
                  {tick.toFixed(1)}s
                </div>
              )
            })}
          </div>

          {/* Scrub Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-accent z-30 pointer-events-none shadow-[0_0_8px_rgba(255,184,0,0.9)]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-accent shadow-md" />
          </div>

          <div className="p-3 space-y-2 relative">
            {/* Audio Track Visualizer */}
            <div className="h-8 bg-bg-panel/70 rounded-lg border border-border/50 relative overflow-hidden flex items-center">
              <div className="absolute left-2 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                Audio
              </div>
              <div className="w-full h-full opacity-20 flex items-center gap-0.5 px-14">
                {[...Array(120)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-text-secondary rounded-full" 
                    style={{ height: `${Math.max(15, Math.abs(Math.sin(i * 0.25)) * 75 + ((i * 13) % 20))}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Captions Track */}
            <div className="h-12 bg-bg-panel/70 rounded-lg border border-border/50 relative overflow-hidden">
              <div className="absolute left-2 top-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                Captions
              </div>

              {/* Positioned Caption Blocks */}
              {captions.map((cap) => {
                const leftPercent = (cap.start / duration) * 100
                const widthPercent = Math.max(1.5, ((cap.end - cap.start) / duration) * 100)
                const isSelected = selectedCaptionId === cap.id
                const isActiveNow = currentTime >= cap.start && currentTime < cap.end

                return (
                  <div
                    key={cap.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCaptionId(cap.id)
                      handleSeek(cap.start)
                    }}
                    className={`absolute top-2 bottom-2 rounded-md text-[10px] font-medium border flex items-center px-1.5 overflow-hidden transition-colors cursor-pointer ${
                      isActiveNow
                        ? "bg-accent/25 border-accent text-accent ring-1 ring-accent font-bold"
                        : isSelected
                        ? "bg-accent/15 border-accent/60 text-text-primary"
                        : "bg-bg-control border-border text-text-secondary hover:border-text-muted"
                    }`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`${formatClockTime(cap.start)} - ${formatClockTime(cap.end)}: ${cap.text}`}
                  >
                    <span className="truncate">{cap.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
