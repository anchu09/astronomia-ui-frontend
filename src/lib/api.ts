const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface AnalyzePayload {
  request_id: string;
  message: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

export interface AnalyzeResponse {
  request_id: string;
  status: "success" | "error";
  summary: string;
  results?: Record<string, unknown>;
  artifacts?: { type: string; path: string }[];
}

export interface SendMessageResult {
  summary: string;
  imageUrl?: string;
}

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "summary"; summary: string }
  | { type: "artifacts"; request_id: string; image_url?: string }
  | { type: "end"; request_id: string; status: string; summary?: string }
  | { type: "error"; message: string };

export async function sendMessage(
  message: string,
  conversationId: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<SendMessageResult> {
  const base = API_BASE.replace(/\/$/, "");
  if (!base) {
    return { summary: `[Sin API] Mensaje: «${message}». Configura VITE_API_URL.` };
  }

  const requestId = `${conversationId}-${Date.now()}`;
  const body: AnalyzePayload = {
    request_id: requestId,
    message,
    messages: history.length > 0 ? history : undefined,
  };

  const res = await fetch(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      summary: `Error del servidor: ${res.status}. ${text.slice(0, 200)}`,
    };
  }

  const data = (await res.json()) as AnalyzeResponse;
  if (data.status === "error") {
    return {
      summary: data.summary || "El análisis no pudo completarse.",
    };
  }

  const hasImage = (data.artifacts ?? []).some((a) => a.type === "image");
  const imageUrl = hasImage ? `${base}/artifacts/${data.request_id}/image` : undefined;

  return {
    summary: data.summary,
    ...(imageUrl && { imageUrl }),
  };
}

export async function sendMessageStream(
  message: string,
  conversationId: string,
  history: { role: "user" | "assistant"; content: string }[],
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const base = API_BASE.replace(/\/$/, "");
  if (!base) {
    onEvent({ type: "error", message: "VITE_API_URL no configurado." });
    return;
  }

  const requestId = `${conversationId}-${Date.now()}`;
  const body: AnalyzePayload = {
    request_id: requestId,
    message,
    messages: history.length > 0 ? history : undefined,
  };

  const res = await fetch(`${base}/analyze/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    onEvent({ type: "error", message: `Error ${res.status}: ${text.slice(0, 200)}` });
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onEvent({ type: "error", message: "No se pudo leer el stream." });
    return;
  }

  const dec = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        let data: string | null = null;
        for (const line of part.split("\n")) {
          if (line.startsWith("data: ")) data = line.slice(6);
        }
        if (data != null) {
          try {
            onEvent(JSON.parse(data) as StreamEvent);
          } catch {
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
