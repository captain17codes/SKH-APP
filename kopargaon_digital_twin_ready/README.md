# Kopargaon Digital Twin — Ready Data Package

This package is organized so the urban master data, terrain raster, derived analytics and flood scenarios remain separate but operate as one Digital Twin.

## Use this structure as-is

- `project_index.json` — single entry point for the package.
- `config/twin_sources.json` — source paths and scenario rules.
- `data/as_is/kopargaon_master_dataset.json` — AS-IS urban GIS master dataset.
- `data/terrain/kopargaon_dem_glo30_aoi.tif` — Copernicus GLO-30 DEM/DSM crop for the Kopargaon analysis area.
- `data/derived/kopargaon_facility_elevations.json` — DEM-sampled facility elevations.
- `data/scenarios/godavari_preliminary_flood_scenarios.geojson` — precomputed +0.5 m, +1 m, +2 m and +3 m terrain-connected screening scenarios.
- `data/derived/kopargaon_flood_twin_summary.json` — DEM/flood summary and limitations.
- `docs/final_flowchart.mmd` — final Digital Twin lifecycle and flood-scenario flow.
- `validation/validation_report.json` — package validation results.

## Recommended app placement

Place the entire `kopargaon_digital_twin_ready` folder in your project. JSON/GeoJSON can be served to the frontend. Keep the GeoTIFF available to the backend/geospatial service for dynamic calculations.

Do not assume MapLibre can consume this GeoTIFF directly as a `raster-dem` source from a normal file URL. For the current hackathon MVP, render the precomputed flood-scenario GeoJSON in MapLibre and use the GeoTIFF for backend/GIS calculations. If you later want 3D terrain, tile/serve the DEM in a MapLibre-compatible raster-dem format.

## Runtime design

1. Load `project_index.json`.
2. Load `data/as_is/kopargaon_master_dataset.json`.
3. Add MapLibre sources for required master layers.
4. Load `data/scenarios/godavari_preliminary_flood_scenarios.geojson` as a flood scenario source.
5. Slider values map to `relative_rise_m = 0.5, 1.0, 2.0, 3.0`.
6. Intersect/select buildings, roads, facilities, power and railway using GIS code/PostGIS.
7. Send only structured GIS results to the AI assistant.
8. AI explains impacts, trade-offs, uncertainty and evidence; human planner makes the decision.

## Important scientific wording

The flood layer is a **preliminary terrain-connected what-if inundation screening model**, not an official flood forecast. It does not model observed gauge stage, discharge, channel cross-sections, culverts, levees, rainfall-runoff or full 2D hydrodynamics.

Copernicus GLO-30 is approximately 30 m resolution and should not be described as survey-grade building-level elevation.

## Analysis boundary

The analysis AOI is `[74.455, 19.865, 74.510, 19.915]`.

It is a project-defined Kopargaon planning area, **not an official municipal boundary**. The master dataset preserves full source geometry where available; the AOI is applied at runtime.

## Data gaps to keep visible

Official municipal boundary, complete drainage network, water pipelines, sewer network, cadastral ownership, statutory zoning/master-plan polygons, authoritative project work orders and the complete local electrical distribution network are not available in the package.

Do not treat missing open-data features as proof that the infrastructure does not exist.
