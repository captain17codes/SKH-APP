# Kopargaon Smart City GIS AI Platform — Full Project Context

> **Purpose of this file:** Give any AI assistant complete context about this project so it can understand the codebase, architecture, conventions, and make informed changes without needing to re-explore. Keep this file updated as the project evolves.

> **Author:** Chavan Shubham  
> **Last Updated:** 2026-08-23

---

## 1. Project Overview

**Kopargaon Smart City GIS AI Platform** is a comprehensive web application for managing the Smart City infrastructure of **Kopargaon** (a city in Ahmednagar district, Maharashtra, India). It integrates:

- **Interactive GIS mapping** (Leaflet + Mappls) for geospatial visualization
- **AI-powered urban planning assistant** (Groq LLM / deterministic fallback)
- **Civic complaint management** with AI priority scoring
- **Smart City project tracking** with AI risk analysis
- **Document management** for city reports
- **Model Context Protocol (MCP)** server for spatial analysis tools
- **Multi-language support** (English, Hindi, Marathi)
- **Multi-role authentication** (Administrator, Citizen, Business)
- **Text-to-Speech** via Google Cloud TTS

**City Coordinates:** Kopargaon center — `19.8817°N, 74.4788°E`  
**Ward System:** 6 wards (W1–W6)

---

## 2. Tech Stack

### Frontend (client/)
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| Vite | 8.x | Build tool & dev server |
| Tailwind CSS | 4.x (via `@tailwindcss/vite` plugin) | Styling |
| React Router DOM | 7.x | Client-side routing |
| Leaflet + React-Leaflet | 1.9 / 5.0 | Interactive maps |
| Recharts | 3.x | Charts & analytics |
| Axios | 1.x | HTTP client |
| Lucide React | 1.x | Icon library |
| React Hot Toast | 2.x | Toast notifications |
| jsPDF + jspdf-autotable | 4.x / 5.x | PDF export |
| xlsx | 0.18.x | Excel export |

### Backend (server/)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.x | HTTP framework |
| PostgreSQL (pg) | 8.x | Database driver |
| PostGIS | — | Spatial extensions |
| Axios | 1.x | HTTP client (for LLM & MCP calls) |
| bcrypt | 6.x | Password hashing |
| jsonwebtoken | 9.x | JWT authentication |
| multer | 2.x | File uploads |
| dotenv | 17.x | Environment config |
| @google-cloud/text-to-speech | 6.x | Google Cloud TTS |

### MCP Server (mcp-server/)
| Technology | Version | Purpose |
|---|---|---|
| Express | — | HTTP server |
| @modelcontextprotocol/sdk | 1.x | MCP protocol support |
| pg | 8.x | PostgreSQL driver |
| dotenv | 16.x | Environment config |

### AI/LLM
| Provider | Model | API Style |
|---|---|---|
| Groq | llama-3.3-70b-versatile | OpenAI-compatible chat completions |
| Deterministic fallback | — | Rule-based intent engine when LLM unavailable |

---

## 3. Repository Structure

