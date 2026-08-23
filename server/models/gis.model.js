import pool from '../config/db.js';

export const getAllWards = async () => {
  const result = await pool.query(`
    SELECT 
      w.*,
      ST_AsGeoJSON(w.geometry)::json AS geojson
    FROM wards w
    ORDER BY w.ward_number ASC
  `);
  return result.rows;
};

export const getWardById = async (id) => {
  const result = await pool.query(`
    SELECT 
      w.*,
      ST_AsGeoJSON(w.geometry)::json AS geojson
    FROM wards w
    WHERE id = $1 OR ward_number::text = $1
  `, [id]);
  return result.rows[0];
};

export const getAllInfrastructure = async (wardId = null) => {
  let query = `
    SELECT 
      i.*,
      ST_AsGeoJSON(i.geometry)::json AS geojson,
      w.name as ward_name
    FROM infrastructure i
    LEFT JOIN wards w ON i.ward_id = w.id
    WHERE 1=1
  `;
  const values = [];
  
  if (wardId) {
    values.push(wardId);
    query += ` AND i.ward_id = $1`;
  }
  
  const result = await pool.query(query, values);
  return result.rows;
};

export const getAllRoads = async () => {
  const result = await pool.query(`
    SELECT 
      r.*,
      ST_AsGeoJSON(r.geometry)::json AS geojson
    FROM roads r
  `);
  return result.rows;
};
