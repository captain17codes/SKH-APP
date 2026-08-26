-- 002_feedback.sql
-- Adds the citizen feedback table.

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE CASCADE,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    citizen_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE, -- Optional, if authenticated
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ward ON feedback(ward_id);
