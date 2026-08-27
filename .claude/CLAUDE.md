# SKH-APP — Kopargaon Smart City GIS AI Platform

## Architecture
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + React Router
- **Backend:** Node.js + Express 5 (ES modules)
- **Database:** PostgreSQL + PostGIS via Supabase
- **Python:** Utility scripts only (deprecated Streamlit prototype in `app.py`)

## Key Conventions

### Database safety
- `master_gis_*` tables hold the canonical V3 GIS dataset — never modify directly.
- Legacy tables (`kopargaon_roads`, `kopargaon_buildings`, `infrastructure`, etc.) serve the app/demo layer.
- **Database migrations and imports require explicit user confirmation** — do not auto-apply.

### Migration and data import commands
- `npm --prefix server run migrate` — apply pending migrations
- `npm --prefix server run validate:master-dataset` — dry-run validate V3 data
- `npm --prefix server run import:master-dataset` — import V3 into DB (requires confirmation)
- `npm --prefix server run dev` — start backend dev server

### Code style
- Use ES modules (`import`/`export`) on the server.
- React functional components with hooks on the client.
- Prefer descriptive naming over abbreviations.

## Plugin usage (Claude Code)
This project uses these plugins (tracked in `.claude/settings.json`):
- `claude-security` — vulnerability scanning
- `code-review` — PR review agents
- `commit-commands` — git workflow
- `feature-dev` — structured feature workflow
- `frontend-design` — UI code generation
- `playwright` — browser automation and E2E testing (MCP: stdio, project scope)