import React, { useState } from "react"
import { Trash2, Split, AlertCircle, Play } from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import type { CaptionSegment } from "@/stores/editorStore"
import { formatTimestamp, parseTimestamp } from "@/lib/timeUtils"

interface CaptionItemProps {
  caption: CaptionSegment;
  index: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const CaptionItem: React.FC<CaptionItemProps> = ({
  caption,
  index,
  duration,
  onSeek,
}) => {
  const { 
    selectedCaptionId, 
    setSelectedCaptionId, 
    updateCaption, 
    deleteCaption, 
    splitCaptionAtWord,
    currentTime 
  } = useEditorStore()

  const isSelected = selectedCaptionId === caption.id
  const isActive = currentTime >= caption.start && currentTime < caption.end

  const [prevStart, setPrevStart] = useState(caption.start)
  const [prevEnd, setPrevEnd] = useState(caption.end)
  const [startStr, setStartStr] = useState(formatTimestamp(caption.start))
  const [endStr, setEndStr] = useState(formatTimestamp(caption.end))
  const [timeError, setTimeError] = useState<string | null>(null)

  if (caption.start !== prevStart) {
    setPrevStart(caption.start)
    setStartStr(formatTimestamp(caption.start))
    setTimeError(null)
  }
  if (caption.end !== prevEnd) {
    setPrevEnd(caption.end)
    setEndStr(formatTimestamp(caption.end))
    setTimeError(null)
  }

  const handleStartBlur = () => {
    const parsed = parseTimestamp(startStr)
    if (parsed === null) {
      setTimeError("Invalid time format (use MM:SS.cs)")
      setStartStr(formatTimestamp(caption.start))
      return
    }
    if (parsed < 0) {
      setTimeError("Start time must be ≥ 0")
      setStartStr(formatTimestamp(caption.start))
      return
    }
    if (parsed >= caption.end) {
      setTimeError("Start must be before End")
      setStartStr(formatTimestamp(caption.start))
      return
    }
    setTimeError(null)
    updateCaption(caption.id, { start: parsed })
  }

  const handleEndBlur = () => {
    const parsed = parseTimestamp(endStr)
    if (parsed === null) {
      setTimeError("Invalid time format (use MM:SS.cs)")
      setEndStr(formatTimestamp(caption.end))
      return
    }
    if (parsed <= caption.start) {
      setTimeError("End must be after Start")
      setEndStr(formatTimestamp(caption.end))
      return
    }
    if (duration > 0 && parsed > duration + 1) {
      setTimeError("End exceeds video duration")
      setEndStr(formatTimestamp(caption.end))
      return
    }
    setTimeError(null)
    updateCaption(caption.id, { end: parsed })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateCaption(caption.id, { text: e.target.value })
  }

  return (
    <div
      onClick={() => {
        setSelectedCaptionId(caption.id)
        onSeek(caption.start)
      }}
      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer select-none ${
        isActive
          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(255,184,0,0.15)] ring-1 ring-accent"
          : isSelected
          ? "border-accent/60 bg-bg-control ring-1 ring-accent/30"
          : "border-border bg-bg-panel hover:border-[#3E3E47] hover:bg-bg-panel/90"
      }`}
    >
      {/* Header: Numbering & Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
            isActive ? "bg-accent text-black font-extrabold" : "bg-bg-control text-text-muted"
          }`}>
            Caption {index + 1}
          </span>

          {isActive && (
            <span className="flex items-center gap-1 text-[10px] text-accent font-semibold uppercase tracking-wider animate-pulse">
              <Play size={10} className="fill-accent" /> Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSeek(caption.start)}
            title="Seek to caption start"
            className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-control transition-colors"
          >
            <Play size={13} />
          </button>
          <button
            onClick={() => deleteCaption(caption.id)}
            title="Delete this caption"
            className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-bg-control transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Timestamp Editor */}
      <div 
        className="flex items-center gap-2 text-xs font-mono mb-2.5 text-text-secondary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-bg-control border border-border/80 rounded-md px-2 py-1 focus-within:border-accent">
          <span className="text-[10px] text-text-muted uppercase font-sans font-semibold">Start:</span>
          <input
            type="text"
            value={startStr}
            onChange={(e) => setStartStr(e.target.value)}
            onBlur={handleStartBlur}
            onKeyDown={(e) => e.key === "Enter" && handleStartBlur()}
            className="w-16 bg-transparent text-text-primary text-xs focus:outline-none font-mono"
            placeholder="00:00.00"
          />
        </div>

        <span className="text-text-muted">→</span>

        <div className="flex items-center gap-1 bg-bg-control border border-border/80 rounded-md px-2 py-1 focus-within:border-accent">
          <span className="text-[10px] text-text-muted uppercase font-sans font-semibold">End:</span>
          <input
            type="text"
            value={endStr}
            onChange={(e) => setEndStr(e.target.value)}
            onBlur={handleEndBlur}
            onKeyDown={(e) => e.key === "Enter" && handleEndBlur()}
            className="w-16 bg-transparent text-text-primary text-xs focus:outline-none font-mono"
            placeholder="00:00.00"
          />
        </div>
      </div>

      {/* Validation Message */}
      {timeError && (
        <div className="flex items-center gap-1 text-[11px] text-red-400 mb-2">
          <AlertCircle size={12} />
          <span>{timeError}</span>
        </div>
      )}

      {/* Caption Text Input (Controlled, Does not seek on change) */}
      <div onClick={(e) => e.stopPropagation()}>
        <textarea
          rows={2}
          value={caption.text}
          onChange={handleTextChange}
          placeholder="Enter caption text..."
          className="w-full resize-none rounded-lg bg-bg-control border border-border/60 p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
        />
      </div>

      {/* Word-level chips (if available) */}
      {caption.words && caption.words.length > 1 && (
        <div className="mt-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
          <div className="text-[9px] uppercase font-bold tracking-wider text-text-muted mb-1 flex items-center justify-between">
            <span>Word Timings</span>
            <span>click to split</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {caption.words.map((w, widx) => {
              const isWordActive = currentTime >= w.start && currentTime < w.end
              return (
                <div
                  key={w.id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                    isWordActive 
                      ? "bg-accent text-black font-bold border-accent" 
                      : "bg-bg-control text-text-secondary border-border/60"
                  }`}
                >
                  <span>{w.text}</span>
                  {widx > 0 && (
                    <button
                      onClick={() => splitCaptionAtWord(caption.id, w.id)}
                      title={`Split caption before "${w.text}"`}
                      className="opacity-50 hover:opacity-100 hover:text-accent ml-0.5"
                    >
                      <Split size={9} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
