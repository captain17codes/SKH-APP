-- =====================================================================
-- KOPARGAON SMART CITY — CADASTRAL PLOTS (MAHABHUNAKASHA MOCK)
-- =====================================================================

CREATE TABLE IF NOT EXISTS land_plots (
    id VARCHAR(50) PRIMARY KEY,
    survey_number VARCHAR(50),
    plot_number VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    area_sqm NUMERIC(15, 2) DEFAULT 0.00,
    ward VARCHAR(10),
    data_source VARCHAR(50) DEFAULT 'mahabhunakasha_mock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geometry GEOMETRY(Polygon, 4326),
    geom_utm GEOMETRY(Polygon, 32643)
);

CREATE INDEX IF NOT EXISTS idx_land_plots_geometry ON land_plots USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_land_plots_geom_utm ON land_plots USING GIST (geom_utm);

-- Insert realistic mock cadastral plots near Kopargaon Center
INSERT INTO land_plots (id, survey_number, plot_number, category, area_sqm, ward, geometry)
VALUES 
('lp_101_1', '101', '1', 'Residential', 250.00, 'W1', ST_GeomFromText('POLYGON((74.47600 19.88200, 74.47610 19.88200, 74.47610 19.88210, 74.47600 19.88210, 74.47600 19.88200))', 4326)),
('lp_101_2', '101', '2', 'Commercial', 350.00, 'W1', ST_GeomFromText('POLYGON((74.47615 19.88200, 74.47635 19.88200, 74.47635 19.88210, 74.47615 19.88210, 74.47615 19.88200))', 4326)),
('lp_101_3', '101', '3', 'Residential', 200.00, 'W1', ST_GeomFromText('POLYGON((74.47600 19.88215, 74.47610 19.88215, 74.47610 19.88225, 74.47600 19.88225, 74.47600 19.88215))', 4326)),
('lp_102_1A', '102', '1A', 'Government/Public', 1200.00, 'W2', ST_GeomFromText('POLYGON((74.47500 19.88100, 74.47550 19.88100, 74.47550 19.88150, 74.47500 19.88150, 74.47500 19.88100))', 4326)),
('lp_103_5', '103', '5', 'Agricultural', 5000.00, 'W3', ST_GeomFromText('POLYGON((74.47000 19.88500, 74.47200 19.88500, 74.47200 19.88700, 74.47000 19.88700, 74.47000 19.88500))', 4326)),
('lp_104_12', '104', '12', 'Residential', 450.00, 'W4', ST_GeomFromText('POLYGON((74.47800 19.88000, 74.47830 19.88000, 74.47830 19.88030, 74.47800 19.88030, 74.47800 19.88000))', 4326))
ON CONFLICT (id) DO NOTHING;

-- Populate geom_utm
UPDATE land_plots SET geom_utm = ST_Transform(geometry, 32643) WHERE geom_utm IS NULL;

-- Analyze table to update query planner statistics
