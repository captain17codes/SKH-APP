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

  // --- Land Use Impact Analysis ---
  const landUseQuery = `
    SELECT 
      COALESCE(category, properties->>'landuse', 'Unknown') as land_use_type,
      SUM(ST_Area(ST_Intersection(geometry::geography, ST_GeomFromGeoJSON($1)::geography))) as overlap_area_sqm
    FROM master_gis_features
    WHERE layer_name = 'landuse'
      AND ST_Intersects(geometry, ST_GeomFromGeoJSON($1))
    GROUP BY land_use_type
  `;
  const landUseRes = await query(landUseQuery, [geomString]);
  
  const scenarioAreaQuery = `SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) as total_area_sqm`;
  const scenarioAreaRes = await query(scenarioAreaQuery, [geomString]);
  const scenarioTotalArea = parseFloat(scenarioAreaRes.rows[0].total_area_sqm);
  
  const landUseImpactBreakdown = landUseRes.rows.map(row => {
    const area = parseFloat(row.overlap_area_sqm);
    const percentage = scenarioTotalArea > 0 ? (area / scenarioTotalArea) * 100 : 0;
    return {
      type: row.land_use_type,
      area_sqm: area,
      percentage: percentage
    };
  });
  
  const totalAffectedArea = landUseImpactBreakdown.reduce((sum, item) => sum + item.area_sqm, 0);
  const landUseImpact = JSON.stringify({
    breakdown: landUseImpactBreakdown,
    total_affected_area_sqm: totalAffectedArea,
    total_scenario_area_sqm: scenarioTotalArea
  });

  // --- Accessibility Analysis ---
  // Buffer scenario by 400m (approx 5 min walk)
  const accessibilityQuery = `
    WITH buffer AS (
      SELECT ST_Buffer(ST_GeomFromGeoJSON($1)::geography, 400)::geometry AS geom
    ),
    residential AS (
      SELECT geometry, properties
      FROM master_gis_features
      WHERE layer_name = 'landuse' 
        AND (LOWER(category) = 'residential' OR LOWER(properties->>'landuse') = 'residential')
    )
    SELECT 
      SUM(ST_Area(ST_Intersection(r.geometry, b.geom)::geography)) as accessible_residential_area_sqm,
      SUM(ST_Area(r.geometry::geography)) as total_residential_area_sqm,
      (SELECT ST_AsGeoJSON(geom) FROM buffer) as buffer_geojson
    FROM residential r
    JOIN buffer b ON ST_Intersects(r.geometry, b.geom)
  `;
  const accessRes = await query(accessibilityQuery, [geomString]);
  
  let accessibleArea = 0;
  let totalResArea = 0;
  let bufferGeojson = null;
  
  if (accessRes.rows.length > 0) {
    accessibleArea = parseFloat(accessRes.rows[0].accessible_residential_area_sqm) || 0;
    totalResArea = parseFloat(accessRes.rows[0].total_residential_area_sqm) || 0;
    bufferGeojson = JSON.parse(accessRes.rows[0].buffer_geojson);
  }
  
  // Calculate a basic score based on how much residential area is within 400m
  // In a real scenario, this would be compared against total city residential area or population density
  // We'll use absolute thresholds for this demo: > 50,000 sqm is High, > 10,000 is Medium
  let accessibilityScore = 'Low';
  if (accessibleArea > 50000) accessibilityScore = 'High';
  else if (accessibleArea > 10000) accessibilityScore = 'Medium';

  const accessibilityAnalysis = JSON.stringify({
    score: accessibilityScore,
    accessible_area_sqm: accessibleArea,
    total_nearby_residential_sqm: totalResArea,
    buffer_geometry: bufferGeojson,
    method: "approx. straight-line accessibility (400m buffer), not road-network based"
  });

  // --- Environmental / Risk Analysis ---
  const envQuery = `
    WITH water AS (
      SELECT geometry, properties
      FROM master_gis_features
      WHERE layer_name IN ('water_bodies', 'waterways')
    )
    SELECT 
      MIN(ST_Distance(w.geometry::geography, ST_GeomFromGeoJSON($1)::geography)) as min_distance_meters,
      COUNT(w.geometry) FILTER (WHERE ST_Intersects(w.geometry, ST_GeomFromGeoJSON($1))) as direct_intersects
    FROM water w
  `;
  const envRes = await query(envQuery, [geomString]);
  
  let riskScore = 'Low';
  let distanceToWater = null;
  let isIntersecting = false;
  
  if (envRes.rows.length > 0 && envRes.rows[0].min_distance_meters !== null) {
    distanceToWater = parseFloat(envRes.rows[0].min_distance_meters);
    isIntersecting = parseInt(envRes.rows[0].direct_intersects) > 0;
    
    if (isIntersecting) {
      riskScore = 'High';
    } else if (distanceToWater <= 100) {
      riskScore = 'Medium';
    }
  }

  const environmentalRisk = JSON.stringify({
    score: riskScore,
    intersects_water: isIntersecting,
    distance_to_nearest_water_m: distanceToWater
  });

  const insertQuery = `
    INSERT INTO scenarios (
      name, scenario_type, description, geometry, 
      conflict_count, conflict_details, land_use_impact, accessibility_analysis, environmental_risk, created_by
    )
    VALUES (
      $1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), 
      $5, $6, $7, $8, $9, $10
    )
    RETURNING id, name, scenario_type, description, status, conflict_count, conflict_details, land_use_impact, accessibility_analysis, environmental_risk, created_at
  `;
  
  const result = await query(insertQuery, [
    name, 
    scenario_type, 
    description, 
    geomString, 
    conflictCount, 
    conflictDetails, 
    landUseImpact,
    accessibilityAnalysis,
    environmentalRisk,
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
  
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('[DB] Scenarios table does not exist. Returning empty array.');
      return [];
    }
    throw error;
  }
};

export const getScenarioById = async (id) => {
  const sql = `
    SELECT 
      id, name, scenario_type, description, status, 
      conflict_count, conflict_details, ai_assessment,
      land_use_impact, accessibility_analysis, environmental_risk,
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
