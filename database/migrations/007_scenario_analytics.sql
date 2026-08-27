ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS land_use_impact JSONB,
ADD COLUMN IF NOT EXISTS accessibility_analysis JSONB,
ADD COLUMN IF NOT EXISTS environmental_risk JSONB;
