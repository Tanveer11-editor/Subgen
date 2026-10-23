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
export type CaptionDisplayMode = 'word' | 'line';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | 'original';
export type TextPosition = 'top' | 'middle' | 'bottom' | 'custom';
export type TextAlign = 'left' | 'center' | 'right';
export type ActiveTool = 'select' | 'blade';
export type PauseMode = 'keep' | 'natural' | 'tight';

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

export interface EditorState {
  video: VideoMetadata;
  captions: CaptionSegment[];
  currentTime: number;
  isPlaying: boolean;
  isReversing: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;

  // Project Info & Top Bar
  projectTitle: string;
  resolution: '1080p' | '720p';
  hasWatermark: boolean;

  // Trimming & Timeline
  trimStart: number;
  trimEnd: number;
  activeTool: ActiveTool;
  captionDisplayMode: CaptionDisplayMode;
  pauseMode: PauseMode;
  timelineZoom: number;

  // Tabs & Templates
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
  updateWordTiming: (segmentId: string, wordId: string, newStart: number, newEnd: number) => void;
  shiftWord: (segmentId: string, wordId: string, deltaSeconds: number) => void;
  splitAtPlayhead: (time?: number) => void;
  splitCaptionAtWord: (segmentId: string, wordId: string) => void;
  mergeCaptions: (segmentId1: string, segmentId2: string) => void;
  addCaption: (afterId?: string) => void;
  deleteCaption: (id: string) => void;
  deleteWord: (segmentId: string, wordId: string) => void;

