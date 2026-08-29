# Database Safety Rules

## Master GIS Data (the canonical V3 dataset)

The `master_gis_datasets` and `master_gis_features` tables contain the authoritative
Kopargaon GIS source data imported from `kopargaon_master_dataset_v3.json`.

**Rules:**
- Never modify `master_gis_*` tables directly — treat them as read-only source of truth.
- Import idempotency is handled by the script, but each real import requires explicit user say-so.
- The V3 import script preserves original geometries — AOI clipping happens only at analysis time.

## Legacy App/Demo Tables

These tables serve the existing application and are NOT touched by V3 imports:
- `kopargaon_roads`, `kopargaon_buildings`, `infrastructure`, `land_use`
- `projects`, `complaints`, `wards`
- `scenarios`, `milestones`

**Rules:**
- Do not replace or delete legacy GIS data when working with V3 data.
- The `asBuiltService.js` writes to legacy tables — that's correct app behavior.
- The Scenario Engine queries legacy `kopargaon_buildings` — do not redirect until separately scoped.

## Migrations

- Run `npm --prefix server run migrate` to apply pending SQL migrations.
- Migrations are additive and idempotent — they use `CREATE TABLE IF NOT EXISTS`.
- Always confirm with the user before running a migration against the shared database.