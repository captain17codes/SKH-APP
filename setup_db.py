from sqlalchemy import create_engine, text
import os

SUPABASE_URI = os.getenv("SUPABASE_URI", "postgresql://postgres.tcxbxbyexhhwbppqhtui:GodLike%402026SKH@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres")
engine = create_engine(SUPABASE_URI)

sql = text("""
CREATE TABLE IF NOT EXISTS citizen_feedback (
    id SERIAL PRIMARY KEY,
    issue_type VARCHAR(50),
    description TEXT,
    location geometry(POINT, 4326), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE citizen_feedback DISABLE ROW LEVEL SECURITY;
""")

print("Executing SQL to create citizen_feedback table...")
with engine.begin() as conn:
    conn.execute(sql)
print("Table created successfully!")
