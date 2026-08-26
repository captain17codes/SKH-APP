import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,                    // Keep low for Supabase free tier
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: true,     // Let pool shrink when idle
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

// Handle pool errors silently (don't crash the server)
pool.on('error', (err) => {
  console.error('[DB POOL] Unexpected error on idle client:', err.message);
});

/**
 * Execute a query with automatic retry on connection failures
 */
export const query = async (text, params, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      const isConnectionError = error.message.includes('timeout') || 
                                 error.message.includes('terminated') ||
                                 error.message.includes('ECONNREFUSED') ||
                                 error.code === 'ECONNRESET';
      
      if (isConnectionError && attempt < retries) {
        console.warn(`[DB] Query attempt ${attempt + 1} failed, retrying in 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Checks if the database is available and connected
 * @returns {Promise<boolean>}
 */
export const isDatabaseAvailable = async () => {
  if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_NAME)) {
    return false;
  }
  
  try {
    const result = await query('SELECT 1');
    return !!result;
  } catch (error) {
    console.error("[DB HEALTH CHECK] Failed to connect to database:", error.message);
    return false;
  }
};

export default pool;