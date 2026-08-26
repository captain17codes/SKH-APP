-- =====================================================================
-- KOPARGAON SMART CITY — POSTGRESQL + POSTGIS DATABASE SCHEMA
-- =====================================================================
-- This file defines the core GIS data structure for Kopargaon, ready to be 
-- imported into a PostGIS-enabled PostgreSQL database instance.

-- Enable PostGIS spatial database extensions if not already present
CREATE EXTENSION IF NOT EXISTS postgis;

-- 0. SEED LOG TABLE (Audit trail for data swaps)
CREATE TABLE IF NOT EXISTS seed_log (
    id SERIAL PRIMARY KEY,
    dataset VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    file VARCHAR(255) NOT NULL,
    rows_affected INT DEFAULT 0,
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. WARDS TABLE
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(50) PRIMARY KEY,
    ward_number INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    councillor VARCHAR(255),
    population INT DEFAULT 0,
    area_km2 NUMERIC(10, 2) DEFAULT 0.00,
    density VARCHAR(50),
    type VARCHAR(100),
    completion_rate INT DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    color VARCHAR(10) DEFAULT '#3b82f6',
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Polygon, 4326) -- SRID 4326 (WGS 84 GPS Lat/Lng coordinate system)
);

CREATE INDEX IF NOT EXISTS idx_wards_geometry ON wards USING GIST (geometry);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    project_code VARCHAR(100) UNIQUE,
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
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Geometry, 4326) -- Support Point, LineString, and Polygon geometry types
);

CREATE INDEX IF NOT EXISTS idx_projects_geometry ON projects USING GIST (geometry);

-- 3. LAND USE ZONING TABLE
CREATE TABLE IF NOT EXISTS land_use (
    id VARCHAR(50) PRIMARY KEY,
    parcel_id VARCHAR(100) UNIQUE,
    land_use_type VARCHAR(100) NOT NULL CHECK (
        land_use_type IN ('Residential', 'Commercial', 'Agricultural', 'Industrial', 'Government/Public', 'Institutional', 'Recreational', 'Water Body', 'Mixed Use')
    ),
    area_sqm NUMERIC(15, 2) DEFAULT 0.00,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Polygon, 4326)
);

CREATE INDEX IF NOT EXISTS idx_land_use_geometry ON land_use USING GIST (geometry);

-- 4. ROADS TABLE
CREATE TABLE IF NOT EXISTS roads (
    id VARCHAR(50) PRIMARY KEY,
    road_id VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    road_type VARCHAR(100),
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(LineString, 4326)
);
CREATE INDEX IF NOT EXISTS idx_roads_geometry ON roads USING GIST (geometry);

-- 5. WATER NETWORK TABLE
CREATE TABLE IF NOT EXISTS water_network (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    type VARCHAR(100),
    status VARCHAR(50),
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_water_network_geometry ON water_network USING GIST (geometry);

-- 6. DRAINAGE NETWORK TABLE
CREATE TABLE IF NOT EXISTS drainage_network (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    type VARCHAR(100),
    status VARCHAR(50),
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_drainage_network_geometry ON drainage_network USING GIST (geometry);

-- 7. INFRASTRUCTURE TABLE
CREATE TABLE IF NOT EXISTS infrastructure (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    type VARCHAR(100),
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    data_source VARCHAR(50) DEFAULT 'demo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Point, 4326)
);
CREATE INDEX IF NOT EXISTS idx_infrastructure_geometry ON infrastructure USING GIST (geometry);

-- 8. CITIZEN COMPLAINTS TABLE
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
    data_source VARCHAR(50) DEFAULT 'demo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Point, 4326)
);

CREATE INDEX IF NOT EXISTS idx_complaints_geometry ON complaints USING GIST (geometry);

-- 9. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 10. SPATIAL ANALYSIS & SUITABILITY MODEL FUNCTIONS (AI URBAN PLANNER HELPER)
-- =====================================================================

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
        -- Calculate minimum distance to any road
        MIN(ST_Distance(lu.geometry::geography, r.geometry::geography)) AS road_distance_meters
    FROM 
        land_use lu
    JOIN 
        wards w ON lu.ward_id = w.id
    LEFT JOIN 
        roads r ON true
    WHERE 
        lu.land_use_type IN ('Commercial', 'Government/Public')
        AND NOT EXISTS (
            SELECT 1 
            FROM infrastructure h 
            WHERE h.type = 'Hospital' 
              AND ST_DWithin(lu.geometry::geography, h.geometry::geography, search_radius_meters)
        )
    GROUP BY 
        lu.id, w.name, lu.area_sqm;
END;
$$ LANGUAGE plpgsql;
