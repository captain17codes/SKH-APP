import { query } from '../config/db.js';

let fallbackMode = false;

let fallbackComplaints = [
  {
    id: 'CMP-2026-8901', title: 'Severe Asphalt Potholes on Tilak Road Junction', category: 'Road Damage',
    ward: 'Ward 3 - Laxmi Nagar', location: 'Near Laxmi Narayan Temple, Tilak Road', coordinates: [19.8882, 74.4741],
    reportedDate: '2026-08-02', status: 'In Progress', priority: 'HIGH', aiScore: 72,
    aiReasons: ['Core utility/roadway category', 'High-severity hazard keywords detected'],
    reporterName: 'Rajendra Joshi', reporterContact: '+91 98220 *****', description: 'Large 2-foot wide pothole causing severe traffic slowdowns and two-wheeler accidents during monsoon rains.',
    assignedDept: 'Public Works Department', upvotes: 42, isAnonymous: false
  },
  {
    id: 'CMP-2026-8902', title: 'Drinking Water Pipeline Leakage & Low Pressure', category: 'Water Leakage',
    ward: 'Ward 1 - Sangamner Naka', location: 'Station Road Lane 4', coordinates: [19.8942, 74.4755],
    reportedDate: '2026-08-04', status: 'Pending', priority: 'MEDIUM', aiScore: 58,
    aiReasons: ['Core utility/roadway category (Water Leakage)', 'High-severity hazard keywords detected in description'],
    reporterName: 'Sunita Gade', reporterContact: '+91 94231 *****', description: 'Clean water leaking onto public road for 3 consecutive days. Surrounding households receiving low pressure.',
    assignedDept: 'Water Supply Dept', upvotes: 19, isAnonymous: false
  },
  {
    id: 'CMP-2026-8903', title: 'Uncollected Commercial Waste Near Samvatsar Gate', category: 'Garbage',
    ward: 'Ward 6 - Samvatsar Border', location: 'Samvatsar Agri Market Entry', coordinates: [19.8995, 74.4940],
    reportedDate: '2026-08-06', status: 'Resolved', priority: 'HIGH', aiScore: 65,
    aiReasons: ['Standard civic maintenance category (Garbage)', 'Multiple complaints registered nearby of same category'],
    reporterName: 'Mahesh Thorat', reporterContact: '+91 97630 *****', description: 'Vegetable waste pile accumulation causing bad odor and pest breeding.',
    assignedDept: 'Solid Waste Management', upvotes: 35, isAnonymous: false
  },
  {
    id: 'CMP-2026-8904', title: 'Non-Functional LED Streetlights on Bypass Road', category: 'Street Light',
    ward: 'Ward 4 - Yesgaon Bypass', location: 'Yesgaon Flyover Approach Road', coordinates: [19.8845, 74.4862],
    reportedDate: '2026-08-01', status: 'In Progress', priority: 'MEDIUM', aiScore: 45,
    aiReasons: ['Standard civic maintenance category (Street Light)', 'Proximity to major high-traffic road bypass corridor'],
    reporterName: 'Prakash Shinde', reporterContact: '+91 98902 *****', description: 'Dark stretch of 800 meters leading to safety hazards for night commuters.',
    assignedDept: 'Electrical Department', upvotes: 28, isAnonymous: false
  },
  {
    id: 'CMP-2026-8905', title: 'Open Stormwater Drain Chamber Without Cover', category: 'Drainage',
    ward: 'Ward 5 - MIDC Zone', location: 'Takli Road near School Gate', coordinates: [19.8798, 74.4635],
    reportedDate: '2026-08-05', status: 'Pending', priority: 'CRITICAL', aiScore: 88,
    aiReasons: ['Core utility/roadway category', 'High-severity hazard keywords detected in description', 'Located near critical municipal asset (school buffer zone)', 'Located in high-density population zone'],
    reporterName: 'Kavita Salunke', reporterContact: '+91 91580 *****', description: 'Concrete cover broken off drain box near primary school entrance. Immediate hazard for children.',
    assignedDept: 'Drainage Maintenance', upvotes: 56, isAnonymous: false
  },
  {
    id: 'CMP-2026-8906', title: 'Unauthorized Construction Encroaches Public Footpath', category: 'Illegal Construction',
    ward: 'Ward 7 - Subhash Road', location: 'Subhash Road Market Plot 45', coordinates: [19.8905, 74.4768],
    reportedDate: '2026-07-28', status: 'Under Review', priority: 'MEDIUM', aiScore: 40,
    aiReasons: ['General municipal request category (Illegal Construction)'],
    reporterName: 'Anil Wagh', reporterContact: '+91 94222 *****', description: 'Commercial shop extension extending 6 feet onto municipal sidewalk blockading pedestrian movement.',
    assignedDept: 'Anti-Encroachment Cell', upvotes: 14, isAnonymous: false
  }
];

