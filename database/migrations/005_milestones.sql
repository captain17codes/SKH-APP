-- =====================================================================
-- KOPARGAON SMART CITY — PROJECT MILESTONES TABLE
-- =====================================================================
-- This migration creates the tables for the Project Execution Module

CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED')
    ),
    evidence_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
