const API_BASE = "/api";

async function handleResponseError(res: Response, defaultMsg: string): Promise<never> {
  let errorDetail = "";
  try {
    const data = await res.json();
    if (data && data.detail) {
      errorDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // response was not JSON
  }

  if (res.status === 502 || res.status === 504) {
    throw new Error(
      "Backend server is offline or unreachable on port 8080. Please ensure the backend is running."
    );
  }

  throw new Error(errorDetail || `${defaultMsg} (${res.status} ${res.statusText})`);
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/videos/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend server. Please ensure the backend is running on port 8080."
    );
  }

  if (!res.ok) {
    await handleResponseError(res, "Upload failed");
  }
  return res.json();
}

export async function startTranscription(
  videoId: string,
  language: string = "auto",
  outputMode: string = "tanglish",
  maxWordsPerSegment: number = 5
) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/transcription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        language,
        output_mode: outputMode,
        max_words_per_segment: maxWordsPerSegment
      }),
    });
  } catch {
    throw new Error("Cannot connect to backend server. Please ensure the backend is running on port 8080.");
  }

  if (!res.ok) {
    await handleResponseError(res, "Failed to start transcription");
  }
  return res.json();
}

export async function checkJobStatus(jobId: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/jobs/${jobId}`);
  } catch {
    throw new Error("Network error while checking job status.");
  }
  if (!res.ok) {
    await handleResponseError(res, "Failed to check job status");
  }
  return res.json();
}

export async function startRender(
  videoId: string,
  captions: any[],
  template: string,
  positionX: number = 50,
  positionY: number = 80
) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/render`, {
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
  } catch {
    throw new Error("Cannot connect to backend server for video rendering.");
  }

  if (!res.ok) {
    await handleResponseError(res, "Failed to start render");
  }
  return res.json();
}
