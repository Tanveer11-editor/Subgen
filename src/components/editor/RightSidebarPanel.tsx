import React, { useState } from "react"
import {
  Search, Bookmark, X, Check, Trash2,
  AlignLeft, AlignCenter, AlignRight, Move
} from "lucide-react"
import { useEditorStore } from "@/stores/editorStore"
import type { TextPosition, TextAlign } from "@/stores/editorStore"

interface TemplateItem {
  id: string;
  name: string;
  badge?: "Popular" | "New" | "Trending";
  previewText: string;
  fontFamily: string;
  isCustomFont?: boolean;
}

const TEMPLATES_LIST: TemplateItem[] = [
  {
    id: "glow",
    name: "Glow",
    badge: "Popular",
    previewText: "kiya,",
    fontFamily: "Outfit, sans-serif"
  },
  {
    id: "shadow",
    name: "Shadow",
    badge: "New",
    previewText: "kiya,",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "scribble",
    name: "Scribble",
    badge: "New",
    previewText: "awesome!",
    fontFamily: "'Caveat', cursive",
    isCustomFont: true
  },
  {
    id: "archives",
    name: "Archives",
    badge: "New",
    previewText: "DOCUMENTARY",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "karaoke-pop",
    name: "Karaoke Pop",
    badge: "Trending",
    previewText: "Sing it!",
    fontFamily: "Outfit, sans-serif"
  },
  {
    id: "bold-punch",
    name: "Bold Punch",
    badge: "Popular",
    previewText: "LISTEN UP",
    fontFamily: "'Anton', sans-serif",
    isCustomFont: true
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    previewText: "SubGen Clean",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    badge: "Trending",
    previewText: "CYBERPUNK",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "impact-meme",
    name: "Impact Meme",
    previewText: "TOP TEXT",
    fontFamily: "Impact, sans-serif"
  },
  {
    id: "cinematic-serif",
    name: "Cinematic Serif",
    previewText: "Prestige Story",
    fontFamily: "Georgia, serif"
  }
]

