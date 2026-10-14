const API_BASE = "/api";

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_BASE}/videos/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function startTranscription(
  videoId: string, 
  language: string = "auto", 
  outputMode: string = "tanglish",
  maxWordsPerSegment: number = 5
) {
  const res = await fetch(`${API_BASE}/transcription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      video_id: videoId, 
      language,
      output_mode: outputMode,
      max_words_per_segment: maxWordsPerSegment
    }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to start transcription");
  }
  return res.json();
}

export async function checkJobStatus(jobId: string) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to check job status");
  return res.json();
}

export async function startRender(
  videoId: string, 
  captions: any[], 
  template: string, 
  positionX: number = 50, 
  positionY: number = 80
) {
  const res = await fetch(`${API_BASE}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      video_id: videoId, 
      captions, 
      template,
      position_x: positionX,
      position_y: positionY
    }),
  });
  
  if (!res.ok) throw new Error("Failed to start render");
  return res.json();
}
