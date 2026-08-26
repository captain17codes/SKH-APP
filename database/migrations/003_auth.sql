-- 003_auth.sql
-- Creates the users table and inserts a default admin account.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'Citizen' CHECK (role IN ('Admin', 'Business', 'Citizen')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user
-- Password is 'admin123' (hashed using bcrypt)
INSERT INTO users (id, name, email, role, password_hash)
VALUES (
    'admin-12345',
    'System Admin',
    'admin@kopargaon.gov',
    'Admin',
    '$2b$10$rot0szmzfi8oc8Np3Wi1vOr2bbGExw6o04rMbdIVArUDq2pOLZY.K' 
)
ON CONFLICT (email) DO NOTHING;