  // Player & Shuttle controls
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsReversing: (reversing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  cycleForwardSpeed: () => void;
  startReversePlayback: () => void;
  stopPlayback: () => void;
  togglePlayPause: () => void;

  // Trimming & Tools
  setTrimStart: (start: number) => void;
  setTrimEnd: (end: number) => void;
  setTrimRange: (start: number, end: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setCaptionDisplayMode: (mode: CaptionDisplayMode) => void;
  setPauseMode: (mode: PauseMode) => void;
  setTimelineZoom: (zoom: number) => void;

  // Project details
  setProjectTitle: (title: string) => void;
  setResolution: (res: '1080p' | '720p') => void;
  setHasWatermark: (val: boolean) => void;

  // Panels & Styling
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
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  setLinesCount: (lines: 1 | 2) => void;
  toggleCaptionSettings: () => void;

  setSelectedCaptionId: (id: string | null) => void;
  setSelectedWordId: (id: string | null) => void;

  // Auto-generation & new video handling
  needsTranscription: boolean;
  setNeedsTranscription: (needs: boolean) => void;
  loadNewVideo: (file: File) => void;
  loadDemoProject: () => void;

  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  clearProject: () => void;
}

const MAX_HISTORY = 40;

function pushStateToHistory(history: CaptionSegment[][], historyIndex: number, current: CaptionSegment[]) {
  const truncated = history.slice(0, historyIndex + 1);
  const updated = [...truncated, JSON.parse(JSON.stringify(current))];
  if (updated.length > MAX_HISTORY) {
    updated.shift();
  }
  return {
    history: updated,
    historyIndex: updated.length - 1,
  };
}

// Sample initial Tanglish captions matching the Captik screenshot
const INITIAL_CAPTIONS: CaptionSegment[] = [
  {
    id: "cap-1",
    start: 0.0,
    end: 1.8,
    text: "Present sir attendance",
    words: [
      { id: "w-1", text: "Present", start: 0.0, end: 0.6, segmentId: "cap-1" },
      { id: "w-2", text: "sir", start: 0.6, end: 1.1, segmentId: "cap-1" },
      { id: "w-3", text: "attendance", start: 1.1, end: 1.8, segmentId: "cap-1" }
    ]
  },
  {
    id: "cap-2",
    start: 1.8,
    end: 3.4,
    text: "Yashika attendance sollu",
    words: [
      { id: "w-4", text: "Yashika", start: 1.8, end: 2.4, segmentId: "cap-2" },
      { id: "w-5", text: "attendance", start: 2.4, end: 2.9, segmentId: "cap-2" },
      { id: "w-6", text: "sollu", start: 2.9, end: 3.4, segmentId: "cap-2" }
    ]
  },
  {
    id: "cap-3",
    start: 3.4,
    end: 4.8,
    text: "so aayiruchu attendance",
    words: [
      { id: "w-7", text: "so", start: 3.4, end: 3.7, segmentId: "cap-3" },
      { id: "w-8", text: "aayiruchu", start: 3.7, end: 4.2, segmentId: "cap-3" },
      { id: "w-9", text: "attendance", start: 4.2, end: 4.8, segmentId: "cap-3" }
    ]
  },
  {
    id: "cap-4",
    start: 4.8,
    end: 6.4,
    text: "1 period-e mudinjiduchu",
    words: [
      { id: "w-10", text: "1", start: 4.8, end: 5.1, segmentId: "cap-4" },
      { id: "w-11", text: "period-e", start: 5.1, end: 5.7, segmentId: "cap-4" },
      { id: "w-12", text: "mudinjiduchu", start: 5.7, end: 6.4, segmentId: "cap-4" }
    ]
  },
  {
    id: "cap-5",
    start: 6.4,
    end: 7.9,
    text: "la Appa idhukku",
    words: [
      { id: "w-13", text: "la", start: 6.4, end: 6.8, segmentId: "cap-5" },
      { id: "w-14", text: "Appa", start: 6.8, end: 7.3, segmentId: "cap-5" },
      { id: "w-15", text: "idhukku", start: 7.3, end: 7.9, segmentId: "cap-5" }
    ]
  },
  {
    id: "cap-6",
    start: 7.9,
    end: 8.8,
    text: "period-e murundundhu",
    words: [
      { id: "w-16", text: "period-e", start: 7.9, end: 8.3, segmentId: "cap-6" },
      { id: "w-17", text: "murundundhu", start: 8.3, end: 8.8, segmentId: "cap-6" }
    ]
  },
  {
    id: "cap-7",
    start: 8.8,
    end: 9.3,
    text: "la Appa idhukku",
    words: [
      { id: "w-18", text: "la", start: 8.8, end: 8.95, segmentId: "cap-7" },
      { id: "w-19", text: "Appa", start: 8.95, end: 9.15, segmentId: "cap-7" },
      { id: "w-20", text: "idhukku", start: 9.15, end: 9.3, segmentId: "cap-7" }
    ]
  },
  {
    id: "cap-8",
    start: 9.3,
    end: 9.6,
    text: "solution think pannaa",
    words: [
      { id: "w-21", text: "solution", start: 9.3, end: 9.4, segmentId: "cap-8" },
      { id: "w-22", text: "think", start: 9.4, end: 9.5, segmentId: "cap-8" },
      { id: "w-23", text: "pannaa", start: 9.5, end: 9.6, segmentId: "cap-8" }
    ]
  },
  {
    id: "cap-9",
    start: 9.6,
    end: 10.1,
    text: "nalaa aapne",
    words: [
      { id: "w-24", text: "nalaa", start: 9.6, end: 9.85, segmentId: "cap-9" },
      { id: "w-25", text: "aapne", start: 9.85, end: 10.1, segmentId: "cap-9" }
    ]
  },
  {
    id: "cap-10",
    start: 10.4,
    end: 11.5,
    text: "Nammama students thana",
    words: [
      { id: "w-26", text: "Nammama", start: 10.4, end: 10.75, segmentId: "cap-10" },
      { id: "w-27", text: "students", start: 10.75, end: 11.15, segmentId: "cap-10" },
      { id: "w-28", text: "thana", start: 11.15, end: 11.5, segmentId: "cap-10" }
    ]
  },
  {
    id: "cap-11",
    start: 11.5,
    end: 12.5,
    text: "namli idhukkula solution",
    words: [
      { id: "w-29", text: "namli", start: 11.5, end: 11.8, segmentId: "cap-11" },
      { id: "w-30", text: "idhukkula", start: 11.8, end: 12.15, segmentId: "cap-11" },
      { id: "w-31", text: "solution", start: 12.15, end: 12.5, segmentId: "cap-11" }
    ]
  },
  {
    id: "cap-12",
    start: 12.6,
    end: 13.4,
    text: "find pannaa na",
    words: [
      { id: "w-32", text: "find", start: 12.6, end: 12.85, segmentId: "cap-12" },
      { id: "w-33", text: "pannaa", start: 12.85, end: 13.15, segmentId: "cap-12" },
      { id: "w-34", text: "na", start: 13.15, end: 13.4, segmentId: "cap-12" }
    ]
  },
  {
    id: "cap-13",
    start: 13.5,
    end: 14.8,
    text: "Maybe automatic attendance",
    words: [
      { id: "w-35", text: "Maybe", start: 13.5, end: 14.1, segmentId: "cap-13" },
      { id: "w-36", text: "automatic", start: 14.1, end: 14.8, segmentId: "cap-13" }
    ]
  },
  {
    id: "cap-14",
    start: 14.8,
    end: 15.8,
    text: "attendance illa",
    words: [
      { id: "w-37", text: "attendance", start: 14.8, end: 15.3, segmentId: "cap-14" },
      { id: "w-38", text: "illa", start: 15.3, end: 15.8, segmentId: "cap-14" }
    ]
  },
  {
    id: "cap-15",
    start: 15.8,
    end: 17.5,
    text: "biometric Illa Bio",
    words: [
      { id: "w-39", text: "biometric", start: 15.8, end: 16.35, segmentId: "cap-15" },
      { id: "w-40", text: "Illa", start: 16.35, end: 16.7, segmentId: "cap-15" },
      { id: "w-41", text: "Bio", start: 16.7, end: 17.5, segmentId: "cap-15" }
    ]
  }
];

export const useEditorStore = create<EditorState>((set, get) => ({
  video: {
    file: null,
    url: "/demo_video.mp4",
    duration: 13.2,
    width: 1080,
    height: 1920,
  },
  captions: INITIAL_CAPTIONS,
  currentTime: 0,
  isPlaying: false,
  isReversing: false,
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,

  // Project Info
  projectTitle: "AQM1CbKLwHZlzkYqFL2wkYc",
  resolution: "1080p",
  hasWatermark: false,

  // Trimming & Tools
  trimStart: 0,
  trimEnd: 13.2,
  activeTool: "select",
  captionDisplayMode: "line",
  pauseMode: "keep",
  timelineZoom: 1.0,

  // Panels & styling
  activeTab: 'templates',
  activeTemplate: 'Glow',
  templateCategory: 'templates',
  templateSearchQuery: '',
  bannerDismissed: false,
  userPresets: [
    {
      id: 'preset-default-1',
      name: 'Ambient Gold',
      template: 'Glow',
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

  outputMode: 'tanglish',
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
  linesCount: 1,
  captionSettingsOpen: false,

  selectedCaptionId: "cap-7",
  selectedWordId: "w-19",

  hasUnsavedEdits: false,
  history: [JSON.parse(JSON.stringify(INITIAL_CAPTIONS))],
  historyIndex: 0,

  needsTranscription: false,
  setNeedsTranscription: (needs) => set({ needsTranscription: needs }),

  loadNewVideo: (file: File) => {
    const prevUrl = get().video.url;
    if (prevUrl && prevUrl.startsWith("blob:")) {
      try { URL.revokeObjectURL(prevUrl); } catch {}
    }
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, "") || "Untitled Video";
    set({
      video: {
        file,
        url,
        duration: 0,
        width: 1080,
        height: 1920,
      },
      captions: [],
      history: [[]],
      historyIndex: 0,
      hasUnsavedEdits: false,
      currentTime: 0,
      trimStart: 0,
      trimEnd: 0,
      projectTitle: title,
      selectedCaptionId: null,
      selectedWordId: null,
      needsTranscription: true,
      isPlaying: false,
      isReversing: false,
    });
  },

  loadDemoProject: () => {
    set({
      video: {
        file: null,
        url: "/demo_video.mp4",
        duration: 13.2,
        width: 1080,
        height: 1920,
      },
      captions: JSON.parse(JSON.stringify(INITIAL_CAPTIONS)),
      history: [JSON.parse(JSON.stringify(INITIAL_CAPTIONS))],
      historyIndex: 0,
      hasUnsavedEdits: false,
      currentTime: 0,
      trimStart: 0,
      trimEnd: 13.2,
      projectTitle: "Tamil Speech Demo",
      selectedCaptionId: null,
      selectedWordId: null,
      needsTranscription: false,
      isPlaying: false,
      isReversing: false,
    });
  },

  setVideo: (videoUpdates) => set((state) => {
    const isNewFile = Boolean(videoUpdates.file && videoUpdates.file !== state.video.file);
    const updated = { ...state.video, ...videoUpdates };
    if (isNewFile) {
      const title = videoUpdates.file?.name ? videoUpdates.file.name.replace(/\.[^/.]+$/, "") : state.projectTitle;
      return {
        video: updated,
        captions: [],
        history: [[]],
        historyIndex: 0,
        hasUnsavedEdits: false,
        currentTime: 0,
        trimStart: 0,
        trimEnd: updated.duration || 0,
        projectTitle: title,
        selectedCaptionId: null,
        selectedWordId: null,
        needsTranscription: true,
        isPlaying: false,
        isReversing: false,
      };
    }
    return {
      video: updated,
      trimEnd: (state.trimEnd === 13.2 || state.trimEnd === 0 || (updated.duration && state.trimEnd > updated.duration)) && updated.duration
        ? updated.duration
        : (state.trimEnd || updated.duration || 13.2)
    };
  }),

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
      const updated = { ...cap, ...updates };

      // When text is edited, resynchronize the words list so on-screen words and video render match
      if (updates.text !== undefined && updates.words === undefined) {
        const rawWords = updates.text.trim().split(/\s+/).filter(Boolean);
        const prevWords = cap.words || [];
        const capDuration = Math.max(0.2, updated.end - updated.start);

        if (rawWords.length === 0) {
          updated.words = [];
        } else if (rawWords.length === prevWords.length) {
          // Exactly same number of words: keep original word timing, update text
          updated.words = prevWords.map((pw, i) => ({
            ...pw,
            text: rawWords[i],
          }));
        } else {
          // Distribute words proportionally across segment duration
          const wordDur = capDuration / rawWords.length;
          updated.words = rawWords.map((wText, i) => {
            const wStart = Number((updated.start + (i * wordDur)).toFixed(2));
            const wEnd = Number((updated.start + ((i + 1) * wordDur)).toFixed(2));
            const prevId = prevWords[i]?.id || `w-${Math.random().toString(36).substring(2, 9)}`;
            return {
              id: prevId,
              text: wText,
              start: wStart,
              end: Math.max(wStart + 0.1, wEnd),
              segmentId: cap.id,
            };
          });
        }
      }

      return updated;
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

  updateWordTiming: (segmentId, wordId, newStart, newEnd) => {
    const { captions, history, historyIndex } = get();
    const cleanStart = Number(Math.max(0, newStart).toFixed(2));
    const cleanEnd = Number(Math.max(cleanStart + 0.05, newEnd).toFixed(2));

    const updatedCaptions = captions.map((cap) => {
      if (cap.id !== segmentId) return cap;

      const updatedWords = (cap.words || []).map((w) => {
        if (w.id === wordId) {
          return { ...w, start: cleanStart, end: cleanEnd };
        }
        return w;
      });

      // Recalculate segment bounds
      const minStart = Math.min(...updatedWords.map(w => w.start));
      const maxEnd = Math.max(...updatedWords.map(w => w.end));

      return {
        ...cap,
        words: updatedWords,
        start: Number(minStart.toFixed(2)),
        end: Number(maxEnd.toFixed(2))
      };
    }).sort((a, b) => a.start - b.start);

    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },

  shiftWord: (segmentId, wordId, deltaSeconds) => {
    const { captions, history, historyIndex } = get();
    const updatedCaptions = captions.map((cap) => {
      if (cap.id !== segmentId) return cap;
      const updatedWords = (cap.words || []).map((w) => {
        if (w.id === wordId) {
          const dur = w.end - w.start;
          const s = Math.max(0, Number((w.start + deltaSeconds).toFixed(2)));
          const e = Number((s + dur).toFixed(2));
          return { ...w, start: s, end: e };
        }
        return w;
      });
      const minStart = Math.min(...updatedWords.map(w => w.start));
      const maxEnd = Math.max(...updatedWords.map(w => w.end));
      return {
        ...cap,
        words: updatedWords,
        start: Number(minStart.toFixed(2)),
        end: Number(maxEnd.toFixed(2))
      };
    });

    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },

  splitAtPlayhead: (time) => {
    const { captions, currentTime, history, historyIndex } = get();
    const splitTime = typeof time === 'number' ? time : currentTime;

    // Find the caption containing this time
    const capIdx = captions.findIndex(c => splitTime >= c.start && splitTime <= c.end);
    if (capIdx === -1) return;

    const cap = captions[capIdx];
    if (!cap.words || cap.words.length <= 1) {
      // Split single text caption at time midpoint
      const mid = splitTime;
      const firstCap: CaptionSegment = {
        id: `cap-${Date.now()}-a`,
        start: cap.start,
        end: mid,
        text: cap.text.substring(0, Math.ceil(cap.text.length / 2)).trim() || cap.text,
        words: [
          {
            id: `w-${Date.now()}-a`,
            text: cap.text.substring(0, Math.ceil(cap.text.length / 2)).trim() || cap.text,
            start: cap.start,
            end: mid,
            segmentId: `cap-${Date.now()}-a`
          }
        ]
      };
      const secondCap: CaptionSegment = {
        id: `cap-${Date.now()}-b`,
        start: mid,
        end: cap.end,
        text: cap.text.substring(Math.ceil(cap.text.length / 2)).trim() || "...",
        words: [
          {
            id: `w-${Date.now()}-b`,
            text: cap.text.substring(Math.ceil(cap.text.length / 2)).trim() || "...",
            start: mid,
            end: cap.end,
            segmentId: `cap-${Date.now()}-b`
          }
        ]
      };

      const updatedCaptions = [
        ...captions.slice(0, capIdx),
        firstCap,
        secondCap,
        ...captions.slice(capIdx + 1)
      ];

      const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
      set({
        captions: updatedCaptions,
        selectedCaptionId: secondCap.id,
        hasUnsavedEdits: true,
        ...nextHistory
      });
      return;
    }

    // Split caption based on words
    const wordsBefore = cap.words.filter(w => w.end <= splitTime || (w.start < splitTime && (splitTime - w.start >= (w.end - w.start)/2)));
    const wordsAfter = cap.words.filter(w => !wordsBefore.includes(w));

    if (wordsBefore.length === 0 || wordsAfter.length === 0) {
      // Split between first word and remainder
      const firstW = cap.words.slice(0, 1);
      const restW = cap.words.slice(1);
      const newSegId = `seg-${Date.now()}`;

      const firstSeg: CaptionSegment = {
        id: cap.id,
        start: firstW[0].start,
        end: firstW[firstW.length - 1].end,
        text: firstW.map(w => w.text).join(' '),
        words: firstW
      };
      const secondSeg: CaptionSegment = {
        id: newSegId,
        start: restW[0].start,
        end: restW[restW.length - 1].end,
        text: restW.map(w => w.text).join(' '),
        words: restW.map(w => ({ ...w, segmentId: newSegId }))
      };
      const updatedCaptions = [
        ...captions.slice(0, capIdx),
        firstSeg,
        secondSeg,
        ...captions.slice(capIdx + 1)
      ];
      const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
      set({ captions: updatedCaptions, selectedCaptionId: newSegId, hasUnsavedEdits: true, ...nextHistory });
      return;
    }

    const newSegId = `seg-${Date.now()}`;
    const firstSeg: CaptionSegment = {
      id: cap.id,
      start: wordsBefore[0].start,
      end: wordsBefore[wordsBefore.length - 1].end,
      text: wordsBefore.map(w => w.text).join(' '),
      words: wordsBefore
    };
    const secondSeg: CaptionSegment = {
      id: newSegId,
      start: wordsAfter[0].start,
      end: wordsAfter[wordsAfter.length - 1].end,
      text: wordsAfter.map(w => w.text).join(' '),
      words: wordsAfter.map(w => ({ ...w, segmentId: newSegId }))
    };

    const updatedCaptions = [
      ...captions.slice(0, capIdx),
      firstSeg,
      secondSeg,
      ...captions.slice(capIdx + 1)
    ];

    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedCaptionId: newSegId,
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
    if (wordIdx <= 0) return;

    const firstWords = seg.words.slice(0, wordIdx);
    const secondWordsRaw = seg.words.slice(wordIdx);

    const newSegId = `seg-${Date.now()}`;
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

  addCaption: (afterId) => {
    const { captions, currentTime, history, historyIndex } = get();
    const newId = `seg-${Date.now()}`;
    const wordId = `w-${Date.now()}`;

    let startTime = currentTime;
    let endTime = Number((currentTime + 1.8).toFixed(2));

    if (afterId) {
      const idx = captions.findIndex(c => c.id === afterId);
      if (idx !== -1) {
        startTime = Number((captions[idx].end + 0.05).toFixed(2));
        endTime = Number((startTime + 1.8).toFixed(2));
      }
    }

    const newCaption: CaptionSegment = {
      id: newId,
      start: startTime,
      end: endTime,
      text: "New caption",
      words: [
        { id: wordId, text: "New", start: startTime, end: Number((startTime + 0.8).toFixed(2)), segmentId: newId },
        { id: `w-${Date.now()}-2`, text: "caption", start: Number((startTime + 0.8).toFixed(2)), end: endTime, segmentId: newId }
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

  deleteWord: (segmentId, wordId) => {
    const { captions, history, historyIndex } = get();
    const updatedCaptions = captions.map((cap) => {
      if (cap.id !== segmentId) return cap;
      const remainingWords = (cap.words || []).filter(w => w.id !== wordId);
      if (remainingWords.length === 0) return null;
      return {
        ...cap,
        words: remainingWords,
        text: remainingWords.map(w => w.text).join(' '),
        start: remainingWords[0].start,
        end: remainingWords[remainingWords.length - 1].end
      };
    }).filter(Boolean) as CaptionSegment[];

    const nextHistory = pushStateToHistory(history, historyIndex, updatedCaptions);
    set({
      captions: updatedCaptions,
      selectedWordId: null,
      hasUnsavedEdits: true,
      ...nextHistory
    });
  },

  // Player & Shuttle controls
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing, isReversing: false }),
  setIsReversing: (reversing) => set({ isReversing: reversing, isPlaying: false }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  cycleForwardSpeed: () => {
    const { isPlaying, isReversing, playbackSpeed } = get();
    if (isReversing) {
      set({ isReversing: false, isPlaying: true, playbackSpeed: 1.0 });
      return;
    }
    if (!isPlaying) {
      set({ isPlaying: true, isReversing: false, playbackSpeed: 1.0 });
      return;
    }
    // Already playing forward: cycle 1x -> 1.5x -> 2.0x -> 1x
    if (playbackSpeed < 1.4) {
      set({ playbackSpeed: 1.5 });
    } else if (playbackSpeed < 1.9) {
      set({ playbackSpeed: 2.0 });
    } else {
      set({ playbackSpeed: 1.0 });
    }
  },

  startReversePlayback: () => {
    const { isReversing, playbackSpeed } = get();
    if (!isReversing) {
      set({ isReversing: true, isPlaying: false, playbackSpeed: 1.0 });
    } else {
      // Toggle reverse speed: 1.0x <-> 2.0x
      set({ playbackSpeed: playbackSpeed === 1.0 ? 2.0 : 1.0 });
    }
  },

  stopPlayback: () => set({ isPlaying: false, isReversing: false }),

  togglePlayPause: () => {
    const { isPlaying, isReversing } = get();
    if (isPlaying || isReversing) {
      set({ isPlaying: false, isReversing: false });
    } else {
      set({ isPlaying: true, isReversing: false, playbackSpeed: 1.0 });
    }
  },

  // Trimming & Tools
  setTrimStart: (start) => set((s) => ({ trimStart: Math.max(0, Math.min(s.trimEnd - 0.5, start)) })),
  setTrimEnd: (end) => set((s) => ({ trimEnd: Math.max(s.trimStart + 0.5, end) })),
  setTrimRange: (start, end) => set({ trimStart: Math.max(0, start), trimEnd: Math.max(start + 0.5, end) }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCaptionDisplayMode: (mode) => set({ captionDisplayMode: mode }),
  setPauseMode: (mode) => set({ pauseMode: mode }),
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(3.0, zoom)) }),

  // Project Info
  setProjectTitle: (title) => set({ projectTitle: title }),
  setResolution: (res) => set({ resolution: res }),
  setHasWatermark: (val) => set({ hasWatermark: val }),

  // Panels & Styling
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTemplate: (template) => set({ activeTemplate: template }),
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
  setVolume: (vol) => set({ volume: vol }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setLinesCount: (lines) => set({ linesCount: lines }),
  toggleCaptionSettings: () => set((state) => ({ captionSettingsOpen: !state.captionSettingsOpen })),

  setSelectedCaptionId: (id) => set({ selectedCaptionId: id }),
  setSelectedWordId: (id) => set({ selectedWordId: id }),

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

  clearProject: () => set({
    video: { file: null, url: null, duration: 0, width: 1080, height: 1920 },
    captions: [],
    currentTime: 0,
    isPlaying: false,
    isReversing: false,
    selectedCaptionId: null,
    selectedWordId: null,
    hasUnsavedEdits: false,
    history: [[]],
    historyIndex: 0,
    projectTitle: "New Project",
    trimStart: 0,
    trimEnd: 0,
    needsTranscription: false,
  })
}))
