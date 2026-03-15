# astronomIA UI (Frontend)

Interfaz de chat para análisis de galaxias. El usuario escribe consultas en lenguaje natural ("Muéstrame M51 en infrarrojo") y recibe imágenes, análisis morfológicos y un visor interactivo del cielo con Aladin Lite.

## Funcionalidades

- **Chat conversacional** con historial de conversaciones (localStorage).
- **Streaming SSE** de respuestas del backend: estados de progreso, resumen, imagen y coordenadas.
- **Visor interactivo** (Aladin Lite v3): exploración del cielo con zoom, pan y cambio de survey en vivo. 13 surveys agrupados por banda electromagnética (rayos X, UV, óptico, IR, radio).
- **Metadatos SIMBAD**: tipo de objeto, morfología, velocidad radial, redshift — mostrados como badges bajo el mensaje.
- **Indicador HST/JWST**: si existen observaciones del Hubble o JWST para la galaxia, se muestra un badge con colección, instrumento y filtros, con link al preview.
- **Imágenes estáticas** del análisis (segmentación, medidas) junto al visor interactivo.
- **Login demo** por email (localStorage, sin autenticación real).

## Requisitos

- Node 18+
- npm

## Desarrollo

```bash
npm install
cp .env.example .env   # o crear .env con VITE_API_URL
npm run dev
```

Abre `http://localhost:5173`. Login con cualquier email.

## Conexión con el backend

El frontend se conecta al **BFF** (astronomia-ui-backend), que a su vez conecta con la Galaxy API.

```
Frontend (:5173)  →  BFF (:3000)  →  Galaxy API (:8000)
```

En `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Build

```bash
npm run build      # salida en dist/
npm run preview    # previsualizar el build
```

**Docker:**

```bash
docker compose up --build   # nginx en :5173
```

## Estructura

```
src/
├── components/
│   ├── AladinViewer.tsx   # Visor interactivo Aladin Lite (WebGL2/WASM)
│   ├── ChatMessage.tsx    # Mensaje con imagen, visor, badges SIMBAD/HST (lazy-loaded)
│   ├── ChatInput.tsx      # Input de texto
│   └── Sidebar.tsx        # Lista de conversaciones
├── lib/
│   ├── api.ts             # Cliente SSE: parseo de eventos (status, summary, artifacts, end, error)
│   ├── conversations.ts   # CRUD de conversaciones en localStorage
│   └── auth.ts            # Login demo (email en localStorage)
├── pages/
│   ├── Chat.tsx           # Página principal: sidebar + mensajes + input
│   └── Login.tsx          # Pantalla de login
├── types/
│   ├── chat.ts            # Message, Conversation, AladinCoordinates, ObjectInfo, HstJwstInfo
│   └── aladin-lite.d.ts   # Type declarations para aladin-lite
├── App.tsx                # Router con rutas protegidas
├── main.tsx               # Entry point React
└── index.css              # Tailwind + tema oscuro
```

### Aladin Lite

El visor se carga bajo demanda (`React.lazy` + `Suspense`) para no incluir los ~2.4 MB de WASM en el bundle principal. Requiere **WebGL2** (hardware acceleration activado en el navegador). Si WebGL2 no está disponible, muestra un link directo a Aladin Lite web con las coordenadas.

Surveys disponibles en el visor, ordenados por frecuencia:

| Banda | Surveys |
|-------|---------|
| Rayos X | XMM, RASS |
| UV | GALEX FUV, GALEX NUV |
| Óptico | DSS2, SDSS, PanSTARRS, DECaLS |
| IR | 2MASS, WISE |
| Radio | NVSS |

### Protocolo SSE

El frontend consume eventos SSE del BFF:

| Evento | Contenido | Uso |
|--------|-----------|-----|
| `status` | `message` | Indicador de progreso |
| `summary` | `summary` | Texto del asistente |
| `artifacts` | `request_id`, `image_url`, `coordinates`, `object_info`, `hst_jwst` | Imagen + visor + metadatos |
| `end` | `summary`, `coordinates`, `object_info`, `hst_jwst` | Cierre del stream |
| `error` | `message` | Error a mostrar |

## Stack

- React 18 + TypeScript 5.6
- Vite 5
- Tailwind CSS 3
- Aladin Lite 3.8 (WASM/WebGL2)
- React Router 6
