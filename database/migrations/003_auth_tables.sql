-- =====================================================================
-- KOPARGAON SMART CITY — AUTHENTICATION PERSISTENCE
-- =====================================================================

CREATE TABLE IF NOT EXISTS otp_codes (
    phone VARCHAR(20) PRIMARY KEY,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delete expired OTPs (can be run periodically or handled by app logic)
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes (expires_at);
