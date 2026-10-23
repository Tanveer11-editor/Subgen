import React, { useRef, useState, useEffect } from "react"
import { Move, Edit2, Check, X, Plus, Minus, Maximize2 } from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"

interface CaptionOverlayProps {
  currentTime: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ currentTime }) => {
  const {
    captions,
    activeTemplate,
    fontSize,
    setFontSize,
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
    updateCaption,
    isPlaying
  } = useEditorStore()

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, posX: 50, posY: 80 })
  const [resizeStart, setResizeStart] = useState({ clientX: 0, clientY: 0, startFontSize: 28 })
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const [editText, setEditText] = useState("")

  const overlayRef = useRef<HTMLDivElement>(null)
  const inlineInputRef = useRef<HTMLTextAreaElement>(null)

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

  useEffect(() => {
    if (activeCaption && !isInlineEditing) {
      setEditText(activeCaption.text)
    }
  }, [activeCaption?.id, activeCaption?.text, isInlineEditing])

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
    if (isInlineEditing || isResizing) return
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

  // --- RESIZE HANDLERS (Direct font size resize on video display) ---
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setResizeStart({
      clientX: e.clientX,
      clientY: e.clientY,
      startFontSize: fontSize || 28
    })
    setIsResizing(true)
    ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return
    e.stopPropagation()
    const deltaX = e.clientX - resizeStart.clientX
    const deltaY = e.clientY - resizeStart.clientY
    // Diagonal drag for intuitive resizing
    const delta = (deltaX + deltaY) / 2
    const newSize = Math.max(14, Math.min(72, Math.round(resizeStart.startFontSize + (delta * 0.45))))
    setFontSize(newSize)
  }

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return
    e.stopPropagation()
    setIsResizing(false)
    try {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // --- INLINE EDIT HANDLERS (Edit text directly on video canvas) ---
  const handleStartInlineEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!activeCaption) return
    setEditText(activeCaption.text)
    setIsInlineEditing(true)
    setTimeout(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
    }, 50)
  }

  const handleCommitInlineEdit = () => {
    if (activeCaption && editText.trim()) {
      updateCaption(activeCaption.id, { text: editText.trim() })
    }
    setIsInlineEditing(false)
  }

  const handleCancelInlineEdit = () => {
    if (activeCaption) {
      setEditText(activeCaption.text)
    }
    setIsInlineEditing(false)
  }

  return (
    <>
      {/* Center Snapping Guide Line */}
      {isDragging && textPositionX === 50 && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-accent pointer-events-none z-30 shadow-[0_0_10px_rgba(255,184,0,0.9)] opacity-85" />
      )}

      {/* Dotted Safe Box Guide */}
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

      {/* Draggable & Resizable Caption Container */}
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
          isDragging ? "cursor-grabbing" : isResizing ? "cursor-nwse-resize" : "cursor-grab"
        }`}
      >
        {/* Floating Tooltips: Reposition Coordinates */}
        {isDragging && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-accent text-black text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1 z-40 border border-black/20">
            <Move size={10} strokeWidth={3} />
            <span>X: {textPositionX}% • Y: {textPositionY}%</span>
          </div>
        )}

        {/* Floating Tooltip: Live Text Resizing Badge */}
        {isResizing && (
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-accent text-black text-[11px] font-mono font-black px-3 py-1 rounded-full shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-50 border border-black/20 animate-pulse">
            <Maximize2 size={12} strokeWidth={3} />
            <span>Font Size: {fontSize}px</span>
          </div>
        )}

        {/* Floating Subtitle Controls on Player (Quick Resize Stepper + Move + Edit Text) */}
        {!isInlineEditing && (isHovered || selectedCaptionId === activeCaption.id || isDragging) && !isResizing && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#121218F2] border border-[#2B2B3C] text-white text-[11px] font-semibold px-2 py-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-1.5 z-50 animate-in fade-in duration-100 select-none whitespace-nowrap"
          >
            {/* Drag Handle */}
            <div className="flex items-center gap-1 px-1 py-0.5 text-[#8E8E98] cursor-grab hover:text-white" title="Drag to reposition text on video">
              <Move size={11} className="text-accent" />
            </div>

            <div className="w-[1px] h-3.5 bg-[#2B2B3C]" />

            {/* Quick Text Resize Stepper on Video */}
            <div className="flex items-center gap-0.5 bg-[#1B1B24] rounded-lg p-0.5 border border-[#303042]" title="Resize subtitle text directly on video">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFontSize(Math.max(14, (fontSize || 28) - 2))
                }}
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#D4D4D8] hover:text-white transition-colors active:scale-95"
                title="Decrease font size (-2px)"
              >
                <Minus size={11} />
              </button>
              <span className="text-[10px] font-mono font-bold text-accent px-1.5 select-none min-w-[28px] text-center" title="Current text size">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFontSize(Math.min(72, (fontSize || 28) + 2))
                }}
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#D4D4D8] hover:text-white transition-colors active:scale-95"
                title="Increase font size (+2px)"
              >
                <Plus size={11} />
              </button>
            </div>

            <div className="w-[1px] h-3.5 bg-[#2B2B3C]" />

            {/* Edit Subtitle Text Button */}
            <button
              type="button"
              onClick={handleStartInlineEdit}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/20 hover:bg-accent hover:text-black text-accent text-[11px] font-bold transition-all shadow-sm active:scale-95"
              title="Edit subtitle text directly (or double-click text)"
            >
              <Edit2 size={11} />
              <span>Edit Text</span>
            </button>
          </div>
        )}

        {/* Caption Card Box */}
        <div
          onDoubleClick={handleStartInlineEdit}
          className={`relative inline-block max-w-full px-4 py-2 rounded-2xl transition-all duration-75 text-center ${
            isInlineEditing
              ? "border-2 border-accent bg-black/90 shadow-[0_0_25px_rgba(255,184,0,0.5)]"
              : isDragging
              ? "border-2 border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,184,0,0.35)] ring-2 ring-accent/40"
              : isResizing
              ? "border-2 border-accent bg-accent/15 shadow-[0_0_25px_rgba(255,184,0,0.4)] ring-2 ring-accent"
              : isHovered || selectedCaptionId === activeCaption.id
              ? "border border-accent/70 border-dashed bg-accent/5 ring-1 ring-accent/30"
              : isPreviewMode
              ? "border border-white/20 border-dashed"
              : "border border-transparent"
          }`}
          style={{
            backgroundColor: !isInlineEditing && textBg !== "transparent" ? textBg : undefined,
          }}
          title={!isInlineEditing ? "Double-click to edit text • Drag corner to resize" : undefined}
        >
          {/* Direct Corner Resize Handles on Video Canvas */}
          {!isInlineEditing && (isHovered || selectedCaptionId === activeCaption.id || isResizing) && (
            <>
              {/* Bottom Right Resize Handle */}
              <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                title="Drag to resize text directly on video"
                className="absolute -bottom-2 -right-2 w-5 h-5 bg-accent text-black rounded-full flex items-center justify-center cursor-nwse-resize shadow-xl hover:scale-125 transition-transform z-50 border-2 border-black active:scale-110"
              >
                <Maximize2 size={9} className="rotate-90 stroke-[3]" />
              </div>

              {/* Bottom Left Resize Handle */}
              <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                title="Drag to resize text directly on video"
                className="absolute -bottom-2 -left-2 w-5 h-5 bg-accent text-black rounded-full flex items-center justify-center cursor-nesw-resize shadow-xl hover:scale-125 transition-transform z-50 border-2 border-black active:scale-110"
              >
                <Maximize2 size={9} className="stroke-[3]" />
              </div>
            </>
          )}

          {/* INLINE TEXT EDITING MODE OVER VIDEO */}
          {isInlineEditing ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="min-w-[260px] max-w-[360px] p-2 text-center"
            >
              <textarea
                ref={inlineInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCommitInlineEdit()
                  } else if (e.key === "Escape") {
                    handleCancelInlineEdit()
                  }
                }}
                rows={2}
                className="w-full bg-transparent text-white font-bold resize-none focus:outline-none text-center leading-snug"
                style={{
                  fontFamily: fontFamily || "Outfit, sans-serif",
                  fontSize: `${Math.max(16, Math.min(32, fontSize))}px`,
                  color: textColor || "#FFFFFF",
                }}
                placeholder="Type your subtitle here..."
              />
              <div className="flex items-center justify-between pt-1.5 border-t border-white/15 text-[10px]">
                <span className="text-[#8E8E98] text-[9px]">Enter ↵ Save • Esc Cancel</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelInlineEdit}
                    className="p-1 rounded bg-[#20202A] hover:bg-[#2C2C3A] text-[#A1A1AA] hover:text-white transition-colors"
                    title="Cancel edit"
                  >
                    <X size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitInlineEdit}
                    className="px-2.5 py-0.5 rounded bg-accent hover:bg-[#FFC425] text-black font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    title="Save subtitle text"
                  >
                    <Check size={12} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* NORMAL DISPLAY MODE */
            isSingleWordMode ? (
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
                  className="font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-pre-line pointer-events-none"
                >
                  {displayText}
                </p>
              )
            )
          )}
        </div>
      </div>
    </>
  )
}
