import { query } from '../config/db.js';

export const createScenario = async ({ name, scenario_type, description, geometry, created_by }) => {
  // Convert GeoJSON geometry to PostGIS EWKT (4326)
  const geomString = JSON.stringify(geometry);
  
  // Calculate conflicts with buildings
  // We use ST_Intersects to find if the scenario polygon overlaps with any building
  const conflictQuery = `
    SELECT count(*) as count
    FROM kopargaon_buildings b
    WHERE ST_Intersects(b.geometry, ST_GeomFromGeoJSON($1))
  `;
  const conflictRes = await query(conflictQuery, [geomString]);
  const conflictCount = parseInt(conflictRes.rows[0].count);

  // We can fetch details of up to 10 conflicting buildings
  const conflictDetailsQuery = `
    SELECT id, "building", "addr:street"
    FROM kopargaon_buildings b
    WHERE ST_Intersects(b.geometry, ST_GeomFromGeoJSON($1))
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
  let sql = `UPDATE scenarios SET status = $1, updated_at = CURRENT_TIMESTAMP`;
  const params = [status];
  let paramCount = 2;

  if (role === 'ENGINEER') {
    sql += `, reviewed_by_engineer = $${paramCount}`;
    params.push(userId);
  } else if (role === 'PLANNER' || role === 'ADMIN') {
    sql += `, reviewed_by_planner = $${paramCount}`;
    params.push(userId);
  }
  
  sql += ` WHERE id = $${paramCount + (role === 'ENGINEER' || role === 'PLANNER' || role === 'ADMIN' ? 1 : 0)} RETURNING *`;
  if (!(role === 'ENGINEER' || role === 'PLANNER' || role === 'ADMIN')) {
    sql = `UPDATE scenarios SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
    params.push(id);
  } else {
    params.push(id);
  }

  const result = await query(sql, params);
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
