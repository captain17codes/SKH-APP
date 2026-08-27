import { query } from '../config/db.js';

/**
 * Handles promoting a completed project's geometry into the permanent 
 * Digital Twin / AS-IS spatial tables (e.g., roads, buildings).
 */
export const promoteProjectToDigitalTwin = async (project) => {
  if (!project || !project.geometry || !project.category) {
    console.warn(`[AS-BUILT] Cannot promote project ${project.id}: missing geometry or category.`);
    return false;
  }

  try {
    const geomString = typeof project.geometry === 'string' 
      ? project.geometry 
      : JSON.stringify(project.geometry);

    const category = project.category.toLowerCase();

    // Decide which target table to update based on project category
    if (category.includes('road') || category.includes('transport')) {
      const sql = `
        INSERT INTO kopargaon_roads (id, "name", "highway", "data_source", geometry)
        VALUES ($1, $2, $3, 'as-built', ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))
        ON CONFLICT DO NOTHING
      `;
      await query(sql, [`as-built-${project.id}`, project.name, 'unclassified', geomString]);
      console.log(`[AS-BUILT] Promoted project ${project.id} to kopargaon_roads`);
      return true;
    } 
    else if (category.includes('facility') || category.includes('healthcare') || category.includes('education') || category.includes('building')) {
      const sql = `
        INSERT INTO kopargaon_buildings (id, "building", "name", "data_source", geometry)
        VALUES ($1, $2, $3, 'as-built', ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))
        ON CONFLICT DO NOTHING
      `;
      await query(sql, [`as-built-${project.id}`, 'yes', project.name, geomString]);
      console.log(`[AS-BUILT] Promoted project ${project.id} to kopargaon_buildings`);
      return true;
    }
    else {
      // For general infrastructure like drainage, water, etc.
      const sql = `
        INSERT INTO infrastructure (id, asset_id, name, type, data_source, geometry)
        VALUES ($1, $2, $3, $4, 'as-built', ST_SetSRID(ST_GeomFromGeoJSON($5), 4326))
        ON CONFLICT (asset_id) DO NOTHING
      `;
      await query(sql, [`as-built-${project.id}`, project.id, project.name, project.category, geomString]);
      console.log(`[AS-BUILT] Promoted project ${project.id} to infrastructure`);
      return true;
    }
  } catch (error) {
    console.error(`[AS-BUILT] Failed to promote project ${project.id}:`, error);
    return false;
  }
};
