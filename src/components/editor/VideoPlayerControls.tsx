import React, { useRef } from "react"
import { 
  Play, Pause, Volume2, VolumeX, Maximize
} from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import { formatClockTime } from "@/lib/timeUtils"

interface VideoPlayerControlsProps {
  duration: number;
  onSeek: (time: number) => void;
  onToggleFullscreen?: () => void;
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  duration,
  onSeek,
  onToggleFullscreen,
}) => {
  const { 
    currentTime, 
    isPlaying, 
    setIsPlaying, 
    playbackSpeed, 
    setPlaybackSpeed, 
    volume, 
    setVolume, 
    isMuted, 
    setIsMuted 
  } = useEditorStore()

  const progressRef = useRef<HTMLDivElement>(null)

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(pos * duration)
  }

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (val > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 z-30 select-none">
      {/* Scrubbable Progress Bar */}
      <div 
        ref={progressRef}
        onClick={handleProgressBarClick}
        className="w-full h-1.5 hover:h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer relative transition-all group"
      >
        <div 
          className="h-full bg-accent rounded-full relative"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between text-xs text-text-primary">
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-text-primary hover:text-accent transition-colors"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>

          {/* Time Display */}
          <div className="font-mono text-xs text-text-secondary">
            <span className="text-text-primary font-semibold">{formatClockTime(currentTime)}</span>
            <span className="mx-1 text-text-muted">/</span>
            <span>{formatClockTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5 group/vol">
            <button
              onClick={handleVolumeToggle}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 accent-accent bg-white/20 rounded-full cursor-pointer opacity-80 hover:opacity-100"
            />
          </div>

          {/* Playback Speed */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-bg-control/90 border border-border/80 text-[11px] rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="text-text-muted hover:text-text-primary transition-colors"
              title="Fullscreen"
            >
              <Maximize size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
