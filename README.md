# Kopargaon Smart City GIS AI Platform 🏙️🤖

A comprehensive GIS-enabled, AI-powered Smart City Management Platform for Kopargaon. This platform integrates interactive geospatial analysis, civic complaint management, AI urban planning assistance, document management, and Model Context Protocol (MCP) server support.

---

## 🏗️ Project Architecture

The repository is organized into modular services:

```text
kopargaon-smart-city/
├── client/          # React + Vite + Tailwind CSS frontend dashboard & Leaflet GIS view
├── server/          # Node.js + Express backend API service
├── mcp-server/      # Model Context Protocol (MCP) server for spatial analysis & DB tools
├── python-ai/       # Python AI services & model integration scripts
├── database/        # PostgreSQL / PostGIS database schemas & migration scripts
├── docker/          # Docker & container configuration files
├── docs/            # Project documentation & specs
├── .env.example     # Root environment template
└── package.json     # Workspace management & execution scripts
```

---

## 🚀 Key Features

- **Interactive GIS Map Viewer**: Leaflet and Mappls integration with layers for infrastructure, land use, ward boundaries, roads, and smart city projects.
- **AI Urban Planner**: Smart assistant powered by Grok AI for urban planning queries, analytics, and citizen complaint priority scoring.
- **Civic Complaint Management**: Real-time tracking, priority scoring, automated routing, and resolution workflows.
- **Document Management System**: Digital archive for city reports, project documents, and spatial data.
- **Model Context Protocol (MCP)**: Custom MCP server exposing PostGIS spatial analysis tools for AI agent invocation.
- **Full Multilingual Support**: Seamlessly localized UI across Citizen, Business, and Administrator dashboards, fully supporting English, Marathi, and Hindi via an intuitive React Context-driven architecture without breaking routing constraints or complex layouts.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) with PostGIS extension
- npm or yarn

### Environment Setup
1. Copy the `.env.example` files in each service directory:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   cp mcp-server/.env.example mcp-server/.env
   ```
2. Configure database credentials, Grok API key, and Map API keys in `server/.env` and `client/.env`.

### Installation & Execution
Install dependencies across all workspaces:
```bash
npm install
```

Start Development Servers:
```bash
# Start Client
npm run dev:client

# Start Backend Server
npm run dev:server

# Start MCP Server
npm run start:mcp
```

---

## 🔒 Security Note
Environment configuration files (`.env`), Google Cloud service accounts, and API credentials are kept private and ignored via `.gitignore`. Refer to `.env.example` for required configuration variables.