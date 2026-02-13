import { useState, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import {
  getConversations,
  getConversation,
  createConversation,
  appendMessage,
} from "@/lib/conversations";
import { sendMessage } from "@/lib/api";
import type { Conversation, Message } from "@/types/chat";

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    setLoading(true);
    const history = (getConversation(convId)?.messages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const reply = await sendMessage(text, convId, history);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };
      appendMessage(convId, assistantMessage);
      refreshConversations();
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "No se pudo obtener respuesta."}`,
      };
      appendMessage(convId, errorMessage);
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
                  Pregunta por una galaxia por nombre o coordenadas, pide imágenes en visible,
                  infrarrojo o UV. Cuando conectes el backend de análisis, aquí llegarán los
                  resultados reales.
                </p>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
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
