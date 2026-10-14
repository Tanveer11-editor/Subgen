import React, { useState } from "react"
import { Trash2, Split, Play, ChevronUp, ChevronDown, Clock, Edit2 } from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import type { CaptionSegment } from "@/stores/editorStore"
import { formatTimestamp } from "@/lib/timeUtils"

interface CaptionItemProps {
  caption: CaptionSegment;
  index: number;
  duration?: number;
  onSeek: (time: number) => void;
}

export const CaptionItem: React.FC<CaptionItemProps> = ({
  caption,
  index,
  onSeek,
}) => {
  const { 
    selectedCaptionId, 
    setSelectedCaptionId, 
    selectedWordId,
    setSelectedWordId,
    updateCaption, 
    deleteCaption, 
    splitCaptionAtWord,
    updateWordTiming,
    currentTime 
  } = useEditorStore()

  const isSelected = selectedCaptionId === caption.id
  const isActive = currentTime >= caption.start && currentTime < caption.end

  const [isEditingText, setIsEditingText] = useState(false)

  // Word length adjusters (+/- 0.05s)
  const handleNudgeWordStart = (wordId: string, currentStart: number, currentEnd: number, delta: number) => {
    const newStart = Math.max(0, Math.min(currentEnd - 0.05, currentStart + delta))
    updateWordTiming(caption.id, wordId, newStart, currentEnd)
  }

  const handleNudgeWordEnd = (wordId: string, currentStart: number, currentEnd: number, delta: number) => {
    const newEnd = Math.max(currentStart + 0.05, currentEnd + delta)
    updateWordTiming(caption.id, wordId, currentStart, newEnd)
  }

  return (
    <div
      onClick={() => {
        setSelectedCaptionId(caption.id)
        onSeek(caption.start)
      }}
      className={`group relative rounded-xl border p-3 transition-all cursor-pointer select-none ${
        isActive
          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(255,184,0,0.15)] ring-1 ring-accent"
          : isSelected
          ? "border-accent/70 bg-[#1A1A22] ring-1 ring-accent/30"
          : "border-[#25252E] bg-[#141419] hover:border-[#383844] hover:bg-[#181820]"
      }`}
    >
      {/* Header Bar matching Captik screenshot: Index (e.g. 7 ^ v), timecode range, Seek & Delete */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
            isActive ? "bg-accent text-black font-extrabold" : "bg-[#1E1E26] text-[#A1A1AA]"
          }`}>
            <span>{index + 1}</span>
            <span className="opacity-60 flex flex-col text-[7px] leading-none">
              <ChevronUp size={8} />
              <ChevronDown size={8} />
            </span>
          </span>

          {/* Time range badge */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#8E8E98]">
            <Clock size={10} className="text-[#666675]" />
            <span>{formatTimestamp(caption.start)}</span>
            <span>→</span>
            <span>{formatTimestamp(caption.end)}</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSeek(caption.start)}
            title="Jump to caption start"
            className="p-1 rounded text-[#8E8E98] hover:text-accent hover:bg-[#202028] transition-colors"
          >
            <Play size={12} />
          </button>
          <button
            onClick={() => setIsEditingText(!isEditingText)}
            title="Edit full caption text"
            className="p-1 rounded text-[#8E8E98] hover:text-white hover:bg-[#202028] transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => deleteCaption(caption.id)}
            title="Delete this caption"
            className="p-1 rounded text-[#8E8E98] hover:text-red-400 hover:bg-[#202028] transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* FULL TEXT EDITING (If user opens full editor) */}
      {isEditingText && (
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            rows={2}
            value={caption.text}
            onChange={(e) => updateCaption(caption.id, { text: e.target.value })}
            className="w-full resize-none rounded-lg bg-[#0F0F14] border border-[#2D2D38] p-2 text-xs text-white placeholder-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      )}

      {/* WORD PILL CHIPS (Captik style: individual interactive words) */}
      <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {(caption.words || []).map((w, widx) => {
          const isWordActive = currentTime >= w.start && currentTime < w.end
          const isWordSelected = selectedWordId === w.id

          return (
            <div
              key={w.id}
              onClick={() => {
                setSelectedWordId(w.id)
                setSelectedCaptionId(caption.id)
                onSeek(w.start)
              }}
              className={`group/word relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isWordActive
                  ? "bg-[#10B981] border-[#10B981] text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : isWordSelected
                  ? "bg-accent/20 border-accent text-accent font-bold"
                  : "bg-[#1D1D26] border-[#2E2E3C] text-[#D4D4D8] hover:border-[#4B4B5E] hover:text-white"
              }`}
            >
              <span>{w.text}</span>

              {/* Split Button on hover */}
              {widx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    splitCaptionAtWord(caption.id, w.id)
                  }}
                  title={`Split caption before "${w.text}"`}
                  className="opacity-0 group-hover/word:opacity-100 hover:text-accent ml-0.5"
                >
                  <Split size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* SELECTED WORD TIMING ADJUSTMENT DRAWER */}
      {selectedWordId && caption.words?.some(w => w.id === selectedWordId) && (
        <div 
          className="mt-2.5 pt-2 border-t border-[#23232C] bg-[#111116] rounded-lg p-2 flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]"
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const curWord = caption.words.find(w => w.id === selectedWordId)!
            const wordDur = (curWord.end - curWord.start).toFixed(2)

            return (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">{curWord.text}</span>
                  <span className="text-[10px] text-accent">({wordDur}s)</span>
                </div>

                {/* Adjust Start / End length buttons */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-[#70707D]">Start:</span>
                    <button
                      onClick={() => handleNudgeWordStart(curWord.id, curWord.start, curWord.end, -0.05)}
                      className="w-4 h-4 rounded bg-[#1C1C24] hover:bg-accent hover:text-black flex items-center justify-center text-[10px]"
                      title="Shorten start (-0.05s)"
                    >
                      -
                    </button>
                    <span className="text-[10px] text-white">{curWord.start.toFixed(2)}</span>
                    <button
                      onClick={() => handleNudgeWordStart(curWord.id, curWord.start, curWord.end, 0.05)}
                      className="w-4 h-4 rounded bg-[#1C1C24] hover:bg-accent hover:text-black flex items-center justify-center text-[10px]"
                      title="Lengthen start (+0.05s)"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-[#70707D]">End:</span>
                    <button
                      onClick={() => handleNudgeWordEnd(curWord.id, curWord.start, curWord.end, -0.05)}
                      className="w-4 h-4 rounded bg-[#1C1C24] hover:bg-accent hover:text-black flex items-center justify-center text-[10px]"
                      title="Shorten end (-0.05s)"
                    >
                      -
                    </button>
                    <span className="text-[10px] text-white">{curWord.end.toFixed(2)}</span>
                    <button
                      onClick={() => handleNudgeWordEnd(curWord.id, curWord.start, curWord.end, 0.05)}
                      className="w-4 h-4 rounded bg-[#1C1C24] hover:bg-accent hover:text-black flex items-center justify-center text-[10px]"
                      title="Lengthen end (+0.05s)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