export const initComplaintsTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        ward VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        lat NUMERIC,
        lng NUMERIC,
        reported_date DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        ai_score INTEGER,
        ai_reasons JSONB,
        reporter_name VARCHAR(255),
        reporter_contact VARCHAR(100),
        description TEXT,
        assigned_dept VARCHAR(100),
        upvotes INTEGER DEFAULT 0,
        is_anonymous BOOLEAN DEFAULT false,
        user_id VARCHAR(50)
      )
    `);
    
    // Seed DB if empty
    const { rows } = await query('SELECT COUNT(*) FROM complaints');
    if (parseInt(rows[0].count) === 0) {
      for (const c of fallbackComplaints) {
        await query(`
          INSERT INTO complaints (id, title, category, ward, location, lat, lng, reported_date, status, priority, ai_score, ai_reasons, reporter_name, reporter_contact, description, assigned_dept, upvotes, is_anonymous, user_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          c.id, c.title, c.category, c.ward, c.location, c.coordinates[0], c.coordinates[1], 
          c.reportedDate, c.status, c.priority, c.aiScore, JSON.stringify(c.aiReasons), 
          c.reporterName, c.reporterContact, c.description, c.assignedDept, c.upvotes, 
          c.isAnonymous, c.userId || null
        ]);
      }
    }
  } catch (error) {
    console.warn('[COMPLAINT MODEL] DB init failed, using fallback mode:', error.message);
    fallbackMode = true;
  }
};

const mapRowToComplaint = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  ward: row.ward,
  location: row.location,
  coordinates: [parseFloat(row.lat), parseFloat(row.lng)],
  reportedDate: row.reported_date ? new Date(row.reported_date).toISOString().split('T')[0] : null,
  status: row.status,
  priority: row.priority,
  aiScore: row.ai_score,
  aiReasons: row.ai_reasons || [],
  reporterName: row.reporter_name,
  reporterContact: row.reporter_contact,
  description: row.description,
  assignedDept: row.assigned_dept,
  upvotes: row.upvotes,
  isAnonymous: row.is_anonymous,
  userId: row.user_id
});

export const getAllComplaints = async () => {
  if (fallbackMode) return fallbackComplaints;
  try {
    const { rows } = await query('SELECT * FROM complaints ORDER BY reported_date DESC');
    return rows.map(mapRowToComplaint);
  } catch (error) {
    console.warn('[COMPLAINT MODEL] DB query failed, falling back:', error.message);
    return fallbackComplaints;
  }
};

export const getComplaintById = async (id) => {
  if (fallbackMode) return fallbackComplaints.find(c => c.id === id);
  try {
    const { rows } = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    return rows.length ? mapRowToComplaint(rows[0]) : null;
  } catch (error) {
    return fallbackComplaints.find(c => c.id === id);
  }
};

export const createComplaintDb = async (c) => {
  if (fallbackMode) {
    fallbackComplaints = [c, ...fallbackComplaints];
    return c;
  }
  try {
    await query(`
      INSERT INTO complaints (id, title, category, ward, location, lat, lng, reported_date, status, priority, ai_score, ai_reasons, reporter_name, reporter_contact, description, assigned_dept, upvotes, is_anonymous, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      c.id, c.title, c.category, c.ward, c.location, c.coordinates[0], c.coordinates[1], 
      c.reportedDate, c.status, c.priority, c.aiScore, JSON.stringify(c.aiReasons), 
      c.reporterName, c.reporterContact, c.description, c.assignedDept, c.upvotes, 
      c.isAnonymous || false, c.userId || null
    ]);
    return c;
  } catch (error) {
    console.warn('[COMPLAINT MODEL] Insert failed:', error.message);
    fallbackComplaints = [c, ...fallbackComplaints];
    return c;
  }
};

export const updateComplaintStatusDb = async (id, status) => {
  if (fallbackMode) {
    const idx = fallbackComplaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      fallbackComplaints[idx] = { ...fallbackComplaints[idx], status };
      return fallbackComplaints[idx];
    }
    return null;
  }
  try {
    const { rows } = await query('UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return rows.length ? mapRowToComplaint(rows[0]) : null;
  } catch (error) {
    console.warn('[COMPLAINT MODEL] Update failed:', error.message);
    const idx = fallbackComplaints.findIndex(c => c.id === id);
    if (idx !== -1) fallbackComplaints[idx].status = status;
    return fallbackComplaints.find(c => c.id === id);
  }
};

export const upvoteComplaintDb = async (id) => {
  if (fallbackMode) {
    const idx = fallbackComplaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      fallbackComplaints[idx].upvotes += 1;
      return fallbackComplaints[idx];
    }
    return null;
  }
  try {
    const { rows } = await query('UPDATE complaints SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *', [id]);
    return rows.length ? mapRowToComplaint(rows[0]) : null;
  } catch (error) {
    const idx = fallbackComplaints.findIndex(c => c.id === id);
    if (idx !== -1) fallbackComplaints[idx].upvotes += 1;
    return fallbackComplaints.find(c => c.id === id);
  }
};

export const deleteComplaintDb = async (id) => {
  if (fallbackMode) {
    fallbackComplaints = fallbackComplaints.filter(c => c.id !== id);
    return true;
  }
  try {
    await query('DELETE FROM complaints WHERE id = $1', [id]);
    return true;
  } catch (error) {
    fallbackComplaints = fallbackComplaints.filter(c => c.id !== id);
    return true;
  }
};

initComplaintsTable();
