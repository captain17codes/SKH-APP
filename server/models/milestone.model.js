import { query } from '../config/db.js';

export const getMilestonesByProject = async (projectId) => {
  const sql = `
    SELECT id, project_id, name, target_date, completion_date, status, evidence_notes, created_at
    FROM project_milestones
    WHERE project_id = $1
    ORDER BY target_date ASC
  `;
  const result = await query(sql, [projectId]);
  return result.rows;
};

export const createMilestone = async ({ project_id, name, target_date }) => {
  const sql = `
    INSERT INTO project_milestones (project_id, name, target_date)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await query(sql, [project_id, name, target_date]);
  return result.rows[0];
};

export const updateMilestone = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.status) {
    fields.push(`status = $${index++}`);
    values.push(updates.status);
  }
  if (updates.completion_date !== undefined) {
    fields.push(`completion_date = $${index++}`);
    values.push(updates.completion_date);
  }
  if (updates.evidence_notes !== undefined) {
    fields.push(`evidence_notes = $${index++}`);
    values.push(updates.evidence_notes);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  
  const sql = `
    UPDATE project_milestones
    SET ${fields.join(', ')}
    WHERE id = $${index}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0];
};

export const deleteMilestone = async (id) => {
  const result = await query(`DELETE FROM project_milestones WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};