```
d:\SKH-APP\                          ← Root workspace
├── client/                          ← React + Vite frontend
│   ├── index.html                   ← SPA entry point
│   ├── vite.config.js               ← Vite config (React + TailwindCSS v4 plugin)
│   ├── vercel.json                  ← Vercel SPA rewrites
│   ├── package.json                 ← Frontend dependencies
│   └── src/
│       ├── main.jsx                 ← React DOM root
│       ├── App.jsx                  ← Root component with all routes
│       ├── App.css                  ← Global app styles
│       ├── index.css                ← Tailwind base + global CSS
│       ├── context/                 ← React Context providers
│       │   ├── AuthContext.jsx      ← Auth state (user, login, logout, switchRole)
│       │   ├── ThemeContext.jsx     ← Dark/light theme toggle
│       │   └── LanguageContext.jsx  ← i18n language switching (en/hi/mr)
│       ├── layouts/                 ← Page layout wrappers
│       │   ├── DashboardLayout.jsx  ← Admin dashboard (Sidebar + Navbar + Outlet)
│       │   ├── CitizenDashboardLayout.jsx  ← Citizen portal layout
│       │   └── BusinessDashboardLayout.jsx ← Business portal layout
│       ├── pages/                   ← Route-level page components (27 pages)
│       │   ├── LandingPage.jsx      ← Public landing page
│       │   ├── LoginPage.jsx        ← Admin login (OTP + email/password)
│       │   ├── DashboardPage.jsx    ← Admin overview dashboard
│       │   ├── GisPage.jsx          ← Full GIS map viewer (admin)
│       │   ├── ProjectsPage.jsx     ← Projects list + CRUD
│       │   ├── ProjectDetailsPage.jsx ← Individual project detail + risk
│       │   ├── ComplaintsPage.jsx   ← Complaints management
│       │   ├── AiPlannerPage.jsx    ← AI Urban Planner chat interface
│       │   ├── AnalyticsPage.jsx    ← Charts & analytics dashboard
│       │   ├── LandUsePage.jsx      ← Land use zoning viewer
│       │   ├── DocumentsPage.jsx    ← Document management
│       │   ├── SettingsPage.jsx     ← User settings
│       │   ├── CitizenDashboardPage.jsx     ← Citizen main dashboard
│       │   ├── CitizenGisPage.jsx           ← Citizen GIS view
│       │   ├── CitizenPropertyMarketplacePage.jsx ← Property listings
│       │   ├── CitizenSellPropertyPage.jsx  ← Sell property form
│       │   ├── CitizenMyListingsPage.jsx    ← User's property listings
│       │   ├── CitizenPropertyDetailsPage.jsx ← Property detail view
│       │   ├── CitizenPropertyMapPage.jsx   ← Property map view
│       │   ├── BusinessDashboardPage.jsx    ← Business overview
│       │   ├── BusinessGisPage.jsx          ← Business GIS view
│       │   ├── BusinessPropertiesPage.jsx   ← Business properties
│       │   ├── BusinessMarketIntelligencePage.jsx ← Market intelligence
│       │   ├── BusinessUpcomingDevelopmentPage.jsx ← Upcoming development
│       │   └── NotFoundPage.jsx     ← 404 page
│       ├── components/              ← Reusable UI components
│       │   ├── common/              ← Shared (Navbar, Sidebar, Modal, Badge, SearchBar, etc.)
│       │   ├── ai/                  ← AIChat.jsx, AIMessage.jsx, PromptSuggestions.jsx
│       │   ├── gis/                 ← MapView.jsx, MapLayerControl, MapLegend, MapPopup, MapTools
│       │   ├── complaints/          ← ComplaintCard, ComplaintModal, ComplaintTable, NewComplaintModal
│       │   ├── projects/            ← ProjectCard, ProjectModal, ProjectTable, ProjectTimeline
│       │   ├── documents/           ← DocumentCard, DocumentPreviewModal, UploadDocumentModal
│       │   └── landuse/             ← LandAnalysisPanel.jsx
│       ├── services/                ← API service layer
│       │   ├── api.js               ← Central API client (axios) + all service modules
│       │   ├── gisService.js        ← GIS data services
│       │   └── overpassService.js   ← OpenStreetMap Overpass API queries
│       ├── data/                    ← Static/mock data
│       │   ├── mockData.js          ← In-memory mock data (projects, complaints, land plots, etc.)
│       │   └── gis/                 ← GeoJSON files + SQL schemas
│       │       ├── wards.geojson
│       │       ├── infrastructure.geojson
│       │       ├── land_use.geojson
│       │       ├── projects.geojson
│       │       ├── roads.geojson
│       │       ├── wardBoundaries.js
│       │       ├── landUse.js
│       │       ├── infrastructure.js
│       │       ├── buildings.js
│       │       └── roads.js
│       ├── i18n/
│       │   └── translations.js      ← All UI text in en/hi/mr
│       └── utils/
│           ├── exportUtils.js       ← PDF/Excel export helpers
│           └── mapplsLoader.js      ← Mappls SDK dynamic loader
│
├── server/                          ← Node.js Express backend
│   ├── app.js                       ← Express entry point (port 5000)
│   ├── .env                         ← Environment variables (NEVER COMMIT SECRETS)
│   ├── .env.example                 ← Server environment template
│   ├── package.json                 ← Backend dependencies (type: "module" — ESM)
│   ├── config/
│   │   └── db.js                    ← PostgreSQL connection pool (pg.Pool)
│   ├── routes/
│   │   ├── ai.routes.js             ← POST /api/ai/urban-planner, GET /api/ai/health
│   │   ├── complaint.routes.js      ← CRUD /api/complaints + /hotspots + OTP
│   │   ├── project.routes.js        ← CRUD /api/projects + /overview + /:id/risk
│   │   └── tts.routes.js            ← POST /api/tts (Google Cloud TTS)
│   ├── controllers/
│   │   ├── complaint.controller.js  ← Complaint CRUD + AI priority scoring
│   │   └── project.controller.js    ← Project CRUD + AI risk analysis
│   └── services/
│       ├── ai.service.js            ← Core AI engine (848 lines)
│       │                               - Language detection (en/hi/mr + transliteration)
│       │                               - Intent classification (9 intents)
│       │                               - Groq LLM integration (tool selection + synthesis)
│       │                               - Deterministic fallback planner
│       │                               - MCP tool orchestration
│       ├── mcpClient.js             ← HTTP client to MCP server (port 7000)
│       ├── complaintPriorityService.js ← AI complaint priority scoring
│       ├── projectRiskService.js    ← 10-factor project risk engine
│       ├── tts.service.js           ← Google Cloud TTS wrapper
│       └── agents/
│           └── router.agent.js      ← LLM-powered intent router (alternative)
│
├── mcp-server/                      ← MCP Spatial Analysis Microservice
│   ├── server.js                    ← Express server (port 7000) + all tool handlers
│   ├── .env.example                 ← MCP server environment template
│   ├── package.json                 ← MCP dependencies (type: "module" — ESM)
│   └── services/
│       ├── postgresService.js       ← PostgreSQL/PostGIS data access layer
│       └── spatialAnalysisService.js ← Suitability analysis, Haversine distance, etc.
├── python-ai/                       ← Reserved for Python AI services (placeholder)
├── database/                        ← Database schemas and migrations
│   └── migrations/
│       └── 001_init.sql             ← PostGIS schema
├── docker/                          ← Reserved for Docker configs (placeholder)
├── docs/                            ← Reserved for documentation (placeholder)
├── .env.example                     ← Root environment template
├── package.json                     ← Root workspace scripts
└── .gitignore
```

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React SPA)                            │
│                                                                        │
│  Landing → Login → Dashboard Layout → Pages (GIS, Projects, AI, etc.) │
│                                                                        │
│  Context Providers: AuthContext, ThemeContext, LanguageContext           │
│  API Layer: services/api.js (Axios → Backend, falls back to mockData)  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP (port 5173 → port 5000)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (server/)                           │
│                                                                        │
│  Routes: /api/ai, /api/complaints, /api/projects, /api/tts, /api/auth  │
│  Services: ai.service.js, projectRiskService.js, complaintPriority     │
│  Database: PostgreSQL/PostGIS via pg.Pool (config/db.js)               │
│  MCP Client: services/mcpClient.js → HTTP to MCP server               │
│  LLM: Groq API (OpenAI-compatible) or deterministic fallback          │
└────────────────────┬────────────────────────┬──────────────────────────┘
                     │                        │
        HTTP (port 7000)              HTTPS (api.groq.com)
                     ▼                        ▼
