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
    captionDisplayMode,
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

  // 2. If paused and no caption strictly active, use selected caption or first caption
  const fallbackCaption = !isPlaying && captions.length > 0
    ? (captions.find(c => c.id === selectedCaptionId) || captions[0])
    : null

  const activeCaption = currentActive || fallbackCaption
  const isPreviewMode = !currentActive && Boolean(fallbackCaption)

  if (!activeCaption || !activeCaption.text.trim()) {
    return null
  }

  // Active word in segment
  const activeWord = (activeCaption.words || []).find(
    (w) => currentTime >= w.start && currentTime < w.end
  ) || activeCaption.words?.[0]

  // Dynamic text styling
  const customTextStyle: React.CSSProperties = {
    fontFamily: fontFamily || "Outfit, sans-serif",
    color: textColor || "#FFFFFF",
    fontSize: `${fontSize}px`,
    textAlign: textAlign || "center",
    textShadow: textShadow !== "none" ? textShadow : "0 2px 10px rgba(0,0,0,0.8)",
    WebkitTextStroke: textStroke !== "none" ? textStroke : undefined,
  }

  // Single word display mode vs Line display mode
  const isSingleWordMode = captionDisplayMode === "word"

  // Line formatting: 1 or 2 lines
  let displayText = activeCaption.text
  if (isUppercase || activeTemplate === "Bold Punch" || activeTemplate === "Impact Meme" || activeTemplate === "Archives" || activeTemplate === "Neon Cyber") {
    displayText = displayText.toUpperCase()
  }

  if (!isSingleWordMode && linesCount === 2) {
    const words = displayText.split(" ")
    if (words.length > 3) {
      const mid = Math.ceil(words.length / 2)
      displayText = `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`
    }
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

    nextX = Math.max(8, Math.min(92, nextX))
    nextY = Math.max(6, Math.min(94, nextY))

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
      setSelectedCaptionId(activeCaption.id)
    }
  }

  return (
    <>
      {/* Center Snapping Guide Line */}
      {isDragging && textPositionX === 50 && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-accent pointer-events-none z-30 shadow-[0_0_10px_rgba(255,184,0,0.9)] opacity-85" />
      )}

      {/* Dotted Safe Box Guide matching Captik screenshot */}
      <div 
        className="absolute pointer-events-none border border-dashed border-white/20 rounded-xl z-20 flex items-center justify-center"
        style={{
          left: "10%",
          right: "10%",
          bottom: "16%",
          height: "90px"
        }}
      >
        <span className="text-[10px] font-mono tracking-widest text-white/20 uppercase select-none">
          BIOMETRIC SAFE AREA
        </span>
      </div>

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
        {/* Floating Tooltips */}
        {isDragging && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-accent text-black text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1 z-40 border border-black/20">
            <Move size={10} strokeWidth={3} />
            <span>X: {textPositionX}% • Y: {textPositionY}%</span>
          </div>
        )}

        {!isDragging && isHovered && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-accent text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/40 shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1 z-40">
            <Move size={9} />
            <span>Drag text to reposition</span>
          </div>
        )}

        {/* Caption Card Box */}
        <div 
          className={`relative inline-block max-w-full px-4 py-2 rounded-2xl transition-all duration-75 text-center ${
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
          {/* SINGLE WORD DISPLAY MODE (Dynamic single word popup) */}
          {isSingleWordMode ? (
            <div className="inline-block pointer-events-none">
              <span
                style={{
                  ...customTextStyle,
                  fontSize: `${fontSize * 1.3}px`,
                  color: activeHighlightColor || "#FFB800",
                  textShadow: "0 0 24px rgba(255,184,0,0.9), 0 4px 10px rgba(0,0,0,0.9)"
                }}
                className="font-black tracking-tight inline-block animate-scaleIn transition-all"
              >
                {activeWord ? (isUppercase ? activeWord.text.toUpperCase() : activeWord.text) : displayText}
              </span>
            </div>
          ) : (
            /* LINE DISPLAY MODE (Multi-word with active highlight or 2-line break) */
            activeCaption.words && activeCaption.words.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pointer-events-none whitespace-pre-line">
                {activeCaption.words.map((w) => {
                  const isWordActive = currentTime >= w.start && currentTime < w.end
                  const wordText = isUppercase ? w.text.toUpperCase() : w.text

                  return (
                    <span
                      key={w.id}
                      className={`font-black tracking-wide transition-all duration-75 ${
                        isWordActive
                          ? "scale-110 drop-shadow-[0_0_20px_rgba(255,184,0,0.95)]"
                          : "drop-shadow-md opacity-90"
                      }`}
                      style={{ 
                        ...customTextStyle,
                        color: isWordActive ? (activeHighlightColor || "#FFB800") : (textColor || "#FFFFFF"),
                        textShadow: isWordActive 
                          ? "0 0 20px rgba(255,184,0,0.95), 0 2px 4px rgba(0,0,0,0.8)" 
                          : customTextStyle.textShadow
                      }}
                    >
                      {wordText}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p 
                style={customTextStyle}
                className="font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-pre-line"
              >
                {displayText}
              </p>
            )
          )}
        </div>
      </div>
    </>
  )
}
