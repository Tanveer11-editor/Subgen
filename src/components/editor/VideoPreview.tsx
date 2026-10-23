import React, { useRef, useState, useEffect } from "react"
import {
  Play, Loader2, AlertTriangle, Upload, ZoomIn, ZoomOut,
  Grid, Smartphone, Maximize
} from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import { CaptionOverlay } from "./CaptionOverlay"
import { VideoPlayerControls } from "./VideoPlayerControls"

interface VideoPreviewProps {
  duration: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSeek: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoadNewVideo?: (file: File) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  duration,
  onTimeUpdate,
  onDurationChange,
  onSeek,
  videoRef,
  onLoadNewVideo,
}) => {
  const {
    video,
    setVideo,
    isPlaying,
    setIsPlaying,
    isReversing,
    currentTime,
    aspectRatio,
    setAspectRatio,
    playbackSpeed,
    volume,
    isMuted,
    trimStart,
    trimEnd,
    setTrimRange,
    loadNewVideo
  } = useEditorStore()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1.0)
  const [showGrid, setShowGrid] = useState(false)
  const [showPhoneFrame, setShowPhoneFrame] = useState(true)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. FORWARD PLAYBACK SYNC
  useEffect(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      // Synchronize video currentTime to store currentTime if they diverge
      const storeTime = useEditorStore.getState().currentTime
      if (Math.abs(videoRef.current.currentTime - storeTime) > 0.08) {
        try {
          videoRef.current.currentTime = storeTime
        } catch {}
      }
      videoRef.current.playbackRate = playbackSpeed
      videoRef.current.volume = isMuted ? 0 : volume
      videoRef.current.play().catch(() => setIsPlaying(false))
    } else if (!isReversing) {
      videoRef.current.pause()
    }
  }, [isPlaying, isReversing, playbackSpeed, volume, isMuted, setIsPlaying, videoRef])

  // 1b. SEEK & FRAME SYNC (Keep HTML5 video frame synced with store currentTime)
  useEffect(() => {
    if (!videoRef.current) return

    if (!isPlaying && !isReversing) {
      // While paused, keep video frame synced so clicking timeline updates preview frame immediately
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.04) {
        try {
          videoRef.current.currentTime = currentTime
        } catch {}
      }
    } else if (isPlaying) {
      // While playing, if user clicked a jump point on timeline (>0.35s jump)
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.35) {
        try {
          videoRef.current.currentTime = currentTime
        } catch {}
      }
    }
  }, [currentTime, isPlaying, isReversing, videoRef])

  // 2. REVERSE PLAYBACK ENGINE (Using requestAnimationFrame)
  useEffect(() => {
    if (!isReversing) return

    if (videoRef.current) {
      videoRef.current.pause()
    }

    let lastTimestamp = performance.now()
    let animationFrameId: number

    const stepReverse = (now: number) => {
      const dt = (now - lastTimestamp) / 1000
      lastTimestamp = now

      const nextTime = currentTime - dt * playbackSpeed
      if (nextTime <= trimStart) {
        // Loop back to trimEnd or video duration
        const effectiveEnd = (trimEnd > trimStart && trimEnd > 0) ? trimEnd : (duration > 0 ? duration : 13.2)
        if (videoRef.current) videoRef.current.currentTime = effectiveEnd
        onTimeUpdate(effectiveEnd)
      } else {
        if (videoRef.current) {
          videoRef.current.currentTime = nextTime
        }
        onTimeUpdate(nextTime)
      }

      animationFrameId = requestAnimationFrame(stepReverse)
    }

    animationFrameId = requestAnimationFrame(stepReverse)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isReversing, currentTime, playbackSpeed, trimStart, trimEnd, onTimeUpdate, duration, videoRef])

  // 3. TRIM BOUNDS CLAMPING
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime

    const maxBound = (trimEnd > trimStart && trimEnd > 0)
      ? trimEnd
      : (videoRef.current.duration > 0 ? videoRef.current.duration : (duration > 0 ? duration : Infinity))

    // Check if forward play hit trimEnd or video end
    if (isPlaying && cur >= maxBound) {
      videoRef.current.pause()
      videoRef.current.currentTime = trimStart
      onTimeUpdate(trimStart)
      setIsPlaying(false)
      return
    }

    onTimeUpdate(cur)
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 13.2
      onDurationChange(dur)
      setVideo({
        duration: dur,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      })
      if (!trimEnd || trimEnd <= 0 || trimEnd === 13.2 || trimEnd > dur) {
        setTrimRange(0, dur)
      }
      setIsLoading(false)
      setErrorMessage(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert("Please upload a valid video file.")
        return
      }
      if (onLoadNewVideo) {
        onLoadNewVideo(file)
      } else {
        loadNewVideo(file)
      }
    }
    if (e.target) e.target.value = ""
  }

  // Aspect ratio dimensions
  const aspectDimensions = {
    "9:16": "w-[360px] h-[640px]",
    "original": "w-[360px] h-[640px]",
    "16:9": "w-[640px] h-[360px]",
    "1:1": "w-[440px] h-[440px]",
    "4:5": "w-[384px] h-[480px]",
  }[aspectRatio] || "w-[360px] h-[640px]"

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDraggingOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
          if (!file.type.startsWith("video/")) {
            alert("Please drop a valid video file.")
            return
          }
          if (onLoadNewVideo) {
            onLoadNewVideo(file)
          } else {
            loadNewVideo(file)
          }
        }
      }}
      className="flex-1 flex flex-col bg-[#08080A] relative items-center justify-center p-6 overflow-hidden select-none"
    >
      {/* Drag & Drop Over Video Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 border-2 border-dashed border-accent m-4 rounded-2xl animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent mb-3 animate-bounce">
            <Upload size={32} />
          </div>
          <p className="text-base font-extrabold text-white">Drop your new video here</p>
          <p className="text-xs text-text-muted mt-1">Instantly replaces current video & auto-regenerates captions</p>
        </div>
      )}

      {/* Top Header Toolbar: Aspect Ratio & Canvas Controls (Matching Captik PREVIEW header) */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-30 pointer-events-auto">
        {/* Left: PREVIEW label & Aspect Ratio Switcher */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-black tracking-widest text-[#6E6E78] uppercase">
            PREVIEW
          </span>

          <div className="flex items-center bg-[#14141A] border border-[#262633] rounded-lg p-0.5 shadow-lg backdrop-blur-md">
            {(["original", "9:16", "16:9", "1:1", "4:5"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  aspectRatio === ratio
                    ? "bg-accent text-black shadow-sm font-bold"
                    : "text-[#8E8E98] hover:text-white"
                }`}
              >
                {ratio === "original" ? "Original" : ratio}
              </button>
            ))}
          </div>

          {/* Replace / Upload Video Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#14141A] hover:bg-[#1E1E28] border border-[#262633] hover:border-accent/60 text-[#D4D4D8] hover:text-white rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95"
            title="Upload a new video to replace and regenerate captions"
          >
            <Upload size={12} className="text-accent" />
            <span>Replace Video</span>
          </button>
        </div>

        {/* Right: Zoom & Preview Tools (Zoom %, Grid, Mobile frame, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Zoom % */}
          <div className="flex items-center bg-[#14141A] border border-[#262633] rounded-lg shadow-lg overflow-hidden backdrop-blur-md">
            <button
              onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.15))}
              className="p-1.5 hover:bg-[#1E1E28] text-[#8E8E98] hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-2 font-mono text-[11px] text-[#A1A1AA] border-x border-[#262633]">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(Math.min(1.8, zoomScale + 0.15))}
              className="p-1.5 hover:bg-[#1E1E28] text-[#8E8E98] hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Alignment Grid"
            className={`p-1.5 rounded-lg border transition-colors ${
              showGrid
                ? "bg-accent text-black border-accent"
                : "bg-[#14141A] border-[#262633] text-[#8E8E98] hover:text-white"
            }`}
          >
            <Grid size={15} />
          </button>

          {/* Mobile Frame Toggle */}
          <button
            onClick={() => setShowPhoneFrame(!showPhoneFrame)}
            title="Toggle Mobile Screen Frame"
            className={`p-1.5 rounded-lg border transition-colors ${
              showPhoneFrame
                ? "bg-accent text-black border-accent"
                : "bg-[#14141A] border-[#262633] text-[#8E8E98] hover:text-white"
            }`}
          >
            <Smartphone size={15} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => {
              if (containerRef.current) {
                if (document.fullscreenElement) {
                  document.exitFullscreen()
                } else {
                  containerRef.current.requestFullscreen?.()
                }
              }
            }}
            title="Fullscreen"
            className="p-1.5 rounded-lg bg-[#14141A] border border-[#262633] text-[#8E8E98] hover:text-white transition-colors"
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>

      {/* Main Video Screen Container with Scaled Box */}
      <div
        ref={containerRef}
        style={{
          transform: `scale(${zoomScale})`,
          transition: "transform 0.15s ease-out"
        }}
        className={`relative ${aspectDimensions} bg-black rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-[#272733] overflow-hidden flex items-center justify-center group`}
      >
        {video.url ? (
          <>
            {/* HTML5 Video Element */}
            <video
              ref={videoRef}
              src={video.url}
              className="w-full h-full object-cover cursor-pointer"
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false)
                setErrorMessage("Unable to play video format.")
              }}
              onClick={() => setIsPlaying(!isPlaying)}
              playsInline
              loop={false}
            />

            {/* Alignment Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            )}

            {/* Subtitles Overlay */}
            <CaptionOverlay currentTime={currentTime} />

            {/* Center Play Indicator when Paused */}
            {!isPlaying && !isReversing && !isLoading && !errorMessage && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 cursor-pointer"
                onClick={() => setIsPlaying(true)}
              >
                <div className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95">
                  <Play size={26} className="ml-0.5 fill-black" />
                </div>
              </div>
            )}

            {/* Reverse Playback Floating Badge */}
            {isReversing && (
              <div className="absolute top-4 left-4 z-30 bg-black/80 border border-accent text-accent px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl animate-pulse">
                <span>◀◀ Reverse Play ({playbackSpeed}x)</span>
              </div>
            )}

            {/* Bottom Embedded Player Controls */}
            <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto z-30">
              <VideoPlayerControls
                duration={duration}
                onSeek={onSeek}
              />
            </div>
          </>
        ) : (
          /* Empty / Upload Prompt State */
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#181820] flex items-center justify-center text-accent border border-[#272733]">
              <Upload size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">No Video Loaded</h3>
              <p className="text-xs text-[#8E8E98] max-w-xs">
                Upload your video to edit, adjust word timings, and trim clips in real-time.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-accent hover:bg-[#FFC425] text-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              Choose Video File
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-30">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="absolute inset-x-4 top-4 bg-red-950/90 border border-red-500/50 rounded-xl p-3 flex items-center gap-2 text-red-200 text-xs z-30">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  )
}