┌──────────────────────────────┐  ┌──────────────────────────┐
│    MCP SERVER (mcp-server/)  │  │     Groq Cloud LLM       │
│                              │  │                          │
│  16 spatial analysis tools   │  │  llama-3.3-70b-versatile │
│  PostGIS queries             │  │  JSON mode responses     │
│  Risk analysis engine        │  └──────────────────────────┘
│  Infrastructure gap analysis │
│  Facility suitability scoring│
└──────────────────────────────┘
```

### Offline-First Design
The frontend has a **comprehensive mock data fallback** system. Every API call in `services/api.js` has a `try/catch` — if the backend is unreachable, it falls back to `data/mockData.js`, which contains realistic pre-populated data for projects, complaints, land plots, documents, and ward GeoJSON.

---

## 5. Authentication & Authorization

### Roles
| Role | Login Path | Dashboard Layout | Access |
|---|---|---|---|
| Administrator | `/login` or `/admin/login` | `DashboardLayout` | Full admin: GIS, Projects, Complaints, Analytics, AI Planner, Documents, Settings |
| GIS Planner | `/login` | `DashboardLayout` | Same as Administrator |
| Municipal Officer | `/login` | `DashboardLayout` | Same as Administrator |
| Citizen | `/citizen/login` | `CitizenDashboardLayout` | Citizen dashboard, GIS view, property marketplace |
| Business | `/business/login` | `BusinessDashboardLayout` | Business dashboard, GIS, properties, market intelligence, upcoming development |

### Auth Flow
1. `LoginPage.jsx` supports both OTP-based (phone) and email/password login
2. Backend issues JWT token → stored in `localStorage` as `kopargaon-auth-token`
3. Axios interceptor attaches `Authorization: Bearer <token>` to all API requests
4. `AuthContext.jsx` checks `/api/auth/me` on mount to restore session
5. `ProtectedRoute.jsx` checks `isAuthenticated` + `allowedRoles` to guard routes

---

## 6. API Endpoints

### AI Routes (`/api/ai`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/urban-planner` | AI urban planning query (body: `{ query, language }`) |
| GET | `/api/ai/urban-planner/health` | AI health check |
| GET | `/api/ai/health` | Full service health (Express + MCP + DB) |

