import { create } from 'zustand'

export interface Word {
  id: string;
  text: string;
  start: number;
  end: number;
  segmentId: string;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

export interface VideoMetadata {
  file: File | null;
  url: string | null;
  duration: number;
  width: number;
  height: number;
}

export type OutputMode = 'tanglish' | 'tamil' | 'english';
export type SourceLanguage = 'auto' | 'ta' | 'en';
export type CaptionLayout = 'one-line' | 'two-line';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';
export type TextPosition = 'top' | 'middle' | 'bottom' | 'custom';
export type TextAlign = 'left' | 'center' | 'right';

export interface Preset {
  id: string;
  name: string;
  template: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  activeHighlightColor: string;
  textBg: string;
  textPosition: TextPosition;
  textPositionX?: number;
  textPositionY?: number;
  textAlign: TextAlign;
  textStroke: string;
  textShadow: string;
  isUppercase: boolean;
}

interface EditorState {
  video: VideoMetadata;
  captions: CaptionSegment[];
  currentTime: number;
  isPlaying: boolean;
  activeTab: 'templates' | 'customize' | 'text';
  activeTemplate: string;
  templateCategory: 'templates' | 'presets';
  templateSearchQuery: string;
  bannerDismissed: boolean;
  userPresets: Preset[];
  
  // Settings & styling
  outputMode: OutputMode;
  sourceLanguage: SourceLanguage;
  maxWordsPerCaption: number;
  captionLayout: CaptionLayout;
  aspectRatio: AspectRatio;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  activeHighlightColor: string;
  textBg: string;
  textStroke: string;
  textShadow: string;
  isUppercase: boolean;
  textPosition: TextPosition;
  textPositionX: number;
  textPositionY: number;
  textAlign: TextAlign;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  linesCount: 1 | 2;
  captionSettingsOpen: boolean;
  
  // Selection
  selectedCaptionId: string | null;
  selectedWordId: string | null;
  
  // History & dirty state
  hasUnsavedEdits: boolean;
  history: CaptionSegment[][];
  historyIndex: number;
  
  // Actions
  setVideo: (video: Partial<VideoMetadata>) => void;
  setCaptions: (captions: CaptionSegment[], resetHistory?: boolean) => void;
  updateCaption: (id: string, updates: Partial<CaptionSegment>) => void;
  updateWord: (segmentId: string, wordId: string, updates: Partial<Word>) => void;
  addCaption: (afterId?: string) => void;
  deleteCaption: (id: string) => void;
  splitCaptionAtWord: (segmentId: string, wordId: string) => void;
  mergeCaptions: (segmentId1: string, segmentId2: string) => void;
  
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveTab: (tab: 'templates' | 'customize' | 'text') => void;
  setActiveTemplate: (template: string) => void;
  setTemplateCategory: (category: 'templates' | 'presets') => void;
  setTemplateSearchQuery: (query: string) => void;
  setBannerDismissed: (dismissed: boolean) => void;
  setFontFamily: (font: string) => void;
  setActiveHighlightColor: (color: string) => void;
  setTextStroke: (stroke: string) => void;
  setTextShadow: (shadow: string) => void;
  setIsUppercase: (val: boolean) => void;
  saveCurrentAsPreset: (name: string) => void;
  deletePreset: (id: string) => void;
  applyPreset: (preset: Preset) => void;
  
  setOutputMode: (mode: OutputMode) => void;
  setSourceLanguage: (lang: SourceLanguage) => void;
  setMaxWordsPerCaption: (count: number) => void;
  setCaptionLayout: (layout: CaptionLayout) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setTextBg: (bg: string) => void;
  setTextPosition: (pos: TextPosition) => void;
  setTextPositionCoords: (x: number, y: number) => void;
  setTextPositionX: (x: number) => void;
  setTextPositionY: (y: number) => void;
  setTextAlign: (align: TextAlign) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  setLinesCount: (lines: 1 | 2) => void;
  toggleCaptionSettings: () => void;
  
