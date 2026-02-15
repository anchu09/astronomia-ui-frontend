import type { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-foreground border border-border"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-medium">
              IA
            </div>
            <span className="text-xs text-muted-foreground">astronomIA</span>
          </div>
        )}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        {message.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img
              src={message.imageUrl}
              alt="Imagen del análisis"
              className="max-w-full h-auto block"
            />
          </div>
        )}
      </div>
    </div>
  );
}
