# astronomIA UI (Frontend)

Chat interface for astronomical image analysis. Users write natural-language queries ("Show me M51 in infrared") and receive multi-band images, morphological analysis results, and an interactive sky viewer powered by Aladin Lite.

## Features

- **Conversational chat** with persistent conversation history (localStorage).
- **SSE streaming** from the backend: progress status, summary text, image and coordinates.
- **Interactive sky viewer** (Aladin Lite v3): pan, zoom, and live survey switching across 13 surveys spanning X-ray, UV, optical, IR, and radio bands.
- **SIMBAD metadata**: object type, morphology, radial velocity, redshift — displayed as badges below each message.
- **HST/JWST indicator**: if Hubble or JWST observations exist for the target, a badge shows collection, instrument, filters and a preview link.
- **Static analysis images** (segmentation, measurements) alongside the interactive viewer.
- **Demo login** by email (localStorage, no real authentication).

## Requirements

- Node 18+
- npm

## Local development

```bash
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
```

Open `http://localhost:5173`. Log in with any email address.

## Backend connection

The frontend connects to the **BFF** (astronomia-ui-backend), which in turn connects to the Galaxy API.

```
Frontend (:5173)  →  BFF (:3000)  →  Galaxy API (:8000)
```

In `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Build

```bash
npm run build      # output in dist/
npm run preview    # preview the production build
```

**Docker:**

```bash
docker compose up --build   # nginx on :5173
```

## Project structure

```
src/
├── components/
│   ├── AladinViewer.tsx   # Interactive sky viewer — Aladin Lite (WebGL2/WASM, lazy-loaded)
│   ├── ChatMessage.tsx    # Message with image, viewer and SIMBAD/HST badges
│   ├── ChatInput.tsx      # Text input
│   └── Sidebar.tsx        # Conversation list
├── lib/
│   ├── api.ts             # SSE client: parses status, summary, artifacts, end, error events
│   ├── conversations.ts   # Conversation CRUD (localStorage)
│   └── auth.ts            # Demo login (email stored in localStorage)
├── pages/
│   ├── Chat.tsx           # Main page: sidebar + messages + input
│   └── Login.tsx          # Login screen
├── types/
│   ├── chat.ts            # Message, Conversation, AladinCoordinates, ObjectInfo, HstJwstInfo
│   └── aladin-lite.d.ts   # Type declarations for aladin-lite
├── App.tsx                # Router with protected routes
├── main.tsx               # React entry point
└── index.css              # Tailwind + dark theme
```

### Aladin Lite

Loaded on demand (`React.lazy` + `Suspense`) to keep the ~2.4 MB WASM payload out of the main bundle. Requires **WebGL2**. If unavailable, a direct link to Aladin Lite web with the target coordinates is shown instead.

| Band | Surveys |
|------|---------|
| X-ray | XMM, RASS |
| UV | GALEX FUV, GALEX NUV |
| Optical | DSS2, SDSS, PanSTARRS, DECaLS |
| IR | 2MASS, WISE |
| Radio | NVSS |

### SSE protocol

| Event | Fields | Purpose |
|-------|--------|---------|
| `status` | `message` | Progress indicator |
| `summary` | `summary` | Assistant text response |
| `artifacts` | `request_id`, `image_url`, `coordinates`, `object_info`, `hst_jwst` | Image + viewer + metadata |
| `end` | `summary`, `coordinates`, `object_info`, `hst_jwst` | Stream close |
| `error` | `message` | Error to display |

## Stack

- React 18 + TypeScript 5.6 · Vite 5 · Tailwind CSS 3 · Aladin Lite 3.8 · React Router 6
