import pool, { query } from '../config/db.js';

export const getAllWards = async () => {
  const result = await query(`
    SELECT 
      w.*,
      ST_AsGeoJSON(w.geometry)::json AS geojson
    FROM wards w
    ORDER BY w.ward_number ASC
  `);
  return result.rows;
};

export const getWardById = async (id) => {
  const result = await query(`
    SELECT 
      w.*,
      ST_AsGeoJSON(w.geometry)::json AS geojson
    FROM wards w
    WHERE id = $1 OR ward_number::text = $1
  `, [id]);
  return result.rows[0];
};

export const getAllInfrastructure = async (wardId = null) => {
  let sql = `
    SELECT 
      i.id,
      i.name,
      i.category as type,
      i.layer_name as status,
      i.properties,
      ST_AsGeoJSON(i.geometry)::json AS geojson,
      w.name as ward_name
    FROM master_gis_features i
    LEFT JOIN wards w ON ST_Intersects(i.geometry, w.geometry)
    WHERE i.layer_name IN ('facilities', 'civic_logistics', 'power_infrastructure')
  `;
  const values = [];
  
  if (wardId) {
    values.push(wardId);
    sql += ` AND (w.id = $1 OR w.ward_number::text = $1)`;
  }
  
  const result = await query(sql, values);
  return result.rows.map(row => ({
    ...row.properties,
    id: row.id,
    name: row.name,
    type: row.type || row.properties.type || row.layer_name,
    ward_name: row.ward_name,
    geojson: row.geojson
  }));
};

export const getAllRoads = async () => {
  const result = await query(`
    SELECT 
      r.id,
      r.name,
      r.properties,
      ST_AsGeoJSON(r.geometry)::json AS geojson
    FROM master_gis_features r
    WHERE r.layer_name = 'roads'
  `);
  return result.rows.map(row => ({
    ...row.properties,
    id: row.id,
    name: row.name,
    type: row.properties.highway || 'road',
    geojson: row.geojson
  }));
};
