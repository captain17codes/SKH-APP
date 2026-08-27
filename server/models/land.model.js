import pool, { query as dbQuery } from '../config/db.js';

export const getAllLandUse = async (wardId = null) => {
  let sql = `
    SELECT 
      lu.id,
      lu.category as type,
      lu.properties,
      ST_AsGeoJSON(lu.geometry)::json AS geojson,
      w.name as ward_name
    FROM master_gis_features lu
    LEFT JOIN wards w ON ST_Intersects(lu.geometry, w.geometry)
    WHERE lu.layer_name = 'landuse'
  `;
  const values = [];
  
  if (wardId) {
    values.push(wardId);
    sql += ` AND (w.id = $1 OR w.ward_number::text = $1)`;
  }
  
  const result = await dbQuery(sql, values);
  return result.rows.map(row => ({
    ...row.properties,
    id: row.id,
    type: row.type || row.properties.landuse || 'Unknown',
    ward_name: row.ward_name,
    geojson: row.geojson
  }));
};

export const getLandStatsByWard = async (wardId) => {
  const result = await dbQuery(`
    SELECT 
      COALESCE(lu.category, lu.properties->>'landuse', 'Unknown') as land_use_type,
      COUNT(*) as count,
      SUM(ST_Area(lu.geometry::geography)) as total_area_sqm
    FROM master_gis_features lu
    JOIN wards w ON ST_Intersects(lu.geometry, w.geometry)
    WHERE lu.layer_name = 'landuse' AND (w.id = $1 OR w.ward_number::text = $1)
    GROUP BY land_use_type
  `, [wardId]);
  
  return result.rows;
};

// Fragmentation metric: standard deviation / mean of ST_Area for a specific ward
export const getFragmentationIndex = async (wardId) => {
  const result = await dbQuery(`
    SELECT 
      w.id as ward_id,
      COUNT(*) as parcel_count,
      AVG(ST_Area(lu.geometry::geography)) as avg_area,
      STDDEV(ST_Area(lu.geometry::geography)) as stddev_area,
      CASE 
        WHEN AVG(ST_Area(lu.geometry::geography)) > 0 
        THEN STDDEV(ST_Area(lu.geometry::geography)) / AVG(ST_Area(lu.geometry::geography))
        ELSE 0 
      END as fragmentation_index
    FROM master_gis_features lu
    JOIN wards w ON ST_Intersects(lu.geometry, w.geometry)
    WHERE lu.layer_name = 'landuse' AND (w.id = $1 OR w.ward_number::text = $1)
    GROUP BY w.id
  `, [wardId]);
  
  return result.rows[0] || null;
};
