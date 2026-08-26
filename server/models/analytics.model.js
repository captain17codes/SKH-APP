import pool, { query as dbQuery } from '../config/db.js';

export const getDashboardMetrics = async () => {
  const result = await dbQuery(`
    SELECT 
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM projects WHERE status = 'Completed') as completed_projects,
      (SELECT COUNT(*) FROM complaints WHERE status = 'OPEN') as open_complaints,
      (SELECT COALESCE(AVG(rating), 0) FROM feedback) as average_feedback_rating,
      (SELECT SUM(budget) FROM projects) as total_budget,
      (SELECT SUM(spent) FROM projects) as total_spent
  `);
  
  return result.rows[0];
};

export const getProjectStatusDistribution = async () => {
  const result = await dbQuery(`
    SELECT status, COUNT(*) as count 
    FROM projects 
    GROUP BY status
  `);
  return result.rows;
};

export const getComplaintCategoryDistribution = async () => {
  const result = await dbQuery(`
    SELECT category, COUNT(*) as count 
    FROM complaints 
    GROUP BY category
  `);
  return result.rows;
};
