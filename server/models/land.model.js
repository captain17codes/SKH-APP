import pool from '../config/db.js';

export const getAllLandUse = async (wardId = null) => {
  let query = `
    SELECT 
      lu.*,
      ST_AsGeoJSON(lu.geometry)::json AS geojson,
      w.name as ward_name
    FROM land_use lu
    LEFT JOIN wards w ON lu.ward_id = w.id
    WHERE 1=1
  `;
  const values = [];
  
  if (wardId) {
    values.push(wardId);
    query += ` AND lu.ward_id = $1`;
  }
  
  const result = await pool.query(query, values);
  return result.rows;
};

export const getLandStatsByWard = async (wardId) => {
  const result = await pool.query(`
    SELECT 
      land_use_type,
      COUNT(*) as count,
      SUM(area_sqm) as total_area_sqm
    FROM land_use
    WHERE ward_id = $1
    GROUP BY land_use_type
  `, [wardId]);
  
  return result.rows;
};

// Fragmentation metric: standard deviation / mean of ST_Area for a specific ward
export const getFragmentationIndex = async (wardId) => {
  const result = await pool.query(`
    SELECT 
      ward_id,
      COUNT(*) as parcel_count,
      AVG(ST_Area(geometry::geography)) as avg_area,
      STDDEV(ST_Area(geometry::geography)) as stddev_area,
      CASE 
        WHEN AVG(ST_Area(geometry::geography)) > 0 
        THEN STDDEV(ST_Area(geometry::geography)) / AVG(ST_Area(geometry::geography))
        ELSE 0 
      END as fragmentation_index
    FROM land_use
    WHERE ward_id = $1
    GROUP BY ward_id
  `, [wardId]);
  
  return result.rows[0] || null;
};
