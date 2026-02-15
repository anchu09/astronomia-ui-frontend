/**
 * Placeholder para el backend de análisis (astronomIA) o el BFF/n8n.
 * Cuando tengas la API, define VITE_API_URL en .env y descomenta la llamada real.
 */

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

export async function sendMessage(
  message: string,
  conversationId: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<SendMessageResult> {
  const base = API_BASE.replace(/\/$/, "");
  if (!base) {
    return {
      summary: `[Demo] Has dicho: «${message}». Cuando conectes el backend (astronomIA o n8n), la respuesta real aparecerá aquí. Configura VITE_API_URL en .env para llamar a la API.`,
    };
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
