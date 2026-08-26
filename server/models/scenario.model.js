import { query } from '../config/db.js';

export const createScenario = async ({ name, scenario_type, description, geometry, created_by }) => {
  // Convert GeoJSON geometry to PostGIS EWKT (4326)
  const geomString = JSON.stringify(geometry);
  
  // Calculate conflicts with buildings
  // We use ST_Intersects to find if the scenario polygon overlaps with any building
  const conflictQuery = `
    SELECT count(*) as count
    FROM master_gis_features b
    WHERE b.layer_name = 'buildings' 
    AND ST_Intersects(b.geometry, ST_GeomFromGeoJSON($1))
  `;
  const conflictRes = await query(conflictQuery, [geomString]);
  const conflictCount = parseInt(conflictRes.rows[0].count);

  // We can fetch details of up to 10 conflicting buildings
  const conflictDetailsQuery = `
    SELECT 
      id, 
      COALESCE(name, properties->>'building', 'Unknown Building') as "building", 
      COALESCE(properties->>'addr:street', properties->>'address', 'No address') as "addr:street"
    FROM master_gis_features b
    WHERE b.layer_name = 'buildings' 
    AND ST_Intersects(b.geometry, ST_GeomFromGeoJSON($1))
    LIMIT 10
  `;
  const detailsRes = await query(conflictDetailsQuery, [geomString]);
  const conflictDetails = JSON.stringify(detailsRes.rows);

  const insertQuery = `
    INSERT INTO scenarios (
      name, scenario_type, description, geometry, 
      conflict_count, conflict_details, created_by
    )
    VALUES (
      $1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), 
      $5, $6, $7
    )
    RETURNING id, name, scenario_type, description, status, conflict_count, conflict_details, created_at
  `;
  
  const result = await query(insertQuery, [
    name, 
    scenario_type, 
    description, 
    geomString, 
    conflictCount, 
    conflictDetails, 
    created_by
  ]);
  
  return result.rows[0];
};

export const getScenarios = async (statusFilter) => {
  let sql = `
    SELECT id, name, scenario_type, description, status, conflict_count, created_at
    FROM scenarios
  `;
  const params = [];
  
  if (statusFilter) {
    sql += ` WHERE status = $1`;
    params.push(statusFilter);
  }
  
  sql += ` ORDER BY created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
};

export const getScenarioById = async (id) => {
  const sql = `
    SELECT 
      id, name, scenario_type, description, status, 
      conflict_count, conflict_details, ai_assessment,
      created_by, reviewed_by_engineer, reviewed_by_planner,
      created_at, updated_at,
      ST_AsGeoJSON(geometry)::json as geometry
    FROM scenarios
    WHERE id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

export const updateScenarioStatus = async (id, status, userId, role) => {
  const isReviewer = role === 'ENGINEER' || role === 'PLANNER' || role === 'ADMIN';

  if (!isReviewer) {
    // Simple status update — no reviewer field
    const result = await query(
      `UPDATE scenarios SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  // Status update + reviewer tracking
  const reviewerColumn = role === 'ENGINEER' ? 'reviewed_by_engineer' : 'reviewed_by_planner';
  const result = await query(
    `UPDATE scenarios SET status = $1, ${reviewerColumn} = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
    [status, userId, id]
  );
  return result.rows[0];
};

export const deleteScenario = async (id) => {
  const result = await query(`DELETE FROM scenarios WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};

export const updateScenarioAIAssessment = async (id, aiAssessment) => {
  const result = await query(
    `UPDATE scenarios SET ai_assessment = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [aiAssessment, id]
  );
  return result.rows[0];
};
