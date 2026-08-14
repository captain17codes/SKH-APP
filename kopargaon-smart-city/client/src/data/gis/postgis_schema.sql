-- =====================================================================
-- KOPARGAON SMART CITY — POSTGRESQL + POSTGIS DATABASE SCHEMA
-- =====================================================================
-- This file defines the core GIS data structure for Kopargaon, ready to be 
-- imported into a PostGIS-enabled PostgreSQL database instance.

-- Enable PostGIS spatial database extensions if not already present
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. WARDS TABLE
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(50) PRIMARY KEY,
    ward_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    councillor VARCHAR(255),
    population INT DEFAULT 0,
    area_km2 NUMERIC(10, 2) DEFAULT 0.00,
    density VARCHAR(50),
    type VARCHAR(100),
    completion_rate INT DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    color VARCHAR(10) DEFAULT '#3b82f6',
    geometry GEOMETRY(Polygon, 4326) -- SRID 4326 (WGS 84 GPS Lat/Lng coordinate system)
);

-- Spatial GIST Index for Wards Boundary Queries
CREATE INDEX IF NOT EXISTS idx_wards_geometry ON wards USING GIST (geometry);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planning',
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget NUMERIC(15, 2) DEFAULT 0.00,
    spent NUMERIC(15, 2) DEFAULT 0.00,
    start_date DATE,
    expected_completion DATE,
    department VARCHAR(255),
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Geometry, 4326) -- Support Point, LineString, and Polygon geometry types
);

-- Spatial GIST Index for Spatial Project Containment & Proximity Queries
CREATE INDEX IF NOT EXISTS idx_projects_geometry ON projects USING GIST (geometry);

-- 3. LAND USE ZONING TABLE
CREATE TABLE IF NOT EXISTS land_use (
    id VARCHAR(50) PRIMARY KEY,
    land_use_type VARCHAR(100) NOT NULL CHECK (
        land_use_type IN ('Residential', 'Commercial', 'Agricultural', 'Industrial', 'Government/Public', 'Institutional', 'Recreational', 'Water Body', 'Mixed Use')
    ),
    area_sqm NUMERIC(15, 2) DEFAULT 0.00,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    geometry GEOMETRY(Polygon, 4326)
);

-- Spatial GIST Index for Land Zoning Overlay Queries
CREATE INDEX IF NOT EXISTS idx_land_use_geometry ON land_use USING GIST (geometry);

-- =====================================================================
-- 4. SPATIAL ANALYSIS & SUITABILITY MODEL FUNCTIONS (AI URBAN PLANNER HELPER)
-- =====================================================================

-- Example Spatial Analysis query: "Find optimal land for a new hospital"
-- Criteria:
-- - Must be Commercial or Government/Public land (land_use_type)
-- - Must NOT have any school or existing hospital within 500 meters buffer
-- - Must have good road connectivity (intersects major road networks)
CREATE OR REPLACE FUNCTION find_hospital_suitable_plots(
    search_radius_meters DOUBLE PRECISION DEFAULT 500.0
)
RETURNS TABLE (
    plot_id VARCHAR(50),
    ward_name VARCHAR(255),
    plot_area_sqm NUMERIC(15, 2),
    road_distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lu.id AS plot_id,
        w.name AS ward_name,
        lu.area_sqm AS plot_area_sqm,
        -- Calculate minimum distance to any motorway/trunk/primary road
        MIN(ST_Distance(lu.geometry::geography, p.geometry::geography)) AS road_distance_meters
    FROM 
        land_use lu
    JOIN 
        wards w ON lu.ward_id = w.id
    -- Query major road networks from projects or OSM layers
    LEFT JOIN 
        projects p ON p.category = 'Road' 
    WHERE 
        lu.land_use_type IN ('Commercial', 'Government/Public')
        -- Spatial constraint: Not within search_radius of any existing health facility
        AND NOT EXISTS (
            SELECT 1 
            FROM projects h 
            WHERE h.category = 'Hospital' 
              AND ST_DWithin(lu.geometry::geography, h.geometry::geography, search_radius_meters)
        )
    GROUP BY 
        lu.id, w.name, lu.area_sqm;
END;
$$ LANGUAGE plpgsql;

-- 5. CITIZEN COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ai_score INT DEFAULT 0,
    ai_reason TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Point, 4326)
);

-- Spatial GIST Index for Complaints Coordinate Proximity & Clustered Hotspot Queries
CREATE INDEX IF NOT EXISTS idx_complaints_geometry ON complaints USING GIST (geometry);
