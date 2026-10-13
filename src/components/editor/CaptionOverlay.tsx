import React, { useRef, useState } from "react"
import { Move } from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"

interface CaptionOverlayProps {
  currentTime: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ currentTime }) => {
  const { 
    captions, 
    activeTemplate, 
    fontSize, 
    fontFamily,
    textColor, 
    activeHighlightColor,
    textBg, 
    textStroke,
    textShadow,
    isUppercase,
    textPositionX,
    textPositionY,
    setTextPositionCoords,
    textAlign, 
    linesCount,
    selectedCaptionId,
    setSelectedCaptionId,
    isPlaying
  } = useEditorStore()

  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, posX: 50, posY: 80 })
  const overlayRef = useRef<HTMLDivElement>(null)

  // 1. Find active caption during playback
  const currentActive = captions.find(
    (cap) => currentTime >= cap.start && currentTime < cap.end
  )

  // 2. If video is paused and no caption is strictly active at currentTime,
  // allow user to view and position the selected caption or first caption
  const fallbackCaption = !isPlaying && captions.length > 0
    ? (captions.find(c => c.id === selectedCaptionId) || captions[0])
    : null

  const activeCaption = currentActive || fallbackCaption
  const isPreviewMode = !currentActive && Boolean(fallbackCaption)

  if (!activeCaption || !activeCaption.text.trim()) {
    return null
  }

  // Alignment classes for inner text
  const alignClass = {
    left: "text-left items-start justify-start",
    center: "text-center items-center justify-center",
    right: "text-right items-end justify-end"
  }[textAlign] || "text-center items-center justify-center"

  // Format text into 1 or 2 lines
  let displayText = activeCaption.text
  if (isUppercase || activeTemplate === "Bold Punch" || activeTemplate === "Impact Meme" || activeTemplate === "Archives" || activeTemplate === "Neon Cyber") {
    displayText = displayText.toUpperCase()
  }
  
  if (linesCount === 2) {
    const words = displayText.split(" ")
    if (words.length > 4) {
      const mid = Math.ceil(words.length / 2)
      displayText = `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`
    }
  }

  // Calculate dynamic text style
  const customTextStyle: React.CSSProperties = {
    fontFamily: fontFamily || "Outfit, sans-serif",
    color: textColor || "#FFFFFF",
    fontSize: `${fontSize}px`,
    textShadow: textShadow !== "none" ? textShadow : undefined,
    WebkitTextStroke: textStroke !== "none" ? textStroke : undefined,
  }

  // Pointer drag events for smooth movement anywhere in the video display
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const container = overlayRef.current?.parentElement
    if (!container) return

    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      posX: textPositionX ?? 50,
      posY: textPositionY ?? 80,
    })
    setIsDragging(true)
    overlayRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    e.stopPropagation()
    const container = overlayRef.current?.parentElement
    if (!container) return

    const rect = container.getBoundingClientRect()
    const deltaX = ((e.clientX - dragStart.clientX) / rect.width) * 100
    const deltaY = ((e.clientY - dragStart.clientY) / rect.height) * 100

    let nextX = Math.round(dragStart.posX + deltaX)
    let nextY = Math.round(dragStart.posY + deltaY)

    // Clamp inside video container margins
    nextX = Math.max(8, Math.min(92, nextX))
    nextY = Math.max(6, Math.min(94, nextY))

    // Magnetic snap to center horizontally
    if (Math.abs(nextX - 50) < 3.5) {
      nextX = 50
    }

    setTextPositionCoords(nextX, nextY)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    e.stopPropagation()
    setIsDragging(false)
    try {
      overlayRef.current?.releasePointerCapture(e.pointerId)
    } catch {}

    const dist = Math.hypot(e.clientX - dragStart.clientX, e.clientY - dragStart.clientY)
    if (dist < 4) {
      // User tapped/clicked without dragging: select caption
      setSelectedCaptionId(activeCaption.id)
    }
  }

  return (
    <>
      {/* Magnetic Center Vertical Guide Line when snapped */}
      {isDragging && textPositionX === 50 && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-accent pointer-events-none z-30 shadow-[0_0_10px_rgba(255,184,0,0.9)] opacity-85" />
      )}

      {/* Draggable Caption Container */}
      <div 
        ref={overlayRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          left: `${textPositionX ?? 50}%`,
          top: `${textPositionY ?? 80}%`,
          transform: "translate(-50%, -50%)",
          maxWidth: "92%",
          opacity: isPreviewMode ? 0.8 : 1,
        }}
        className={`absolute z-30 select-none transition-shadow ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Active Dragging Coordinates Floating Pill */}
        {isDragging && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-accent text-black text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1 z-40 border border-black/20">
            <Move size={10} strokeWidth={3} />
            <span>X: {textPositionX}% • Y: {textPositionY}%</span>
          </div>
        )}

        {/* Hover Cue when paused */}
        {!isDragging && isHovered && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-accent text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/40 shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1 z-40">
            <Move size={9} />
            <span>Drag text to move</span>
          </div>
        )}

        {/* Caption Card Box with Dragging Border */}
        <div 
          className={`relative inline-block max-w-full px-4 py-2 rounded-2xl transition-all duration-75 ${alignClass} ${
            isDragging 
              ? "border-2 border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,184,0,0.35)] ring-2 ring-accent/40" 
              : isHovered
              ? "border border-accent/60 border-dashed bg-accent/5"
              : isPreviewMode
              ? "border border-white/20 border-dashed"
              : "border border-transparent"
          }`}
          style={{
            backgroundColor: textBg !== "transparent" ? textBg : undefined,
          }}
        >
          {/* If template is Karaoke or has word timestamps */}
          {(activeTemplate === "Karaoke" || activeTemplate === "Karaoke Pop" || activeTemplate === "Captik Glow") && activeCaption.words && activeCaption.words.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pointer-events-none">
              {activeCaption.words.map((w) => {
                const isWordActive = currentTime >= w.start && currentTime < w.end
                const wordText = isUppercase ? w.text.toUpperCase() : w.text
                return (
                  <span
                    key={w.id}
                    className={`font-black tracking-wide transition-all duration-75 ${
                      isWordActive
                        ? "scale-110 drop-shadow-[0_0_18px_rgba(255,184,0,0.95)]"
                        : "drop-shadow-md opacity-90"
                    }`}
                    style={{ 
                      ...customTextStyle,
                      color: isWordActive ? (activeHighlightColor || "#FFB800") : (textColor || "#FFFFFF"),
                      textShadow: isWordActive ? "0 0 18px rgba(255,184,0,0.95)" : customTextStyle.textShadow
                    }}
                  >
                    {wordText}
                  </span>
                )
              })}
            </div>
          ) : activeTemplate === "Captik Shadow" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                textShadow: "0 6px 14px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9)",
                WebkitTextStroke: "1px rgba(0,0,0,0.6)"
              }}
              className="whitespace-pre-line tracking-tight pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Scribble" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "'Caveat', cursive",
                fontSize: `${fontSize * 1.25}px`,
                fontWeight: 700,
                textShadow: "0 2px 10px rgba(0,0,0,0.85)"
              }}
              className="whitespace-pre-line tracking-wide text-yellow-300 pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Archives" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                letterSpacing: "0.08em"
              }}
              className="whitespace-pre-line bg-black/80 px-3.5 py-1.5 rounded-md border border-white/20 text-gray-100 pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Neon Cyber" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                color: "#00F0FF",
                textShadow: "0 0 18px rgba(0,240,255,0.9), 0 0 35px rgba(0,240,255,0.5)"
              }}
              className="whitespace-pre-line uppercase tracking-wider pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Bold Punch" || activeTemplate === "Bold" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "'Anton', sans-serif",
                letterSpacing: "0.05em",
                WebkitTextStroke: "2px black",
                textShadow: "0 4px 6px rgba(0,0,0,0.9)"
              }}
              className="whitespace-pre-line uppercase font-black text-accent pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Impact Meme" || activeTemplate === "Meme" ? (
            <p 
              style={{ 
                ...customTextStyle,
                fontFamily: "Impact, sans-serif",
                WebkitTextStroke: "2px black",
                textShadow: "0 3px 2px rgba(0,0,0,1)"
              }}
              className="whitespace-pre-line uppercase tracking-widest text-white font-black pointer-events-none"
            >
              {displayText}
            </p>
          ) : activeTemplate === "Cinematic Serif" || activeTemplate === "Cinematic" ? (
            <p 
              style={{
                ...customTextStyle,
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                textShadow: "0 2px 10px rgba(0,0,0,0.9)"
              }}
              className="whitespace-pre-line font-medium text-white/95 pointer-events-none"
            >
              {displayText}
            </p>
          ) : (
            /* Clean Minimal default */
            <p 
              style={customTextStyle}
              className="font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-pre-line bg-black/40 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10 pointer-events-none"
            >
              {displayText}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