### Complaint Routes (`/api/complaints`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/complaints` | List all complaints |
| GET | `/api/complaints/hotspots` | GeoJSON complaint hotspots |
| GET | `/api/complaints/:id` | Get single complaint |
| POST | `/api/complaints` | Create complaint |
| PATCH | `/api/complaints/:id` | Update complaint (status, etc.) |
| POST | `/api/complaints/:id/upvote` | Upvote a complaint |
| DELETE | `/api/complaints/:id` | Delete complaint |
| POST | `/api/complaints/otp/send` | Send OTP for verification |
| POST | `/api/complaints/otp/verify` | Verify OTP code |

### Project Routes (`/api/projects`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/overview` | Dashboard overview stats |
| GET | `/api/projects/:id` | Get single project |
| GET | `/api/projects/:id/risk` | AI risk analysis for project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### TTS Route (`/api/tts`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/tts` | Text-to-Speech (body: `{ text, language }`, returns MP3 audio buffer) |

---

## 7. MCP Server Tools (port 7000)

The MCP server exposes 16 spatial analysis tools via a REST API:

| Tool Name | Description |
|---|---|
| `get_ward_details` | Ward demographics, area, facilities count |
| `get_projects` | Filter projects by ward/status |
| `get_project_details` | Full project details + risk analysis |
| `get_project_progress` | Expected vs actual progress comparison |
| `get_project_budget` | Budget utilization analysis |
| `get_project_complaints` | Nearby unresolved complaints for a project |
| `analyze_project_risk` | 10-factor AI risk score engine |
| `get_projects_at_risk` | Projects filtered by risk level |
| `get_land_use` | GIS land zoning data for a ward |
| `get_nearby_hospitals` | Radial hospital search |
| `get_nearby_schools` | Radial school search |
| `get_road_accessibility` | Road network connectivity score |
| `analyze_infrastructure_gap` | Healthcare/education/utility gaps |
| `find_suitable_locations` | Spatial suitability analysis (hospital/school) |
| `get_complaints` | Filter complaints by ward/status/category |
| `get_nearby_complaints` | Radial complaint search |
| `analyze_complaint_priority` | AI priority scoring for complaints |

**Discovery:** `GET /tools` → returns all tools with JSON Schema  
**Execution:** `POST /call` → `{ name, arguments }` → `{ result }`  
**Health:** `GET /health` → `{ status: "healthy" }`

---

## 8. AI Urban Planner — How It Works

### Intent Classification (9 Intents)
```
HOSPITAL_LOCATION    — Find best location for a new hospital
SCHOOL_LOCATION      — Find best location for a new school
INFRASTRUCTURE_GAPS  — Analyze infrastructure deficiencies in a ward
WATER_DRAINAGE       — Water supply & drainage issues
ROADS_TRANSPORT      — Road construction & traffic analysis
ONGOING_PROJECTS     — List active Smart City projects
DELAYED_HIGH_RISK_PROJECTS — Projects needing immediate attention
PROJECT_SPECIFIC     — Analyze a specific project (e.g., PRJ-2026-002)
GENERAL_PLANNING     — General urban planning questions
```

### Processing Pipeline
1. **Language Detection** — Devanagari script analysis + word matching → mr-IN / hi-IN / en-IN
2. **Intent Detection** — Keyword rules for each intent + ward/project ID extraction
3. **LLM Path (if Groq API key valid):**
   - Send query + available MCP tools → LLM selects tools
   - Execute selected MCP tools
   - Send tool results + query → LLM synthesizes final report
4. **Fallback Path (deterministic):**
   - Use detected intent → call appropriate MCP tools directly
   - Generate structured response with pre-written templates in detected language

### Response Structure
```json
{
  "success": true,
  "answer": "Markdown-formatted analysis text (in detected language)",
  "recommendations": [
    {
      "name": "Location Name",
      "latitude": 19.883,
      "longitude": 74.488,
      "score": 91,
      "reasons": ["Reason 1", "Reason 2"]
    }
  ],
  "mapAction": {
    "type": "FLY_TO | SHOW_CANDIDATES",
    "latitude": 19.883,
    "longitude": 74.488,
    "zoom": 15
  },
  "sources": ["PostgreSQL Database", "PostGIS Spatial Analysis"]
}
```

