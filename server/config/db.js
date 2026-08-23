import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

// Supabase requires SSL, but we can't always guarantee it for local dev. 
// A typical check is adding ssl: { rejectUnauthorized: false } if DATABASE_URL is present, but for now we'll keep it simple.
const pool = new Pool(poolConfig);

/**
 * Checks if the database is available and connected
 * @returns {Promise<boolean>}
 */
export const isDatabaseAvailable = async () => {
  if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_NAME)) {
    return false;
  }
  
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.error("[DB HEALTH CHECK] Failed to connect to database:", error.message);
    return false;
  }
};

export default pool;