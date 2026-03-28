import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import {
  getConversations,
  getConversation,
  createConversation,
  appendMessage,
  updateMessage,
} from "@/lib/conversations";
import { sendMessageStream } from "@/lib/api";
import type { AladinCoordinates, Conversation, HstJwstInfo, Message, ObjectInfo, ViewSnapshot } from "@/types/chat";

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Getter del visor activo: se actualiza cuando cualquier AladinViewer se inicializa
  const viewerGetterRef = useRef<(() => Promise<ViewSnapshot | null>) | null>(null);

  const current = currentId ? getConversation(currentId) : null;
  const messages = useMemo(() => current?.messages ?? [], [current?.messages]);

  const refreshConversations = () => setConversations(getConversations());

  useEffect(() => {
    refreshConversations();
  }, [currentId]);

  const handleNewChat = () => {
    const conv = createConversation();
    setCurrentId(conv.id);
    refreshConversations();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentId(id);
  };

  // Callback estable que cada AladinViewer llama cuando está listo
  const handleViewerReady = useCallback((getter: () => Promise<ViewSnapshot | null>) => {
    viewerGetterRef.current = getter;
  }, []);

  const handleSend = async (text: string) => {
    let convId = currentId;
    if (!convId) {
      const conv = createConversation(text.slice(0, 50));
      convId = conv.id;
      setCurrentId(convId);
      refreshConversations();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    appendMessage(convId, userMessage);
    refreshConversations();

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = { id: assistantId, role: "assistant", content: "…" };
    appendMessage(convId, assistantMessage);
    refreshConversations();

    setLoading(true);
    const conv = getConversation(convId);
    const history = (conv?.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.id !== assistantId)
      .map((m) => ({ role: m.role, content: m.content }));

    const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    // Incluir el estado actual del visor si hay uno activo
    const viewerSnapshot = viewerGetterRef.current ? (await viewerGetterRef.current() ?? undefined) : undefined;

    try {
      await sendMessageStream(text, convId, history, (event) => {
        if (event.type === "status") {
          updateMessage(convId, assistantId, { content: event.message });
        } else if (event.type === "summary") {
          updateMessage(convId, assistantId, { content: event.summary });
        } else if (event.type === "artifacts") {
          const imageUrl = event.image_url ?? (base ? `${base}/artifacts/${event.request_id}/image` : undefined);
          const patch: Partial<Pick<Message, "imageUrl" | "coordinates" | "objectInfo" | "hstJwst">> = {};
          if (imageUrl) patch.imageUrl = imageUrl;
          if (event.coordinates) patch.coordinates = event.coordinates as AladinCoordinates;
          if (event.object_info) patch.objectInfo = event.object_info as ObjectInfo;
          if (event.hst_jwst) patch.hstJwst = event.hst_jwst as unknown as HstJwstInfo;
          if (Object.keys(patch).length > 0) updateMessage(convId, assistantId, patch);
        } else if (event.type === "end") {
          if (event.summary) updateMessage(convId, assistantId, { content: event.summary });
          if (event.coordinates) updateMessage(convId, assistantId, { coordinates: event.coordinates as AladinCoordinates });
          if (event.object_info) updateMessage(convId, assistantId, { objectInfo: event.object_info as ObjectInfo });
          if (event.hst_jwst) updateMessage(convId, assistantId, { hstJwst: event.hst_jwst as unknown as HstJwstInfo });
          if (event.object_name) updateMessage(convId, assistantId, { objectName: event.object_name });
        } else if (event.type === "error") {
          updateMessage(convId, assistantId, { content: event.message });
        }
        refreshConversations();
      }, viewerSnapshot);
    } catch (err) {
      updateMessage(convId, assistantId, {
        content: err instanceof Error ? err.message : "No se pudo obtener respuesta.",
      });
      refreshConversations();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-4xl">🌌</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">astronomIA</h2>
                <p className="text-muted-foreground max-w-md text-sm">
                  Visualiza y analiza galaxias en el visor interactivo, o planifica tus noches de observación desde cualquier lugar del mundo.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onViewerReady={handleViewerReady} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-background/95 p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
