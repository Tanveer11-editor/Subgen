import React, { useRef, useState, useEffect, useCallback } from "react"
import { 
  Play, Pause, RotateCcw, RotateCw, Trash2, 
  Scissors, MousePointer, Magnet, ZoomIn, ZoomOut,
  SkipBack, SkipForward, Volume2, Split
} from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import type { PauseMode } from "@/stores/editorStore"

interface DragState {
  type: "word-start" | "word-end" | "word-move" | "trim-start" | "trim-end" | "playhead";
  segmentId?: string;
  wordId?: string;
  initialX: number;
  initialStart: number;
  initialEnd: number;
}

export const Timeline: React.FC = () => {
  const {
    video,
    captions,
    currentTime,
    setCurrentTime,
    isPlaying,
    isReversing,
    playbackSpeed,
    togglePlayPause,
    stopPlayback,
    cycleForwardSpeed,
    startReversePlayback,
    activeTool,
    setActiveTool,
    captionDisplayMode,
    setCaptionDisplayMode,
    pauseMode,
    setPauseMode,
    timelineZoom,
    setTimelineZoom,
    trimStart,
    trimEnd,
    setTrimStart,
    setTrimEnd,
    updateWordTiming,
    splitAtPlayhead,
    deleteCaption,
    deleteWord,
    addCaption,
    selectedCaptionId,
    setSelectedCaptionId,
    selectedWordId,
    setSelectedWordId,
    undo,
    redo,
    history,
    historyIndex
  } = useEditorStore()

  const duration = Math.max(1, video.duration || 13.2)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const tracksScrollRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoverCutTime, setHoverCutTime] = useState<number | null>(null)
  const [floatingTooltip, setFloatingTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, 1800)
  }, [])

  // Pixels per second based on zoom: base 60px/s * zoom
  const pxPerSec = 70 * timelineZoom
  const totalTimelineWidth = Math.max(1200, duration * pxPerSec + 200)

  // -------------------------------------------------------------
  // KEYBOARD SHORTCUTS: Space, J, K, L, B, A, Ctrl+Z, Ctrl+Shift+Z
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in any input, textarea or contenteditable element, do not hijack editing keys
      const target = e.target as HTMLElement | null
      const isInput = target && (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable
      )

      // Allow Ctrl+Z / Cmd+Z and Ctrl+Shift+Z globally if not in an input
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
            showToast("Redo (Ctrl+Shift+Z)")
          } else {
            undo()
            showToast("Undo (Ctrl+Z)")
          }
          return
        }
        if (e.key.toLowerCase() === "y") {
          e.preventDefault()
          redo()
          showToast("Redo (Ctrl+Y)")
          return
        }
      }

      if (isInput) return

      // Single-key shortcuts
      switch (e.code) {
        case "Space":
          e.preventDefault()
          togglePlayPause()
          showToast(isPlaying || isReversing ? "Paused" : "Playing (Space)")
          break

        case "KeyJ":
          e.preventDefault()
          startReversePlayback()
          showToast(`Reverse Play (J)`)
          break

        case "KeyK":
          e.preventDefault()
          stopPlayback()
          showToast("Stop / Pause (K)")
          break

        case "KeyL":
          e.preventDefault()
          cycleForwardSpeed()
          showToast(`Forward Play ${playbackSpeed}x (L)`)
          break

        case "KeyB":
          e.preventDefault()
          setActiveTool("blade")
          showToast("Blade Cutting Tool Active (B)")
          break

        case "KeyA":
          e.preventDefault()
          setActiveTool("select")
          showToast("Selection Tool Active (A)")
          break

        case "Delete":
        case "Backspace":
          if (selectedWordId && selectedCaptionId) {
            e.preventDefault()
            deleteWord(selectedCaptionId, selectedWordId)
            showToast("Deleted word")
          } else if (selectedCaptionId) {
            e.preventDefault()
            deleteCaption(selectedCaptionId)
            showToast("Deleted caption")
          }
          break

        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isPlaying, 
    isReversing, 
    playbackSpeed, 
    togglePlayPause, 
    stopPlayback, 
    cycleForwardSpeed, 
    startReversePlayback, 
    setActiveTool, 
    undo, 
    redo, 
    selectedCaptionId, 
    selectedWordId, 
    deleteWord, 
    deleteCaption,
    showToast
  ])

  // Convert pixel position in track container to seconds
  const clientXToSeconds = useCallback((clientX: number): number => {
    if (!tracksScrollRef.current) return 0
    const rect = tracksScrollRef.current.getBoundingClientRect()
    const scrollLeft = tracksScrollRef.current.scrollLeft
    const offsetX = clientX - rect.left + scrollLeft
    const seconds = offsetX / pxPerSec
    return Math.max(0, Math.min(duration, seconds))
  }, [duration, pxPerSec])

  // -------------------------------------------------------------
  // MOUSE DRAGGING FOR WORD RESIZING, WORD MOVING, TRIM, & PLAYHEAD
  // -------------------------------------------------------------
  const handlePointerDown = (
    e: React.PointerEvent,
    type: DragState["type"],
    segmentId?: string,
    wordId?: string,
    initialStart = 0,
    initialEnd = 0
  ) => {
    e.stopPropagation()
    e.preventDefault()
    setDragState({
      type,
      segmentId,
      wordId,
      initialX: e.clientX,
      initialStart,
      initialEnd,
    })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) {
      if (activeTool === "blade") {
        const time = clientXToSeconds(e.clientX)
        setHoverCutTime(time)
      } else {
        setHoverCutTime(null)
      }
      return
    }

    const deltaX = e.clientX - dragState.initialX
    const deltaSeconds = deltaX / pxPerSec

    if (dragState.type === "playhead") {
      const newTime = clientXToSeconds(e.clientX)
      setCurrentTime(newTime)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `${newTime.toFixed(2)}s`
      })
    } else if (dragState.type === "word-start" && dragState.segmentId && dragState.wordId) {
      const newStart = Math.max(0, Math.min(dragState.initialEnd - 0.1, dragState.initialStart + deltaSeconds))
      updateWordTiming(dragState.segmentId, dragState.wordId, newStart, dragState.initialEnd)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `Start: ${newStart.toFixed(2)}s`
      })
    } else if (dragState.type === "word-end" && dragState.segmentId && dragState.wordId) {
      const newEnd = Math.max(dragState.initialStart + 0.1, Math.min(duration, dragState.initialEnd + deltaSeconds))
      updateWordTiming(dragState.segmentId, dragState.wordId, dragState.initialStart, newEnd)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `End: ${newEnd.toFixed(2)}s`
      })
    } else if (dragState.type === "word-move" && dragState.segmentId && dragState.wordId) {
      const dur = dragState.initialEnd - dragState.initialStart
      const newStart = Math.max(0, Math.min(duration - dur, dragState.initialStart + deltaSeconds))
      const newEnd = newStart + dur
      updateWordTiming(dragState.segmentId, dragState.wordId, newStart, newEnd)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `${newStart.toFixed(2)}s - ${newEnd.toFixed(2)}s (${dur.toFixed(2)}s)`
      })
    } else if (dragState.type === "trim-start") {
      const newTrimStart = Math.max(0, Math.min(trimEnd - 0.5, dragState.initialStart + deltaSeconds))
      setTrimStart(newTrimStart)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `Trim Start: ${newTrimStart.toFixed(2)}s`
      })
    } else if (dragState.type === "trim-end") {
      const newTrimEnd = Math.max(trimStart + 0.5, Math.min(duration, dragState.initialEnd + deltaSeconds))
      setTrimEnd(newTrimEnd)
      setFloatingTooltip({
        x: e.clientX,
        y: e.clientY - 35,
        text: `Trim End: ${newTrimEnd.toFixed(2)}s`
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
      setDragState(null)
      setFloatingTooltip(null)
    }
  }

  // Seek on track click (if not cutting with blade)
  const handleTimelineClick = (e: React.MouseEvent) => {
    const time = clientXToSeconds(e.clientX)
    if (activeTool === "blade") {
      splitAtPlayhead(time)
      showToast(`Cut at ${time.toFixed(2)}s`)
    } else {
      setCurrentTime(time)
    }
  }

  // Format mm:ss or mm:ss.ms
  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const formatClockFull = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    const cs = Math.floor((seconds % 1) * 10).toString()
    return `${m}:${s}.${cs}`
  }

  // Navigation: skip to next / previous cut
  const handleSkipPrev = () => {
    const allStarts = captions.map(c => c.start).sort((a, b) => a - b)
    const prev = allStarts.reverse().find(t => t < currentTime - 0.2)
    if (prev !== undefined) {
      setCurrentTime(prev)
    } else {
      setCurrentTime(trimStart)
    }
  }

  const handleSkipNext = () => {
    const allStarts = captions.map(c => c.start).sort((a, b) => a - b)
    const next = allStarts.find(t => t > currentTime + 0.2)
    if (next !== undefined) {
      setCurrentTime(next)
    } else {
      setCurrentTime(trimEnd)
    }
  }

  // Flatten words for the word-level timeline blocks
  const allWordBlocks = captions.flatMap((cap) => 
    (cap.words && cap.words.length > 0)
      ? cap.words.map(w => ({ ...w, parentCaption: cap }))
      : [{
          id: `w-${cap.id}`,
          text: cap.text,
          start: cap.start,
          end: cap.end,
          segmentId: cap.id,
          parentCaption: cap
        }]
  )

  return (
    <footer 
      ref={timelineContainerRef}
      className="h-[235px] shrink-0 border-t border-[#27272D] bg-[#0E0E12] flex flex-col z-20 select-none relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#1C1C22]/90 border border-accent/40 text-accent font-semibold text-xs px-3 py-1 rounded-full shadow-lg z-50 pointer-events-none animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Floating Tooltip during drag */}
      {floatingTooltip && (
        <div 
          className="fixed pointer-events-none z-50 bg-[#141418] border border-accent text-accent font-mono text-[11px] px-2 py-0.5 rounded shadow-xl -translate-x-1/2 font-bold"
          style={{ left: floatingTooltip.x, top: floatingTooltip.y }}
        >
          {floatingTooltip.text}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP TRANSPORT & TOOLBAR BAR (Matching Captik UI)        */}
      {/* ========================================================= */}
      <div className="h-10 border-b border-[#23232A] flex items-center justify-between px-3 bg-[#121217] shrink-0 gap-2">
        {/* Left: Transport controls (Prev, Play/Pause, Next, Undo, Redo, Delete) */}
        <div className="flex items-center gap-1.5">
          {/* Skip Prev */}
          <button
            onClick={handleSkipPrev}
            title="Jump to previous caption (|<)"
            className="p-1.5 rounded-md hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-white transition-colors"
          >
            <SkipBack size={15} />
          </button>

          {/* Big Yellow Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
            className="w-7 h-7 rounded-full bg-accent hover:bg-[#FFC425] flex items-center justify-center text-black shadow-md shadow-accent/25 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause size={14} className="fill-black stroke-black" />
            ) : (
              <Play size={14} className="ml-0.5 fill-black stroke-black" />
            )}
          </button>

          {/* Skip Next */}
          <button
            onClick={handleSkipNext}
            title="Jump to next caption (>|)"
            className="p-1.5 rounded-md hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-white transition-colors"
          >
            <SkipForward size={15} />
          </button>

          <span className="h-4 w-px bg-[#2B2B36] mx-1" />

          {/* Undo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-white disabled:opacity-30 transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded-md hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-white disabled:opacity-30 transition-colors"
          >
            <RotateCw size={14} />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (selectedWordId && selectedCaptionId) {
                deleteWord(selectedCaptionId, selectedWordId)
              } else if (selectedCaptionId) {
                deleteCaption(selectedCaptionId)
              }
            }}
            disabled={!selectedCaptionId}
            title="Delete Selected Item (Delete)"
            className="p-1.5 rounded-md hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-red-400 disabled:opacity-30 transition-colors"
          >
            <Trash2 size={14} />
          </button>

          <span className="h-4 w-px bg-[#2B2B36] mx-1" />

          {/* Mode Selector: Keep pauses, Natural, Tight */}
          <div className="flex items-center bg-[#17171F] p-0.5 rounded-lg border border-[#272733]">
            {(["keep", "natural", "tight"] as PauseMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setPauseMode(mode)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  pauseMode === mode
                    ? "bg-[#D97706] text-white shadow-sm font-bold"
                    : "text-[#8E8E98] hover:text-white"
                }`}
              >
                {mode === "keep" ? "Keep pauses" : mode === "natural" ? "Natural" : "Tight"}
              </button>
            ))}
          </div>

          <span className="h-4 w-px bg-[#2B2B36] mx-1" />

          {/* Captions Mode: WORD | LINE (User requested!) */}
          <div className="flex items-center bg-[#17171F] p-0.5 rounded-lg border border-[#272733]">
            <button
              onClick={() => {
                setCaptionDisplayMode("word")
                showToast("Word Mode: Single Word Captions Pop")
              }}
              title="Single Word Mode"
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                captionDisplayMode === "word"
                  ? "bg-accent text-black shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              WORD
            </button>
            <button
              onClick={() => {
                setCaptionDisplayMode("line")
                showToast("Line Mode: Multi-word / Double Line Captions")
              }}
              title="Double Line / Line Mode"
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                captionDisplayMode === "line"
                  ? "bg-accent text-black shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              LINE
            </button>
          </div>

          {/* + Line button */}
          <button
            onClick={() => addCaption(selectedCaptionId || undefined)}
            className="px-2 py-0.5 rounded-md bg-[#1C1C24] hover:bg-[#252530] text-[11px] font-semibold text-[#A1A1AA] hover:text-white border border-[#2B2B36] transition-colors"
            title="Add a new line at playhead"
          >
            + Line
          </button>
        </div>

        {/* Right: Tools (Selection Tool 'A', Cutting Tool 'B', Scissors, Snapping, Timecode, Zoom) */}
        <div className="flex items-center gap-2">
          {/* Active Tool: Selection (A) vs Cutting / Blade (B) */}
          <div className="flex items-center bg-[#17171F] p-0.5 rounded-lg border border-[#272733]">
            <button
              onClick={() => {
                setActiveTool("select")
                showToast("Selection Tool Active (A)")
              }}
              title="Selection Tool (A)"
              className={`p-1 rounded text-xs transition-all flex items-center gap-1 ${
                activeTool === "select"
                  ? "bg-accent text-black font-bold shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              <MousePointer size={13} />
              <span className="text-[10px] font-mono">A</span>
            </button>
            <button
              onClick={() => {
                setActiveTool("blade")
                showToast("Blade Cutting Tool Active (B)")
              }}
              title="Blade Cutting Tool (B)"
              className={`p-1 rounded text-xs transition-all flex items-center gap-1 ${
                activeTool === "blade"
                  ? "bg-accent text-black font-bold shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              <Scissors size={13} />
              <span className="text-[10px] font-mono">B</span>
            </button>
          </div>

          {/* Split at Playhead button */}
          <button
            onClick={() => {
              splitAtPlayhead()
              showToast("Split caption at playhead")
            }}
            title="Split caption at playhead (Scissors)"
            className="p-1 rounded hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-accent transition-colors"
          >
            <Split size={14} />
          </button>

          {/* Magnet / Snapping */}
          <button
            className="p-1 rounded hover:bg-[#1C1C24] text-[#A1A1AA] hover:text-accent transition-colors"
            title="Snapping (On)"
          >
            <Magnet size={14} className="text-accent" />
          </button>

          <span className="h-4 w-px bg-[#2B2B36] mx-1" />

          {/* Playback speed indicator (if reversed or sped up) */}
          {(isReversing || playbackSpeed !== 1.0) && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40 animate-pulse">
              {isReversing ? `◀◀ -${playbackSpeed}x` : `▶▶ ${playbackSpeed}x`}
            </span>
          )}

          {/* Timecode Clock */}
          <div className="font-mono text-xs text-[#8E8E98] flex items-center gap-1 bg-[#17171F] px-2 py-1 rounded-md border border-[#272733]">
            <span className="text-accent font-bold">{formatClock(currentTime)}</span>
            <span className="text-[#555562]">/</span>
            <span>{formatClock(duration)}</span>
          </div>

          <span className="h-4 w-px bg-[#2B2B36] mx-1" />

          {/* Timeline Zoom */}
          <div className="flex items-center gap-1 text-[#8E8E98]">
            <button
              onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
              className="p-1 hover:bg-[#1C1C24] rounded text-[#8E8E98] hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-[11px] w-9 text-center text-white">
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              onClick={() => setTimelineZoom(Math.min(3.0, timelineZoom + 0.25))}
              className="p-1 hover:bg-[#1C1C24] rounded text-[#8E8E98] hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MULTI-TRACK TIMELINE CANVAS                            */}
      {/* ========================================================= */}
      <div 
        ref={tracksScrollRef}
        onClick={handleTimelineClick}
        className={`flex-1 relative overflow-x-auto overflow-y-hidden select-none bg-[#09090C] ${
          activeTool === "blade" ? "cursor-crosshair" : "cursor-pointer"
        }`}
      >
        <div style={{ width: `${totalTimelineWidth}px` }} className="relative h-full flex flex-col">
          {/* A. TIME RULER */}
          <div className="h-6 border-b border-[#23232A] bg-[#121217] sticky top-0 flex items-end text-[10px] text-[#6E6E78] font-mono z-10 pointer-events-none">
            {Array.from({ length: Math.ceil(duration / 2) + 2 }).map((_, i) => {
              const tickSeconds = i * 2
              const leftPx = tickSeconds * pxPerSec
              if (leftPx > totalTimelineWidth) return null

              return (
                <div 
                  key={i} 
                  className="absolute bottom-0 h-4 border-l border-[#2E2E38] pl-1 pb-0.5 flex items-end"
                  style={{ left: `${leftPx}px` }}
                >
                  <span className="text-[9px] text-[#8E8E98]">{formatClock(tickSeconds)}</span>
                </div>
              )
            })}
          </div>

          {/* B. VIDEO TRACK & TRIMMING HANDLES */}
          <div className="h-7 border-b border-[#1E1E26] bg-[#0E0E14] relative flex items-center px-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#6E6E78] shrink-0 w-12 z-10">
              Video
            </span>

            {/* Video Filmstrip Clip Block */}
            <div 
              className="absolute top-1 bottom-1 rounded bg-[#1A1A24] border border-[#2E2E3C] overflow-hidden flex items-center"
              style={{
                left: `${trimStart * pxPerSec}px`,
                width: `${(trimEnd - trimStart) * pxPerSec}px`
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 flex items-center justify-between px-3">
                <span className="text-[9px] font-mono text-text-muted truncate">
                  {video.file?.name || "demo_video.mp4"} • Trim: {formatClockFull(trimStart)} - {formatClockFull(trimEnd)} ({(trimEnd - trimStart).toFixed(1)}s)
                </span>
              </div>
            </div>

            {/* Left Trim Handle (Start Trim Bracket) */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "trim-start", undefined, undefined, trimStart, trimEnd)}
              className="absolute top-0 bottom-0 w-4 bg-[#FFB800] hover:bg-[#FFC526] rounded-l-md flex items-center justify-center cursor-ew-resize z-25 shadow-lg group"
              style={{ left: `${trimStart * pxPerSec - 8}px` }}
              title="Drag to trim video start"
            >
              <div className="w-1 h-3 bg-black rounded-full" />
              <div className="absolute -top-4 text-[9px] font-mono font-bold bg-accent text-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Trim [{formatClockFull(trimStart)}]
              </div>
            </div>

            {/* Right Trim Handle (End Trim Bracket) */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "trim-end", undefined, undefined, trimStart, trimEnd)}
              className="absolute top-0 bottom-0 w-4 bg-[#FFB800] hover:bg-[#FFC526] rounded-r-md flex items-center justify-center cursor-ew-resize z-25 shadow-lg group"
              style={{ left: `${trimEnd * pxPerSec - 4}px` }}
              title="Drag to trim video end"
            >
              <div className="w-1 h-3 bg-black rounded-full" />
              <div className="absolute -top-4 text-[9px] font-mono font-bold bg-accent text-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Trim [{formatClockFull(trimEnd)}]
              </div>
            </div>

            {/* Trimmed-out Shaded Regions */}
            {trimStart > 0 && (
              <div 
                className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none border-r border-[#FFB800]/50"
                style={{ width: `${trimStart * pxPerSec}px` }}
              />
            )}
            {trimEnd < duration && (
              <div 
                className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none border-l border-[#FFB800]/50"
                style={{ left: `${trimEnd * pxPerSec}px`, width: `${(duration - trimEnd) * pxPerSec}px` }}
              />
            )}
          </div>

          {/* C. CAPTIONS & WORDS TRACK (Adjust Word Length & Blade Tool) */}
          <div className="h-14 border-b border-[#1E1E26] bg-[#111116] relative flex items-center">
            {/* Word Blocks */}
            {allWordBlocks.map((wb) => {
              const leftPx = wb.start * pxPerSec
              const widthPx = Math.max(24, (wb.end - wb.start) * pxPerSec)
              const isActive = currentTime >= wb.start && currentTime < wb.end
              const isSelected = selectedWordId === wb.id || selectedCaptionId === wb.segmentId

              return (
                <div
                  key={wb.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (activeTool === "blade") {
                      const cutTime = clientXToSeconds(e.clientX)
                      splitAtPlayhead(cutTime)
                      showToast(`Cut word at ${cutTime.toFixed(2)}s`)
                    } else {
                      setSelectedCaptionId(wb.segmentId)
                      setSelectedWordId(wb.id)
                      setCurrentTime(wb.start)
                    }
                  }}
                  onPointerDown={(e) => {
                    if (activeTool === "select") {
                      handlePointerDown(e, "word-move", wb.segmentId, wb.id, wb.start, wb.end)
                    }
                  }}
                  className={`absolute top-2 bottom-2 rounded-lg border text-xs flex flex-col justify-center px-2 overflow-hidden transition-all group ${
                    isActive
                      ? "bg-[#FFE79A] border-[#FFB800] text-black font-extrabold shadow-[0_0_14px_rgba(255,184,0,0.65)] ring-2 ring-[#FFB800] z-20"
                      : isSelected
                      ? "bg-[#E6C687] border-[#D4AF37] text-black font-bold z-15 shadow-sm"
                      : "bg-[#DFD3A8] border-[#C4B78A] text-black/90 hover:brightness-105 z-10"
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                    cursor: activeTool === "blade" ? "crosshair" : "grab"
                  }}
                  title={`${wb.text} (${formatClockFull(wb.start)} - ${formatClockFull(wb.end)}, ${(wb.end - wb.start).toFixed(2)}s) - Drag edges to adjust length`}
                >
                  {/* Left Resize Handle (Adjust Word Length: Start) */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "word-start", wb.segmentId, wb.id, wb.start, wb.end)}
                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    title="Drag to adjust word start time"
                  >
                    <div className="w-0.5 h-3 bg-black/60 rounded-full" />
                  </div>

                  {/* Word Content */}
                  <div className="truncate pointer-events-none leading-none">
                    <span className="font-bold text-[11px] block truncate">{wb.text}</span>
                    <span className="text-[8px] opacity-70 block">/ Text</span>
                  </div>

                  {/* Right Resize Handle (Adjust Word Length: End) */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "word-end", wb.segmentId, wb.id, wb.start, wb.end)}
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    title="Drag to adjust word length"
                  >
                    <div className="w-0.5 h-3 bg-black/60 rounded-full" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* D. AUDIO WAVEFORM TRACK (Matching Captik UI) */}
          <div className="h-10 bg-[#0A0A0E] relative flex items-center px-3 overflow-hidden">
            <div className="absolute left-3 flex items-center gap-1.5 text-[9px] text-[#70707D] font-mono z-10 pointer-events-none">
              <Volume2 size={12} className="text-emerald-400" />
              <span>Sounds: drag one here from the Sounds tab</span>
            </div>

            {/* Detailed Green Audio Waveform Peaks */}
            <div className="w-full h-full flex items-center gap-0.5 opacity-80 pl-2">
              {Array.from({ length: Math.ceil(totalTimelineWidth / 4) }).map((_, i) => {
                const waveHeight = Math.max(12, Math.abs(Math.sin(i * 0.22)) * 82 + ((i * 17) % 18))
                const barTime = (i * 4) / pxPerSec
                const isPassed = barTime <= currentTime

                return (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full transition-colors ${
                      isPassed ? "bg-[#34D399]" : "bg-[#10B981]/50"
                    }`}
                    style={{ height: `${waveHeight}%` }}
                  />
                )
              })}
            </div>
          </div>

          {/* E. HOVER BLADE CUT GUIDE (When Blade tool is active) */}
          {activeTool === "blade" && hoverCutTime !== null && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.9)]"
              style={{ left: `${hoverCutTime * pxPerSec}px` }}
            >
              <div className="absolute -top-1 -translate-x-1/2 p-0.5 bg-red-600 rounded text-white text-[9px]">
                <Scissors size={10} />
              </div>
            </div>
          )}

          {/* F. SCRUBBING PLAYHEAD NEEDLE */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "playhead")}
            className="absolute top-0 bottom-0 w-0.5 bg-accent z-40 cursor-ew-resize shadow-[0_0_12px_rgba(255,184,0,0.95)]"
            style={{ left: `${currentTime * pxPerSec}px` }}
          >
            {/* Top Diamond Playhead Handle */}
            <div className="absolute -top-1 -translate-x-1/2 w-3.5 h-3.5 bg-accent rotate-45 rounded-sm shadow-md cursor-grab active:cursor-grabbing border border-black/40" />
          </div>
        </div>
      </div>
    </footer>
  )
}
