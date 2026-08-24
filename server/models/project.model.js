import pool, { query as dbQuery } from '../config/db.js';

export const getAllProjects = async (filters = {}) => {
  let sql = `
    SELECT 
      p.*,
      ST_AsGeoJSON(p.geometry)::json AS geojson,
      w.name as ward_name
    FROM projects p
    LEFT JOIN wards w ON p.ward_id = w.id
    WHERE 1=1
  `;
  const values = [];
  
  if (filters.ward_id) {
    values.push(filters.ward_id);
    sql += ` AND p.ward_id = $${values.length}`;
  }
  
  if (filters.status) {
    values.push(filters.status);
    sql += ` AND p.status = $${values.length}`;
  }

  sql += ` ORDER BY p.updated_at DESC`;

  const result = await dbQuery(sql, values);
  return result.rows;
};

export const getProjectById = async (id) => {
  const result = await dbQuery(`
    SELECT 
      p.*,
      ST_AsGeoJSON(p.geometry)::json AS geojson,
      w.name as ward_name
    FROM projects p
    LEFT JOIN wards w ON p.ward_id = w.id
    WHERE p.id = $1 OR p.project_code = $1
  `, [id]);
  return result.rows[0];
};

export const createProject = async (project) => {
  const { id, project_code, name, category, description, status, progress, budget, spent, department, ward_id, geometry } = project;
  
  const result = await dbQuery(
    `INSERT INTO projects (
      id, project_code, name, category, description, status, progress, budget, spent, department, ward_id, geometry
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_GeomFromGeoJSON($12)
    ) RETURNING *`,
    [id, project_code, name, category, description, status, progress, budget, spent, department, ward_id, JSON.stringify(geometry)]
  );
  
  return result.rows[0];
};

export const updateProject = async (id, updates) => {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'geometry') {
      setClauses.push(`${key} = ST_GeomFromGeoJSON($${paramIndex})`);
      values.push(JSON.stringify(value));
    } else {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = now()`);
  
  values.push(id);
  const sql = `
    UPDATE projects 
    SET ${setClauses.join(', ')} 
    WHERE id = $${paramIndex} OR project_code = $${paramIndex}
    RETURNING *
  `;

  const result = await dbQuery(sql, values);
  return result.rows[0];
};

export const deleteProject = async (id) => {
  const result = await dbQuery('DELETE FROM projects WHERE id = $1 OR project_code = $1 RETURNING id', [id]);
  return result.rows[0];
};