---

## 9. Client-Side Services (services/api.js)

All services follow the **try backend → catch fallback to mock** pattern:

| Service | Methods | Mock Store |
|---|---|---|
| `projectService` | getAll, getById, getOverview, create, update, delete | `MOCK_PROJECTS` |
| `complaintService` | getAll, create, updateStatus, upvote, delete, getHotspots, sendOtp, verifyOtp | `MOCK_COMPLAINTS` |
| `landService` | getAll | `MOCK_LAND_PLOTS` |
| `propertyService` | getAll, getById, create, submitInquiry, getMyListings, updateStatus | `MOCK_LAND_PLOTS` |
| `documentService` | getAll, create | `MOCK_DOCUMENTS` |
| `aiPlannerService` | queryAI, synthesizeTTS | (no mock — throws on failure) |
| `ttsService` | speak | (no mock — throws on failure) |
| `gisService` | getWardsGeoJSON | `KOPARGAON_WARDS_GEOJSON` |
| `authService` | sendOtp, verifyOtp, adminLogin, me, logout | (no mock) |
| `calculateClientProjectRisk()` | — | Standalone function for client-side risk scoring |

---

## 10. Key Components

### GIS Map (`components/gis/MapView.jsx`)
- Built with React-Leaflet
- Supports multiple overlay layers: wards, projects, complaints, infrastructure, land use, roads, buildings
- Layer control via `MapLayerControl.jsx`
- Rich popups via `MapPopup.jsx`
- Measurement & drawing tools via `MapTools.jsx`
- Centered on Kopargaon: `[19.8817, 74.4788]`

### AI Chat (`components/ai/`)
- `AIChat.jsx` — Chat interface with message history
- `AIMessage.jsx` — Renders AI responses with markdown
- `PromptSuggestions.jsx` — Pre-built query suggestions

### Common UI (`components/common/`)
- `Navbar.jsx` — Top navigation with search, notifications, language switcher
- `Sidebar.jsx` — Left sidebar with navigation links
- `GlobalSearchModal.jsx` — Universal search across entities
- `Modal.jsx` — Reusable modal wrapper
- `Badge.jsx`, `StatCard.jsx`, `ChartCard.jsx` — Dashboard UI primitives
- `ProtectedRoute.jsx` — Route guard (checks auth + role)

---

## 11. GIS Data Sources

### Static GeoJSON Files (client/src/data/gis/)
| File | Content |
|---|---|
| `wards.geojson` | Ward boundary polygons with population data |
| `infrastructure.geojson` | Schools, hospitals, utilities (Point features) |
| `land_use.geojson` | Zoning polygons (residential, commercial, etc.) |
| `projects.geojson` | Smart City project locations |
| `roads.geojson` | Road network |

### JavaScript Data Files
| File | Content |
|---|---|
| `wardBoundaries.js` | Ward boundary coordinates |
| `landUse.js` | Land use zone data |
| `infrastructure.js` | Infrastructure facility data |
| `buildings.js` | Building footprints |
| `roads.js` | Road data |

### External Services
- **OpenStreetMap via Overpass API** (`services/overpassService.js`)
- **Mappls (MapmyIndia)** tiles and API (`utils/mapplsLoader.js`)

---

## 12. Environment Configuration

### Server (.env)
```
PORT=5000
GROK_API_KEY=<groq_api_key>
GROK_API_URL=https://api.groq.com/openai/v1/chat/completions
GROK_MODEL=llama-3.3-70b-versatile
MCP_SERVER_URL=http://localhost:7000

# Optional
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kopargaon_smartcity
DB_USER=postgres
DB_PASSWORD=<password>
GOOGLE_APPLICATION_CREDENTIALS=<path_to_credentials.json>
```

### Client (env vars via Vite)
```
VITE_API_URL=http://localhost:5000/api        # or VITE_API_BASE_URL
VITE_MAPPLS_API_KEY=<mappls_key>
```

### MCP Server
```
MCP_PORT=7000
DATABASE_URL=postgresql://user:password@localhost:5432/kopargaon_gis
```

---

## 13. Running the Project

```bash
# Install dependencies (all workspaces)
npm install

# Start Frontend (port 5173)
npm run dev:client

# Start Backend (port 5000)
npm run dev:server

# Start MCP Server (port 7000)
npm run start:mcp
```

