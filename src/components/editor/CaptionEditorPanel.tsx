import React from "react"
import { 
  Plus, Trash2, RotateCcw, RotateCw, ChevronDown, ChevronUp, 
  Sparkles, Sliders, Type, AlignCenter, AlignLeft, AlignRight,
  Layers, Check
} from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import type { TextPosition, TextAlign } from "@/stores/editorStore"
import { CaptionItem } from "./CaptionItem"

interface CaptionEditorPanelProps {
  duration: number;
  onSeek: (time: number) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
  transcribeProgress: string;
}

export const CaptionEditorPanel: React.FC<CaptionEditorPanelProps> = ({
  duration,
  onSeek,
  onTranscribe,
  isTranscribing,
  transcribeProgress,
}) => {
  const { 
    captions, 
    addCaption, 
    deleteCaption, 
    selectedCaptionId, 
    linesCount, 
    setLinesCount,
    captionSettingsOpen, 
    toggleCaptionSettings,
    textPosition,
    setTextPosition,
    textAlign,
    setTextAlign,
    fontSize,
    setFontSize,
    activeTemplate,
    setActiveTemplate,
    textColor,
    setTextColor,
    outputMode,
    setOutputMode,
    sourceLanguage,
    setSourceLanguage,
    undo,
    redo,
    historyIndex,
    history
  } = useEditorStore()

  const handleDeleteSelected = () => {
    if (selectedCaptionId) {
      deleteCaption(selectedCaptionId)
    }
  }

  return (
    <aside className="w-[310px] xl:w-[350px] shrink-0 border-r border-border bg-bg-panel flex flex-col h-full z-10 select-none">
      {/* Header Bar */}
      <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0 bg-bg-panel">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          <h2 className="text-sm font-extrabold tracking-wider uppercase text-text-primary">
            CAPTIONS
          </h2>
          <span className="text-[11px] font-mono text-text-muted bg-bg-control px-2 py-0.5 rounded-full border border-border">
            {captions.length}
          </span>
        </div>

        {/* Lines Toggle (1 Line vs 2 Lines) */}
        <div className="flex items-center bg-bg-control p-0.5 rounded-lg border border-border">
          <button
            onClick={() => setLinesCount(1)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              linesCount === 1
                ? "bg-accent text-black shadow-sm font-bold"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            1 Line
          </button>
          <button
            onClick={() => setLinesCount(2)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              linesCount === 2
                ? "bg-accent text-black shadow-sm font-bold"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            2 Lines
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-2.5 border-b border-border/80 flex items-center justify-between bg-bg-primary/40 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
            className="p-1.5 rounded-md hover:bg-bg-control text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          {/* Redo */}
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            className="p-1.5 rounded-md hover:bg-bg-control text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <RotateCw size={14} />
          </button>

          <span className="h-4 w-px bg-border mx-1" />

          {/* Delete Selected Caption */}
          <button
            onClick={() => selectedCaptionId && handleDeleteSelected()}
            disabled={!selectedCaptionId}
            title="Delete Selected Caption"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-red-400 hover:bg-bg-control disabled:opacity-30 transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>

        {/* Add Caption Button */}
        <button
          onClick={() => addCaption(selectedCaptionId || undefined)}
          className="flex items-center gap-1 px-3 py-1 bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={13} />
          <span>Add Caption</span>
        </button>
      </div>

      {/* Caption Settings Expandable Section */}
      <div className="border-b border-border bg-bg-panel/50 shrink-0">
        <button
          onClick={toggleCaptionSettings}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-accent" />
            <span className="uppercase tracking-wider">Caption Settings & Styles</span>
          </div>
          {captionSettingsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {captionSettingsOpen && (
          <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-border/60 bg-bg-control/50">
            {/* Position & Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                  Position
                </label>
                <div className="flex bg-bg-panel border border-border rounded-lg p-0.5">
                  {(["top", "middle", "bottom"] as TextPosition[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTextPosition(pos)}
                      className={`flex-1 py-1 text-[11px] capitalize rounded font-medium ${
                        textPosition === pos ? "bg-accent text-black font-bold" : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                  Alignment
                </label>
                <div className="flex bg-bg-panel border border-border rounded-lg p-0.5">
                  {[
                    { id: "left", icon: AlignLeft },
                    { id: "center", icon: AlignCenter },
                    { id: "right", icon: AlignRight },
                  ].map((align) => {
                    const Icon = align.icon
                    return (
                      <button
                        key={align.id}
                        onClick={() => setTextAlign(align.id as TextAlign)}
                        className={`flex-1 py-1 flex items-center justify-center rounded ${
                          textAlign === align.id ? "bg-accent text-black" : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <Icon size={13} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Font Size & Template */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted uppercase mb-1">
                  <span>Font Size</span>
                  <span className="text-accent">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={46}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-accent bg-bg-panel rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                  Style Preset
                </label>
                <select
                  value={activeTemplate}
                  onChange={(e) => setActiveTemplate(e.target.value)}
                  className="w-full bg-bg-panel border border-border rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="Clean">Clean Subtitles</option>
                  <option value="Karaoke">Karaoke Highlight</option>
                  <option value="Bold">Bold Uppercase</option>
                  <option value="Pop">Pop Yellow</option>
                  <option value="Meme">Impact Meme</option>
                  <option value="Cinematic">Cinematic Serif</option>
                </select>
              </div>
            </div>

            {/* Text Color Presets */}
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: "White", val: "#FFFFFF" },
                  { label: "Gold", val: "#FFB800" },
                  { label: "Yellow", val: "#FACC15" },
                  { label: "Cyan", val: "#38BDF8" },
                  { label: "Green", val: "#22C55E" },
                ].map((c) => (
                  <button
                    key={c.val}
                    onClick={() => setTextColor(c.val)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform ${
                      textColor === c.val ? "scale-110 border-white ring-2 ring-accent" : "border-border/60 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.val }}
                    title={c.label}
                  >
                    {textColor === c.val && <Check size={11} className={c.val === "#FFFFFF" || c.val === "#FACC15" ? "text-black" : "text-white"} />}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Speech-to-Text Workflow Bar */}
            <div className="pt-2 border-t border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> AI Speech Transcribe
                </span>
                <span className="text-[9px] text-text-muted">Tanglish v2</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={outputMode}
                  onChange={(e) => setOutputMode(e.target.value as any)}
                  className="bg-bg-panel border border-border rounded px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-accent"
                >
                  <option value="tanglish">Tanglish (Roman)</option>
                  <option value="tamil">Tamil Script</option>
                  <option value="english">English Trans.</option>
                </select>

                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value as any)}
                  className="bg-bg-panel border border-border rounded px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-accent"
                >
                  <option value="auto">Auto Detect</option>
                  <option value="ta">Tamil Spoken</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                onClick={onTranscribe}
                disabled={isTranscribing}
                className="w-full py-1.5 bg-accent hover:bg-accent-hover text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} />
                <span>{isTranscribing ? transcribeProgress || "Transcribing..." : "Generate / Retranscribe"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Captions List (Independently Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {captions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted space-y-3">
            <Type size={32} className="opacity-40" />
            <div>
              <p className="text-sm font-semibold text-text-secondary">No Captions Yet</p>
              <p className="text-xs max-w-xs mt-1">
                Click "+ Add Caption" to create a new caption card, or click "Generate" to transcribe audio.
              </p>
            </div>
            <button
              onClick={() => addCaption()}
              className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-lg text-xs font-bold transition-colors"
            >
              + Create First Caption
            </button>
          </div>
        ) : (
          captions.map((cap, idx) => (
            <CaptionItem
              key={cap.id}
              caption={cap}
              index={idx}
              duration={duration}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </aside>
  )
}