  setSelectedCaptionId: (id: string | null) => void;
  setSelectedWordId: (id: string | null) => void;
  
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  clearProject: () => void;
}

const MAX_HISTORY = 30;

function pushStateToHistory(history: CaptionSegment[][], historyIndex: number, current: CaptionSegment[]) {
  const truncated = history.slice(0, historyIndex + 1);
  const updated = [...truncated, JSON.parse(JSON.stringify(current))];
  if (updated.length > MAX_HISTORY) {
    updated.shift();
  }
  return {
    history: updated,
    historyIndex: updated.length - 1
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  video: {
    file: null,
    url: null,
    duration: 0,
    width: 0,
    height: 0,
  },
  captions: [],
  currentTime: 0,
  isPlaying: false,
  activeTab: 'templates',
  activeTemplate: 'Captik Glow',
  templateCategory: 'templates',
  templateSearchQuery: '',
  bannerDismissed: false,
  userPresets: [
    {
      id: 'preset-default-1',
      name: 'Captik Ambient Gold',
      template: 'Captik Glow',
      fontFamily: 'Outfit',
      fontSize: 28,
      textColor: '#FFFFFF',
      activeHighlightColor: '#FFB800',
      textBg: 'transparent',
      textPosition: 'bottom',
      textPositionX: 50,
      textPositionY: 80,
      textAlign: 'center',
      textStroke: 'none',
      textShadow: '0 0 16px rgba(255, 184, 0, 0.9)',
      isUppercase: false
    }
  ],
  
  outputMode: 'tanglish',       // DEFAULT: Tanglish
  sourceLanguage: 'auto',
  maxWordsPerCaption: 5,
  captionLayout: 'one-line',
  aspectRatio: '9:16',
  fontSize: 28,
  fontFamily: 'Outfit',
  textColor: '#FFFFFF',
  activeHighlightColor: '#FFB800',
  textBg: 'transparent',
  textStroke: 'none',
  textShadow: '0 0 16px rgba(255, 184, 0, 0.9)',
  isUppercase: false,
  textPosition: 'bottom',
  textPositionX: 50,
  textPositionY: 80,
  textAlign: 'center',
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,
  linesCount: 1,
  captionSettingsOpen: false,
  
  selectedCaptionId: null,
  selectedWordId: null,
  
  hasUnsavedEdits: false,
  history: [[]],
  historyIndex: 0,

  setVideo: (videoUpdates) => set((state) => ({ 
    video: { ...state.video, ...videoUpdates } 
  })),
  
  setCaptions: (captions, resetHistory = false) => {
    if (resetHistory) {
      set({
        captions,
        hasUnsavedEdits: false,
        history: [JSON.parse(JSON.stringify(captions))],
        historyIndex: 0
      });
    } else {
      const { history, historyIndex } = get();
      const nextHistory = pushStateToHistory(history, historyIndex, captions);
      set({
        captions,
        hasUnsavedEdits: true,
        ...nextHistory
      });
    }
  },
  
  updateCaption: (id, updates) => {
    const { captions, history, historyIndex } = get();
    const updatedCaptions = captions.map((cap) => {
      if (cap.id !== id) return cap;
      const merged = { ...cap, ...updates };
      // If text changed directly without words edit, update text
      return merged;
    });
    
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  updateWord: (segmentId, wordId, updates) => {
    const { captions, history, historyIndex } = get();
    const updatedCaptions = captions.map((cap) => {
      if (cap.id !== segmentId) return cap;
      const updatedWords = (cap.words || []).map((w) => 
        w.id === wordId ? { ...w, ...updates } : w
      );
      // Recalculate segment text and bounds from updated words
      const fullText = updatedWords.map((w) => w.text).join(' ');
      const newStart = updatedWords.length ? Math.min(...updatedWords.map(w => w.start)) : cap.start;
      const newEnd = updatedWords.length ? Math.max(...updatedWords.map(w => w.end)) : cap.end;
      
      return {
        ...cap,
        words: updatedWords,
        text: fullText,
        start: Number(newStart.toFixed(2)),
        end: Number(newEnd.toFixed(2))
      };
    });
    
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  addCaption: (afterId) => {
    const { captions, currentTime, history, historyIndex } = get();
    const newId = `segment-${Math.random().toString(36).substring(2, 8)}`;
    const wordId = `word-${Math.random().toString(36).substring(2, 8)}`;
    
    let startTime = currentTime;
    let endTime = Number((currentTime + 2.0).toFixed(2));
    
    if (afterId) {
      const idx = captions.findIndex(c => c.id === afterId);
      if (idx !== -1) {
        startTime = Number((captions[idx].end + 0.1).toFixed(2));
        endTime = Number((startTime + 2.0).toFixed(2));
      }
    }
    
    const newCaption: CaptionSegment = {
      id: newId,
      start: startTime,
      end: endTime,
      text: "New caption",
      words: [
        { id: wordId, text: "New", start: startTime, end: Number((startTime + 0.8).toFixed(2)), segmentId: newId },
        { id: `word-${Math.random().toString(36).substring(2, 8)}`, text: "caption", start: Number((startTime + 0.8).toFixed(2)), end: endTime, segmentId: newId }
      ]
    };
    
    let updatedCaptions: CaptionSegment[];
    if (afterId) {
      const idx = captions.findIndex(c => c.id === afterId);
      updatedCaptions = [
        ...captions.slice(0, idx + 1),
        newCaption,
        ...captions.slice(idx + 1)
      ];
    } else {
      updatedCaptions = [...captions, newCaption].sort((a, b) => a.start - b.start);
    }
    
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedCaptionId: newId,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  deleteCaption: (id) => {
    const { captions, history, historyIndex, selectedCaptionId } = get();
    const updatedCaptions = captions.filter(c => c.id !== id);
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedCaptionId: selectedCaptionId === id ? null : selectedCaptionId,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  splitCaptionAtWord: (segmentId, wordId) => {
    const { captions, history, historyIndex } = get();
    const segIdx = captions.findIndex(c => c.id === segmentId);
    if (segIdx === -1) return;
    
    const seg = captions[segIdx];
    const wordIdx = (seg.words || []).findIndex(w => w.id === wordId);
    if (wordIdx <= 0) return; // Cannot split before index 0
    
    const firstWords = seg.words.slice(0, wordIdx);
    const secondWordsRaw = seg.words.slice(wordIdx);
    
    const newSegId = `segment-${Math.random().toString(36).substring(2, 8)}`;
    const secondWords = secondWordsRaw.map(w => ({ ...w, segmentId: newSegId }));
    
    const firstSeg: CaptionSegment = {
      id: seg.id,
      start: firstWords[0].start,
      end: firstWords[firstWords.length - 1].end,
      text: firstWords.map(w => w.text).join(' '),
      words: firstWords
    };
    
    const secondSeg: CaptionSegment = {
      id: newSegId,
      start: secondWords[0].start,
      end: secondWords[secondWords.length - 1].end,
      text: secondWords.map(w => w.text).join(' '),
      words: secondWords
    };
    
    const updatedCaptions = [
      ...captions.slice(0, segIdx),
      firstSeg,
      secondSeg,
      ...captions.slice(segIdx + 1)
    ];
    
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedCaptionId: newSegId,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  mergeCaptions: (segmentId1, segmentId2) => {
    const { captions, history, historyIndex } = get();
    const seg1 = captions.find(c => c.id === segmentId1);
    const seg2 = captions.find(c => c.id === segmentId2);
    if (!seg1 || !seg2) return;
    
    const combinedWords = [
      ...(seg1.words || []),
      ...(seg2.words || []).map(w => ({ ...w, segmentId: seg1.id }))
    ];
    
    const mergedSeg: CaptionSegment = {
      id: seg1.id,
      start: Math.min(seg1.start, seg2.start),
      end: Math.max(seg1.end, seg2.end),
      text: combinedWords.map(w => w.text).join(' '),
      words: combinedWords
    };
    
    const updatedCaptions = captions
      .filter(c => c.id !== segmentId2)
      .map(c => c.id === seg1.id ? mergedSeg : c)
      .sort((a, b) => a.start - b.start);
      
    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedCaptionId: seg1.id,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({
        captions: JSON.parse(JSON.stringify(history[prevIndex])),
        historyIndex: prevIndex,
        hasUnsavedEdits: true
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({
        captions: JSON.parse(JSON.stringify(history[nextIndex])),
        historyIndex: nextIndex,
        hasUnsavedEdits: true
      });
    }
  },
  
  markSaved: () => set({ hasUnsavedEdits: false }),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTemplate: (template) => {
    let updates: Partial<EditorState> = { activeTemplate: template };
    if (template === 'Captik Glow') {
      updates = { ...updates, fontFamily: 'Outfit', textColor: '#FFFFFF', activeHighlightColor: '#FFB800', textShadow: '0 0 16px rgba(255, 184, 0, 0.9)', textStroke: 'none', isUppercase: false, textBg: 'transparent' };
    } else if (template === 'Captik Shadow') {
      updates = { ...updates, fontFamily: 'Montserrat', textColor: '#FFFFFF', activeHighlightColor: '#FFC526', textShadow: '0 6px 12px rgba(0, 0, 0, 0.95)', textStroke: '1.5px rgba(0,0,0,0.8)', isUppercase: false, textBg: 'transparent' };
    } else if (template === 'Scribble') {
      updates = { ...updates, fontFamily: "'Caveat', cursive", textColor: '#FFFFFF', activeHighlightColor: '#FFD600', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)', textStroke: 'none', isUppercase: false, textBg: 'transparent' };
    } else if (template === 'Archives') {
      updates = { ...updates, fontFamily: 'Inter', textColor: '#F3F4F6', activeHighlightColor: '#E5E7EB', textShadow: 'none', textStroke: 'none', isUppercase: true, textBg: 'rgba(0, 0, 0, 0.75)' };
    } else if (template === 'Karaoke Pop' || template === 'Karaoke') {
      updates = { ...updates, fontFamily: 'Outfit', textColor: '#FFFFFF', activeHighlightColor: '#FFB800', textShadow: '0 0 14px rgba(255, 184, 0, 0.8)', textStroke: 'none', isUppercase: false, textBg: 'transparent' };
    } else if (template === 'Bold Punch' || template === 'Bold') {
      updates = { ...updates, fontFamily: "'Anton', sans-serif", textColor: '#FFB800', activeHighlightColor: '#FFFFFF', textShadow: '0 4px 6px rgba(0, 0, 0, 0.9)', textStroke: '2px black', isUppercase: true, textBg: 'transparent' };
    } else if (template === 'Clean Minimal' || template === 'Clean') {
      updates = { ...updates, fontFamily: 'Inter', textColor: '#FFFFFF', activeHighlightColor: '#FFB800', textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)', textStroke: 'none', isUppercase: false, textBg: 'rgba(0, 0, 0, 0.45)' };
    } else if (template === 'Neon Cyber') {
      updates = { ...updates, fontFamily: 'Montserrat', textColor: '#00F0FF', activeHighlightColor: '#FFE600', textShadow: '0 0 18px rgba(0, 240, 255, 0.85)', textStroke: 'none', isUppercase: true, textBg: 'transparent' };
    } else if (template === 'Impact Meme' || template === 'Meme') {
      updates = { ...updates, fontFamily: 'Impact, sans-serif', textColor: '#FFFFFF', activeHighlightColor: '#FFFFFF', textShadow: '0 3px 2px rgba(0, 0, 0, 1)', textStroke: '2px black', isUppercase: true, textBg: 'transparent' };
    } else if (template === 'Cinematic Serif' || template === 'Cinematic') {
      updates = { ...updates, fontFamily: 'Georgia, serif', textColor: '#F9FAFB', activeHighlightColor: '#FFD700', textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)', textStroke: 'none', isUppercase: false, textBg: 'transparent' };
    }
    set(updates);
  },
  
  setTemplateCategory: (category) => set({ templateCategory: category }),
  setTemplateSearchQuery: (query) => set({ templateSearchQuery: query }),
  setBannerDismissed: (dismissed) => set({ bannerDismissed: dismissed }),
  setFontFamily: (font) => set({ fontFamily: font }),
  setActiveHighlightColor: (color) => set({ activeHighlightColor: color }),
  setTextStroke: (stroke) => set({ textStroke: stroke }),
  setTextShadow: (shadow) => set({ textShadow: shadow }),
  setIsUppercase: (val) => set({ isUppercase: val }),
  
  saveCurrentAsPreset: (name) => {
    const s = get();
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name: name.trim() || `Custom Preset ${s.userPresets.length + 1}`,
      template: s.activeTemplate,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      textColor: s.textColor,
      activeHighlightColor: s.activeHighlightColor,
      textBg: s.textBg,
      textPosition: s.textPosition,
      textPositionX: s.textPositionX,
      textPositionY: s.textPositionY,
      textAlign: s.textAlign,
      textStroke: s.textStroke,
      textShadow: s.textShadow,
      isUppercase: s.isUppercase
    };
    set({ userPresets: [...s.userPresets, newPreset] });
  },
  
  deletePreset: (id) => {
    set(state => ({ userPresets: state.userPresets.filter(p => p.id !== id) }));
  },
  
  applyPreset: (preset) => {
    set({
      activeTemplate: preset.template,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      textColor: preset.textColor,
      activeHighlightColor: preset.activeHighlightColor,
      textBg: preset.textBg,
      textPosition: preset.textPosition,
      textPositionX: preset.textPositionX ?? 50,
      textPositionY: preset.textPositionY ?? 80,
      textAlign: preset.textAlign,
      textStroke: preset.textStroke,
      textShadow: preset.textShadow,
      isUppercase: preset.isUppercase
    });
  },
  
  setOutputMode: (mode) => set({ outputMode: mode }),
  setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
  setMaxWordsPerCaption: (count) => set({ maxWordsPerCaption: count }),
  setCaptionLayout: (layout) => set({ captionLayout: layout }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  setFontSize: (size) => set({ fontSize: size }),
  setTextColor: (color) => set({ textColor: color }),
  setTextBg: (bg) => set({ textBg: bg }),
  setTextPosition: (pos) => {
    if (pos === 'top') {
      set({ textPosition: 'top', textPositionX: 50, textPositionY: 14 });
    } else if (pos === 'middle') {
      set({ textPosition: 'middle', textPositionX: 50, textPositionY: 50 });
    } else if (pos === 'bottom') {
      set({ textPosition: 'bottom', textPositionX: 50, textPositionY: 80 });
    } else {
      set({ textPosition: 'custom' });
    }
  },
  setTextPositionCoords: (x, y) => set({
    textPosition: 'custom',
    textPositionX: Math.max(5, Math.min(95, Math.round(x))),
    textPositionY: Math.max(5, Math.min(95, Math.round(y)))
  }),
  setTextPositionX: (x) => set({
    textPosition: 'custom',
    textPositionX: Math.max(5, Math.min(95, Math.round(x)))
  }),
  setTextPositionY: (y) => set({
    textPosition: 'custom',
    textPositionY: Math.max(5, Math.min(95, Math.round(y)))
  }),
  setTextAlign: (align) => set({ textAlign: align }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (vol) => set({ volume: vol }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setLinesCount: (lines) => set({ linesCount: lines }),
  toggleCaptionSettings: () => set((state) => ({ captionSettingsOpen: !state.captionSettingsOpen })),
  
  setSelectedCaptionId: (id) => set({ selectedCaptionId: id }),
  setSelectedWordId: (id) => set({ selectedWordId: id }),
  
  clearProject: () => set({
    video: { file: null, url: null, duration: 0, width: 0, height: 0 },
    captions: [],
    currentTime: 0,
    isPlaying: false,
    selectedCaptionId: null,
    selectedWordId: null,
    hasUnsavedEdits: false,
    history: [[]],
    historyIndex: 0
  })
}))
