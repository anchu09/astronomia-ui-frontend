import { lazy, Suspense, useState } from "react";
import type { HstJwstInfo, Message, ObjectInfo, ViewSnapshot } from "@/types/chat";

function ObjectInfoBar({ info }: { info: ObjectInfo }) {
  const items: string[] = [];
  if (info.otype_long || info.otype) items.push(info.otype_long ?? info.otype ?? "");
  if (info.morph_type) items.push(info.morph_type);
  if (info.rvz_radvel != null) items.push(`v = ${info.rvz_radvel.toFixed(0)} km/s`);
  if (info.rvz_redshift != null) items.push(`z = ${info.rvz_redshift.toFixed(6)}`);
  if (info.sp_type) items.push(info.sp_type);
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-2 py-0.5 text-xs rounded-md bg-muted/40 text-muted-foreground border border-border"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function HstJwstBadge({ info }: { info: HstJwstInfo }) {
  const label = [info.collection, info.instrument, info.filters].filter(Boolean).join(" / ");
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="px-2 py-0.5 text-xs rounded-md bg-primary/20 text-primary-foreground border border-primary/40">
        {label}
      </span>
      {info.jpeg_url && (
        <a
          href={info.jpeg_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline"
        >
          Ver preview
        </a>
      )}
    </div>
  );
}

const AladinViewer = lazy(() =>
  import("@/components/AladinViewer").then((mod) => ({
    default: mod.AladinViewer,
  }))
);

interface ChatMessageProps {
  message: Message;
  onViewerReady?: (getSnapshot: () => Promise<ViewSnapshot | null>) => void;
}

export function ChatMessage({ message, onViewerReady }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showViewer, setShowViewer] = useState(false);
  const canShowByName = !message.coordinates && !!message.objectName;

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
        {message.objectInfo && (
          <ObjectInfoBar info={message.objectInfo} />
        )}
        {message.hstJwst && (
          <HstJwstBadge info={message.hstJwst} />
        )}
        {message.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img
              src={message.imageUrl}
              alt="Imagen del análisis"
              className="max-w-full h-auto block"
            />
          </div>
        )}
        {message.coordinates && !message.imageUrl && (
          <Suspense
            fallback={
              <div className="mt-3 p-3 rounded-lg bg-muted/40 text-muted-foreground text-xs animate-pulse">
                Cargando visor interactivo...
              </div>
            }
          >
            <AladinViewer coordinates={message.coordinates} onViewerReady={onViewerReady} />
          </Suspense>
        )}
        {canShowByName && (
          <>
            <button
              onClick={() => setShowViewer((v) => !v)}
              className="mt-3 px-3 py-1.5 text-xs rounded-lg border border-primary/40 bg-primary/10 text-primary-foreground hover:bg-primary/20 transition-colors"
            >
              {showViewer ? "Ocultar visor" : `Visualizar ${message.objectName} en el cielo`}
            </button>
            {showViewer && (
              <Suspense
                fallback={
                  <div className="mt-3 p-3 rounded-lg bg-muted/40 text-muted-foreground text-xs animate-pulse">
                    Cargando visor interactivo...
                  </div>
                }
              >
                <AladinViewer objectName={message.objectName} onViewerReady={onViewerReady} />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );
}
