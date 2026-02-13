# astronomIA UI (Frontend)

Interfaz tipo ChatGPT para el chat de análisis de galaxias. Pensada para conectarse al backend **astronomIA** (o a un BFF/n8n) más adelante.

## Contenido

- **Login demo**: solo email (sin verificación), se guarda en `localStorage` y se accede a la app.
- **Página principal**: sidebar con lista de conversaciones + “Nuevo chat” y área de mensajes con input.
- **Conversaciones**: guardadas en `localStorage` (sin backend por ahora).
- **Envío de mensajes**: si no hay `VITE_API_URL`, responde un mensaje demo; si la configuras, llama a `POST /analyze` del backend.

## Requisitos

- Node 18+
- npm o pnpm

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Entra con cualquier email en la pantalla de login y usa el chat.

## Conectar el backend astronomIA

Crea `.env` en la raíz:

```env
VITE_API_URL=http://localhost:8000
```

Si tu API usa API key, tendrás que añadir el header en `src/lib/api.ts` (p. ej. `X-API-Key`).

## Build

```bash
npm run build
```

Salida en `dist/`. Para previsualizar: `npm run preview`.

## Estructura

```
src/
├── components/   # Sidebar, ChatMessage, ChatInput
├── lib/          # auth (email demo), conversations (localStorage), api (placeholder)
├── pages/        # Login, Chat
├── types/        # chat (Message, Conversation)
├── App.tsx
├── main.tsx
└── index.css
```
