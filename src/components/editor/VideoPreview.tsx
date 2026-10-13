import React, { useRef, useState, useEffect } from "react"
import { Play, Loader2, AlertTriangle, Upload, ZoomIn, ZoomOut } from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import { CaptionOverlay } from "./CaptionOverlay"
import { VideoPlayerControls } from "./VideoPlayerControls"

interface VideoPreviewProps {
  duration: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSeek: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  duration,
  onTimeUpdate,
  onDurationChange,
  onSeek,
  videoRef,
}) => {
  const { 
    video, 
    setVideo,
    isPlaying, 
    setIsPlaying, 
    currentTime, 
    aspectRatio, 
    setAspectRatio,
    playbackSpeed, 
    volume, 
    isMuted 
  } = useEditorStore()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1.0)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync playback speed and volume with HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
      videoRef.current.volume = isMuted ? 0 : volume
    }
  }, [playbackSpeed, volume, isMuted, videoRef])

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0
      onDurationChange(dur)
      setVideo({
        duration: dur,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      })
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
      const url = URL.createObjectURL(file)
      setVideo({ file, url })
    }
  }

  // Calculate container dimensions for aspect ratios
  // 9:16 -> 360x640, 16:9 -> 640x360, 1:1 -> 440x440, 4:5 -> 384x480
  const aspectDimensions = {
    "9:16": "w-[360px] h-[640px]",
    "16:9": "w-[640px] h-[360px]",
    "1:1": "w-[440px] h-[440px]",
    "4:5": "w-[384px] h-[480px]",
  }[aspectRatio] || "w-[360px] h-[640px]"

  return (
    <section className="flex-1 flex flex-col bg-[#0B0B0D] relative items-center justify-center p-6 overflow-hidden select-none">
      {/* Top Controls: Aspect Ratio & Zoom Toolbar */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-30 pointer-events-auto">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-bg-panel/90 border border-border rounded-lg p-0.5 shadow-lg backdrop-blur-md">
          {(["9:16", "16:9", "1:1", "4:5"] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                aspectRatio === ratio
                  ? "bg-accent text-black shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {ratio === "9:16" ? "9:16 (Reels)" : ratio === "16:9" ? "16:9 (Landscape)" : ratio === "1:1" ? "1:1 (Square)" : "4:5 (Post)"}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-bg-panel/90 border border-border rounded-lg shadow-lg overflow-hidden backdrop-blur-md">
          <button
            onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.15))}
            className="p-1.5 hover:bg-bg-control text-text-muted hover:text-text-primary transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="px-2 font-mono text-[11px] text-text-secondary border-x border-border">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale(Math.min(1.8, zoomScale + 0.15))}
            className="p-1.5 hover:bg-bg-control text-text-muted hover:text-text-primary transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* Responsive Video Container with Scaled Box */}
      <div 
        ref={containerRef}
        style={{
          transform: `scale(${zoomScale})`,
          transition: "transform 0.15s ease-out"
        }}
        className={`relative ${aspectDimensions} bg-black rounded-2xl shadow-2xl border border-border/70 overflow-hidden flex items-center justify-center group`}
      >
        {video.url ? (
          <>
            <video
              ref={videoRef}
              src={video.url}
              className="w-full h-full object-contain cursor-pointer"
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
            />

            {/* Subtitles Overlay */}
            <CaptionOverlay currentTime={currentTime} />

            {/* Centered Play Button when Paused */}
            {!isPlaying && !isLoading && !errorMessage && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/25 z-10 cursor-pointer"
                onClick={() => setIsPlaying(true)}
              >
                <div className="w-16 h-16 rounded-full bg-accent text-black flex items-center justify-center opacity-95 shadow-2xl hover:scale-105 transition-transform">
                  <Play size={28} className="ml-1" />
                </div>
              </div>
            )}

            {/* Bottom Embedded Player Controls */}
            <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              <VideoPlayerControls 
                duration={duration} 
                onSeek={onSeek} 
              />
            </div>
          </>
        ) : (
          /* Empty / Upload Prompt State */
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-bg-control flex items-center justify-center text-accent border border-border">
              <Upload size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-1">No Video Loaded</h3>
              <p className="text-xs text-text-muted max-w-xs">
                Upload your MP4, MOV, or WebM video to edit and preview captions in real time.
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
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-black text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              Choose Video File
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-30">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="absolute inset-x-4 top-4 bg-red-950/80 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200 text-xs z-30">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  )
}
