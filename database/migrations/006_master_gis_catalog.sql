-- =====================================================================
-- KOPARGAON DIGITAL TWIN — CANONICAL MASTER GIS CATALOG
-- =====================================================================
-- Preserves authoritative mixed-geometry source layers independently from
-- application/demo tables so each source snapshot is traceable and reusable.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS master_gis_datasets (
    dataset_id VARCHAR(150) PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    version VARCHAR(100) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE,
    city JSONB NOT NULL DEFAULT '{}'::jsonb,
    analysis_aoi GEOMETRY(Polygon, 4326),
    layer_catalog JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_file TEXT NOT NULL,
    source_checksum CHAR(64) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_master_gis_datasets_version
    ON master_gis_datasets (version);

CREATE INDEX IF NOT EXISTS idx_master_gis_datasets_aoi
    ON master_gis_datasets USING GIST (analysis_aoi);

CREATE TABLE IF NOT EXISTS master_gis_features (
    id BIGSERIAL PRIMARY KEY,
    dataset_id VARCHAR(150) NOT NULL REFERENCES master_gis_datasets(dataset_id) ON DELETE CASCADE,
    layer_name VARCHAR(100) NOT NULL,
    feature_key TEXT NOT NULL,
    name TEXT,
    category TEXT,
    source TEXT,
    source_license TEXT,
    municipal_verified BOOLEAN,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_master_gis_feature_source UNIQUE (dataset_id, layer_name, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_master_gis_features_dataset_layer
    ON master_gis_features (dataset_id, layer_name);

CREATE INDEX IF NOT EXISTS idx_master_gis_features_source
    ON master_gis_features (source);

CREATE INDEX IF NOT EXISTS idx_master_gis_features_properties
    ON master_gis_features USING GIN (properties);

CREATE INDEX IF NOT EXISTS idx_master_gis_features_geometry
    ON master_gis_features USING GIST (geometry);