All three services must run concurrently for full functionality. The app degrades gracefully:
- **No backend** → frontend uses mock data
- **No MCP server** → AI uses deterministic fallback without spatial tools
- **No Groq API key** → AI uses pure deterministic intent-based responses
- **No PostgreSQL** → MCP server uses in-memory/file-based data

---

## 14. Module System & Conventions

### Code Style
- **ESM modules** throughout (`"type": "module"` in all package.json files)
- Import/export with `import x from 'y'` (not `require()`)
- File extensions required in server imports: `import foo from './foo.js'`
- React components use `.jsx` extension
- Functional components with React hooks only (no class components)

### Naming Conventions
- **Files:** kebab-case for routes/services (e.g., `ai.routes.js`), PascalCase for React components (e.g., `AiPlannerPage.jsx`)
- **Components:** PascalCase (e.g., `MapView`, `ComplaintCard`)
- **Services:** camelCase exports (e.g., `projectService`, `aiPlannerService`)
- **Routes:** RESTful (`/api/<resource>`)
- **IDs:** Prefixed format (e.g., `PRJ-2026-001`, `CMP-2026-001`, `W1`–`W6`)

### State Management
- React Context API (no Redux/Zustand)
- Three contexts: `AuthContext`, `ThemeContext`, `LanguageContext`
- Client-side live stores in `services/api.js` (in-memory arrays synced with mock data)

### Error Handling
- Backend: Express error middleware
- Frontend: try/catch with toast notifications (`react-hot-toast`)
- API fallback pattern: always try backend first, catch → return mock data

---

## 15. Database Schema (PostgreSQL/PostGIS)

Referenced from `database/migrations/001_init.sql`:

### Core Tables
- `wards` — Ward boundaries (id, name, population, geometry POLYGON)
- `projects` — Smart City projects (id, name, category, status, budget, spent, progress, ward, start_date, end_date, geometry POINT)
- `complaints` — Civic complaints (id, title, category, status, priority, ward, coordinates POINT, ai_score, upvotes)
- `land_plots` — Land parcels (id, category/zoning, area, ward, geometry POLYGON)
- `infrastructure` — Facilities like schools, hospitals (id, name, type, ward, geometry POINT)
- `roads` — Road network (id, name, road_type, geometry LINESTRING)
- `users` — System users (id, name, phone, email, role, password_hash)
- `documents` — City documents (id, title, category, file_url, uploaded_by)

---

## 16. Deployment

### Frontend
- **Vercel** — configured via `client/vercel.json` (SPA rewrites)
- Build command: `npm run build:client`

### Backend
- **Render / Railway / any Node.js host**
- Entry: `node server/app.js`
- Requires environment variables

### Notes
- API client has 60s timeout to handle Render cold starts
- CORS is open (`app.use(cors())`)
- JWT token stored in localStorage

---

## 17. Known Architecture Decisions & Gotchas

1. **MCP server imports from server:** `mcp-server/server.js` imports `projectRiskService.js` from `../server/services/` — coupling between services
2. **Mock data is primary for demos:** The app is designed to work fully offline with mock data. Backend is optional for demo purposes
3. **Groq, not Grok:** Despite env var naming (`GROK_API_KEY`), the LLM provider is actually **Groq** (fast inference service), not xAI's Grok
4. **Express 5:** The server uses Express 5.x (not 4.x) — minor API differences
5. **Tailwind CSS v4:** Uses the new `@tailwindcss/vite` plugin approach (not PostCSS)
6. **Multi-language responses:** AI responses are generated in the detected language (Marathi/Hindi/English). Devanagari script defaults to Marathi
7. **Client-side risk scoring:** `calculateClientProjectRisk()` duplicates server-side risk logic for offline resilience

---

## 18. Feature Areas for Future Development

- [ ] `python-ai/` — Python ML/AI services (placeholder, not yet implemented)
- [ ] `database/` — PostgreSQL migration scripts (placeholder)
- [ ] `docker/` — Containerization (placeholder)
- [ ] `docs/` — Technical documentation (placeholder)
- [ ] Real PostgreSQL/PostGIS integration (currently relies heavily on mock data)
- [ ] WebSocket for real-time complaint updates
- [ ] File upload for complaint evidence photos
- [ ] Admin user management panel
- [ ] Email/SMS notification service

---

*This file should be updated whenever significant architectural changes, new features, new routes, or new dependencies are added to the project.*
