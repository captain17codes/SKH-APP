-- =====================================================================
-- KOPARGAON SMART CITY — SCENARIOS TABLE
-- =====================================================================
-- This migration creates the tables for the WHAT-IF Scenario Engine

CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(100) NOT NULL CHECK (
        scenario_type IN ('road', 'drainage', 'water', 'public_facility', 'land_use')
    ),
    description TEXT,
    geometry GEOMETRY(Polygon, 4326),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'ENGINEER_REVIEW', 'PLANNER_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED')
    ),
    conflict_count INT DEFAULT 0,
    conflict_details JSONB,
    ai_assessment TEXT,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by_engineer VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by_planner VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scenarios_geometry ON scenarios USING GIST (geometry);