export const RightSidebarPanel: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeTemplate,
    setActiveTemplate,
    templateCategory,
    setTemplateCategory,
    templateSearchQuery,
    setTemplateSearchQuery,
    bannerDismissed,
    setBannerDismissed,
    userPresets,
    saveCurrentAsPreset,
    deletePreset,
    applyPreset,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    textColor,
    setTextColor,
    activeHighlightColor,
    setActiveHighlightColor,
    textBg,
    setTextBg,
    textStroke,
    setTextStroke,
    textShadow,
    setTextShadow,
    isUppercase,
    setIsUppercase,
    textPosition,
    setTextPosition,
    textPositionX,
    textPositionY,
    setTextPositionX,
    setTextPositionY,
    textAlign,
    setTextAlign,
    linesCount,
    setLinesCount,
    maxWordsPerCaption,
    setMaxWordsPerCaption,
    outputMode,
    setOutputMode,
    sourceLanguage,
    setSourceLanguage
  } = useEditorStore()

  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [presetNameInput, setPresetNameInput] = useState("")

  const handleSavePreset = () => {
    if (presetNameInput.trim()) {
      saveCurrentAsPreset(presetNameInput.trim())
      setPresetNameInput("")
      setIsSavingPreset(false)
      setTemplateCategory("presets")
    }
  }

  // Filter templates by search query
  const filteredTemplates = TEMPLATES_LIST.filter(t =>
    t.name.toLowerCase().includes(templateSearchQuery.toLowerCase())
  )

  return (
    <aside className="w-[340px] shrink-0 border-l border-border bg-bg-panel flex flex-col h-full z-10 select-none">
      {/* Top 3 Navigation Tabs */}
      <div className="h-14 border-b border-border flex items-center justify-around px-2 shrink-0 bg-bg-panel">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 h-full flex items-center justify-center text-xs font-bold transition-all relative ${
            activeTab === "templates"
              ? "text-white"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <span>Templates</span>
          {activeTab === "templates" && (
            <span className="absolute bottom-0 inset-x-4 h-0.5 bg-accent rounded-t-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("customize")}
          className={`flex-1 h-full flex items-center justify-center text-xs font-bold transition-all relative ${
            activeTab === "customize"
              ? "text-white"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <span>Customize</span>
          {activeTab === "customize" && (
            <span className="absolute bottom-0 inset-x-4 h-0.5 bg-accent rounded-t-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 h-full flex items-center justify-center text-xs font-bold transition-all relative ${
            activeTab === "text"
              ? "text-white"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <span>Text</span>
          {activeTab === "text" && (
            <span className="absolute bottom-0 inset-x-4 h-0.5 bg-accent rounded-t-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: TEMPLATES */}
        {/* ========================================================================= */}
        {activeTab === "templates" && (
          <div className="space-y-3.5">
            {/* Pill Toggle: Captik Templates vs My Presets */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTemplateCategory("templates")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  templateCategory === "templates"
                    ? "bg-[#251F14] border-accent/70 text-accent shadow-sm"
                    : "bg-[#16161C] border-border text-text-muted hover:text-text-primary hover:border-text-muted/40"
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setTemplateCategory("presets")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  templateCategory === "presets"
                    ? "bg-[#251F14] border-accent/70 text-accent shadow-sm"
                    : "bg-[#16161C] border-border text-text-muted hover:text-text-primary hover:border-text-muted/40"
                }`}
              >
                My Presets
              </button>
            </div>

            {/* Search Input & Save Preset Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Find a template..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="w-full bg-[#16161C] border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-text-muted/70 focus:outline-none focus:border-accent/80 transition-colors"
                />
              </div>

              <button
                onClick={() => setIsSavingPreset(!isSavingPreset)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#18181E] hover:bg-[#202028] border border-border hover:border-accent/60 text-white rounded-xl text-xs font-medium transition-all shrink-0"
                title="Save current styling as a preset"
              >
                <Bookmark size={13} className="text-accent" />
                <span>Save Preset</span>
              </button>
            </div>

            {/* Save Preset Inline Input Dialog */}
            {isSavingPreset && (
              <div className="p-3 bg-[#1A1813] border border-accent/40 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-accent block">Name your custom preset:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="e.g. My Neon Reel Preset"
                    onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                    className="flex-1 bg-bg-panel border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePreset}
                    className="px-3 py-1.5 bg-accent text-black font-bold text-xs rounded-lg shadow-sm hover:brightness-105"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsSavingPreset(false)}
                    className="p-1.5 text-text-muted hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* In "Captik Templates" View */}
            {templateCategory === "templates" ? (
              <>
                {/* Announcement Banner (Dismissible) */}
                {!bannerDismissed && (
                  <div className="bg-[#1A1813] border border-[#423315] rounded-2xl p-3.5 relative shadow-sm">
                    <button
                      onClick={() => setBannerDismissed(true)}
                      className="absolute top-3 right-3 text-text-muted hover:text-text-primary p-0.5 transition-colors"
                      title="Dismiss announcement"
                    >
                      <X size={14} />
                    </button>

                    <div className="flex items-start gap-2.5 pr-5">
                      <span className="text-base leading-none select-none mt-0.5">✏️</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#FFB800] tracking-tight">
                          Two new handwritten templates
                        </h4>
                        <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                          <strong className="text-white">Scribble</strong> and <strong className="text-white">Archives</strong> are below. Your existing captions keep the template they were made with. Tap one once to apply it.
                        </p>
                        <button
                          onClick={() => setActiveTemplate("Archives")}
                          className="text-[11px] font-bold text-accent hover:underline block pt-0.5"
                        >
                          Try Archives now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Title */}
                <div className="pt-1">
                  <h3 className="text-[11px] font-black tracking-wider text-[#8E8E98] uppercase">
                    DYNAMIC CAPTIONS
                  </h3>
                </div>

                {/* 2-Column Grid of Template Cards */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {filteredTemplates.map((template) => {
                    const isSelected = activeTemplate === template.name ||
                      (template.name === "Glow" && activeTemplate === "Glow") ||
                      (template.name === "Clean Minimal" && activeTemplate === "Clean") ||
                      (template.name === "Karaoke Pop" && activeTemplate === "Karaoke") ||
                      (template.name === "Bold Punch" && activeTemplate === "Bold") ||
                      (template.name === "Impact Meme" && activeTemplate === "Meme") ||
                      (template.name === "Cinematic Serif" && activeTemplate === "Cinematic")

                    return (
                      <div
                        key={template.id}
                        onClick={() => setActiveTemplate(template.name)}
                        className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 border ${
                          isSelected
                            ? "border-accent ring-2 ring-accent/90 shadow-[0_0_16px_rgba(255,184,0,0.3)] scale-[1.02]"
                            : "border-border hover:border-border/80 hover:scale-[1.01]"
                        }`}
                      >
                        {/* 9:16 Video Creator Frame Preview */}
                        <div className="relative aspect-[9/16] w-full bg-[#121216] overflow-hidden">
                          {/* Creator Background Image */}
                          <img
                            src="/creator_card_bg.jpg"
                            alt={template.name}
                            className="w-full h-full object-cover brightness-[0.82] contrast-[1.05] group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Top Tag Badge */}
                          {template.badge && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md text-white ${
                                template.badge === "Popular"
                                  ? "bg-[#FF5500]"
                                  : template.badge === "New"
                                  ? "bg-[#FF5500]"
                                  : "bg-[#8B5CF6]"
                              }`}>
                                {template.badge}
                              </span>
                            </div>
                          )}

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent text-black flex items-center justify-center shadow-lg z-10">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}

                          {/* Overlay Caption Preview on the Creator's Chest / Video */}
                          <div className="absolute inset-x-2 bottom-6 flex flex-col items-center justify-center text-center pointer-events-none">
                            {template.name === "Glow" ? (
                              <span
                                className="text-white text-sm font-bold tracking-tight drop-shadow-[0_0_12px_rgba(255,184,0,0.95)]"
                                style={{ fontFamily: "Outfit, sans-serif" }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Shadow" ? (
                              <span
                                className="text-white text-sm font-black tracking-tight"
                                style={{
                                  fontFamily: "Montserrat, sans-serif",
                                  textShadow: "0 4px 8px rgba(0,0,0,0.95)"
                                }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Scribble" ? (
                              <span
                                className="text-yellow-300 text-lg font-bold"
                                style={{ fontFamily: "'Caveat', cursive" }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Archives" ? (
                              <span
                                className="text-white text-[10px] font-extrabold bg-black/85 px-2 py-0.5 rounded border border-white/20 tracking-wider"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Karaoke Pop" ? (
                              <span
                                className="text-accent text-sm font-black drop-shadow-[0_0_14px_rgba(255,184,0,0.9)]"
                                style={{ fontFamily: "Outfit, sans-serif" }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Bold Punch" ? (
                              <span
                                className="text-accent text-sm font-black uppercase tracking-wider"
                                style={{
                                  fontFamily: "'Anton', sans-serif",
                                  WebkitTextStroke: "1px black"
                                }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Neon Cyber" ? (
                              <span
                                className="text-[#00F0FF] text-xs font-black uppercase tracking-wider drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Impact Meme" ? (
                              <span
                                className="text-white text-xs font-black uppercase tracking-widest"
                                style={{
                                  fontFamily: "Impact, sans-serif",
                                  WebkitTextStroke: "1px black"
                                }}
                              >
                                {template.previewText}
                              </span>
                            ) : template.name === "Cinematic Serif" ? (
                              <span
                                className="text-white text-xs font-serif italic drop-shadow-md"
                              >
                                {template.previewText}
                              </span>
                            ) : (
                              <span
                                className="text-white text-[11px] font-bold bg-black/50 px-2 py-0.5 rounded-md border border-white/10"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                {template.previewText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title Underneath Card */}
                        <div className="bg-[#121216] py-2 px-2.5 flex items-center justify-between border-t border-border/50">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? "text-accent" : "text-text-primary group-hover:text-white"
                          }`}>
                            {template.name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              /* In "My Presets" View */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black tracking-wider text-[#8E8E98] uppercase">
                    Saved Presets ({userPresets.length})
                  </h3>
                </div>

                {userPresets.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-bg-control/50 rounded-2xl border border-border space-y-2">
                    <Bookmark size={24} className="mx-auto text-text-muted" />
                    <p className="text-xs font-bold text-text-primary">No Saved Presets</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Customize font, colors, position, and shadows in the Customize tab, then click &quot;Save Preset&quot; above to store your favorite style.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="bg-[#16161C] border border-border hover:border-accent/50 rounded-xl p-3 flex items-center justify-between transition-all group"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => applyPreset(preset)}
                        >
                          <h4 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                            {preset.name}
                          </h4>
                          <p className="text-[10px] text-text-muted">
                            Font: {preset.fontFamily} • Size: {preset.fontSize}px • {preset.textPosition}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyPreset(preset)}
                            className="px-2.5 py-1 bg-accent/15 hover:bg-accent/25 text-accent text-[11px] font-bold rounded-lg border border-accent/40 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-1 text-text-muted hover:text-red-400 transition-colors"
                            title="Delete preset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CUSTOMIZE */}
        {/* ========================================================================= */}
        {activeTab === "customize" && (
          <div className="space-y-4 pt-1">
            {/* Free Drag Positioning Callout */}
            <div className="bg-[#1A1813] border border-accent/40 rounded-xl p-2.5 flex items-start gap-2.5 shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <Move size={13} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-accent block">Drag to Position:</span>
                <p className="text-[10px] text-text-secondary leading-snug">
                  Click and drag the caption text anywhere directly in the video display.
                </p>
              </div>
            </div>

            {/* Position Picker & Presets */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  Quick Position Presets
                </label>
                <span className="text-[10px] font-mono font-bold text-accent">
                  X: {textPositionX}% • Y: {textPositionY}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#16161C] p-1 rounded-xl border border-border">
                {[
                  { id: "top", label: "Top (14%)" },
                  { id: "middle", label: "Middle (50%)" },
                  { id: "bottom", label: "Bottom (80%)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTextPosition(item.id as TextPosition)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      textPosition === item.id
                        ? "bg-accent text-black shadow-sm font-black"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Vertical Y Position Slider */}
              <div className="bg-[#16161C] p-2.5 rounded-xl border border-border/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                  <span>Vertical Position (Y)</span>
                  <span className="text-accent font-mono text-[11px] font-bold">{textPositionY}%</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={94}
                  value={textPositionY}
                  onChange={(e) => setTextPositionY(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-accent bg-bg-control rounded-lg cursor-pointer"
                />
              </div>

              {/* Horizontal X Position Slider */}
              <div className="bg-[#16161C] p-2.5 rounded-xl border border-border/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                  <span>Horizontal Position (X)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-accent font-mono text-[11px] font-bold">{textPositionX}%</span>
                    <button
                      onClick={() => setTextPositionX(50)}
                      className="px-1.5 py-0.5 text-[9px] bg-accent/15 hover:bg-accent/25 text-accent rounded border border-accent/40 font-bold transition-colors"
                      title="Snap to horizontal center"
                    >
                      Center
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={8}
                  max={92}
                  value={textPositionX}
                  onChange={(e) => setTextPositionX(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-accent bg-bg-control rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Alignment Picker */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Text Alignment
              </label>
              <div className="grid grid-cols-3 gap-2 bg-[#16161C] p-1 rounded-xl border border-border">
                {[
                  { id: "left", label: "Left", icon: AlignLeft },
                  { id: "center", label: "Center", icon: AlignCenter },
                  { id: "right", label: "Right", icon: AlignRight },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTextAlign(item.id as TextAlign)}
                      className={`py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                        textAlign === item.id
                          ? "bg-accent text-black shadow-sm"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Font Family Selector */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Typography Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-[#16161C] border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="Outfit, sans-serif">Outfit (Modern Bold)</option>
                <option value="Montserrat, sans-serif">Montserrat (Geometric Bold)</option>
                <option value="Inter, sans-serif">Inter (Clean Subtitle)</option>
                <option value="'Caveat', cursive">Caveat (Scribble Handwritten)</option>
                <option value="'Anton', sans-serif">Anton (Punchy Uppercase)</option>
                <option value="Impact, sans-serif">Impact (Meme Bold)</option>
                <option value="Georgia, serif">Georgia (Cinematic Serif)</option>
              </select>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                <span>Font Size</span>
                <span className="text-accent font-mono text-xs">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={18}
                max={52}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full h-1.5 accent-accent bg-bg-control rounded-lg cursor-pointer"
              />
            </div>

            {/* Primary Text Color */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                <span>Text Color</span>
                <span className="font-mono text-xs text-text-secondary">{textColor}</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  "#FFFFFF",
                  "#FFB800",
                  "#00F0FF",
                  "#22C55E",
                  "#EF4444",
                  "#E0E7FF",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      textColor === c ? "border-accent scale-110 ring-2 ring-accent/50" : "border-border/60 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* Active Karaoke Highlight Color */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                <span>Active Word Highlight Color</span>
                <span className="font-mono text-xs text-accent">{activeHighlightColor}</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  "#FFB800",
                  "#FFE600",
                  "#00F0FF",
                  "#FF007A",
                  "#22C55E",
                  "#FFFFFF"
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveHighlightColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      activeHighlightColor === c ? "border-accent scale-110 ring-2 ring-accent/50" : "border-border/60 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={activeHighlightColor}
                  onChange={(e) => setActiveHighlightColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Text Background Box */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Background Box
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Transparent", val: "transparent" },
                  { label: "Frosted Glass", val: "rgba(0, 0, 0, 0.45)" },
                  { label: "Solid Black", val: "rgba(0, 0, 0, 0.85)" },
                  { label: "Golden Tint", val: "rgba(255, 184, 0, 0.2)" },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setTextBg(b.val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      textBg === b.val
                        ? "bg-accent/15 border-accent text-accent font-bold"
                        : "bg-[#16161C] border-border text-text-muted hover:text-white"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke / Outline */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Outline & Stroke
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "None", val: "none" },
                  { label: "Medium (1.5px)", val: "1.5px black" },
                  { label: "Thick (2.5px)", val: "2.5px black" },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setTextStroke(s.val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      textStroke === s.val
                        ? "bg-accent/15 border-accent text-accent font-bold"
                        : "bg-[#16161C] border-border text-text-muted hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Shadow & Glow */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Shadow & Glow Effect
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "None", val: "none" },
                  { label: "Deep Shadow", val: "0 6px 14px rgba(0,0,0,0.95)" },
                  { label: "Gold Glow", val: "0 0 16px rgba(255, 184, 0, 0.9)" },
                  { label: "Cyan Neon", val: "0 0 18px rgba(0, 240, 255, 0.85)" },
                ].map((sh) => (
                  <button
                    key={sh.val}
                    onClick={() => setTextShadow(sh.val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      textShadow === sh.val
                        ? "bg-accent/15 border-accent text-accent font-bold"
                        : "bg-[#16161C] border-border text-text-muted hover:text-white"
                    }`}
                  >
                    {sh.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uppercase Transform Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-text-primary">Force ALL CAPS</span>
              <button
                onClick={() => setIsUppercase(!isUppercase)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isUppercase ? "bg-accent" : "bg-[#27272D]"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isUppercase ? "left-6" : "left-1"
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TEXT */}
        {/* ========================================================================= */}
        {activeTab === "text" && (
          <div className="space-y-4 pt-1">
            {/* Lines Toggle (1 Line vs 2 Lines) */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Display Lines
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#16161C] p-1 rounded-xl border border-border">
                <button
                  onClick={() => setLinesCount(1)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    linesCount === 1
                      ? "bg-accent text-black shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  1 Line (Reels)
                </button>
                <button
                  onClick={() => setLinesCount(2)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    linesCount === 2
                      ? "bg-accent text-black shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  2 Lines (Standard)
                </button>
              </div>
            </div>

            {/* Max Words Per Caption */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                <span>Words Per Caption</span>
                <span className="text-accent font-mono text-xs">{maxWordsPerCaption} words</span>
              </div>
              <input
                type="range"
                min={2}
                max={9}
                value={maxWordsPerCaption}
                onChange={(e) => setMaxWordsPerCaption(parseInt(e.target.value))}
                className="w-full h-1.5 accent-accent bg-bg-control rounded-lg cursor-pointer"
              />
            </div>

            {/* Output Mode (Tanglish vs Tamil Script vs English) */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Transcription Output Mode
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "tanglish", label: "Tanglish (Romanized Tamil)", desc: "e.g. 'Namma video-va edit pannalaam'" },
                  { id: "tamil", label: "Tamil Script", desc: "e.g. 'நம்ம வீடியோவை எடிட் பண்ணலாம்'" },
                  { id: "english", label: "English Translation", desc: "e.g. 'Let us edit the video'" },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setOutputMode(mode.id as any)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      outputMode === mode.id
                        ? "bg-accent/15 border-accent text-accent"
                        : "bg-[#16161C] border-border text-text-secondary hover:border-text-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">{mode.label}</span>
                      {outputMode === mode.id && <Check size={14} className="text-accent" />}
                    </div>
                    <span className="text-[10px] text-text-muted block mt-0.5">{mode.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spoken Audio Language */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Spoken Audio Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value as any)}
                className="w-full bg-[#16161C] border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="auto">Auto Detect</option>
                <option value="ta">Tamil (India)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
