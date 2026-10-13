/**
 * Utility functions for formatting and parsing video timestamps.
 */

export function formatTimestamp(seconds: number, precision: 2 | 3 = 2): string {
  if (isNaN(seconds) || seconds < 0) return precision === 3 ? "00:00.000" : "00:00.00";
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  
  const fractional = (secs - wholeSecs).toFixed(precision).slice(2);
  
  const minsStr = mins.toString().padStart(2, "0");
  const secsStr = wholeSecs.toString().padStart(2, "0");
  
  return `${minsStr}:${secsStr}.${fractional}`;
}

export function parseTimestamp(input: string): number | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  
  // Format MM:SS.mmm or MM:SS.cs or M:SS.s
  const colonParts = trimmed.split(":");
  if (colonParts.length === 2) {
    const mins = parseFloat(colonParts[0]);
    const secs = parseFloat(colonParts[1]);
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) return null;
    return Number((mins * 60 + secs).toFixed(3));
  }
  
  // Format pure seconds: e.g. "12.45"
  if (colonParts.length === 1) {
    const secs = parseFloat(colonParts[0]);
    if (isNaN(secs) || secs < 0) return null;
    return Number(secs.toFixed(3));
  }
  
  return null;
}

export function formatClockTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
