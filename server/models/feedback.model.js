import pool, { query as dbQuery } from '../config/db.js';

export const createFeedback = async (feedback) => {
  const { ward_id, project_id, rating, comment, citizen_id } = feedback;
  const result = await dbQuery(
    `INSERT INTO feedback (ward_id, project_id, rating, comment, citizen_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ward_id, project_id, rating, comment, citizen_id]
  );
  return result.rows[0];
};

export const getFeedbackByProject = async (projectId) => {
  const result = await dbQuery(`
    SELECT f.*, u.name as citizen_name
    FROM feedback f
    LEFT JOIN users u ON f.citizen_id = u.id
    WHERE f.project_id = $1
    ORDER BY f.created_at DESC
  `, [projectId]);
  return result.rows;
};

export const getAverageRating = async () => {
  const result = await dbQuery(`SELECT AVG(rating) as average_rating FROM feedback`);
  return result.rows[0].average_rating;
};
