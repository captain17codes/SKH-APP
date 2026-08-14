import { complaintPriorityService } from '../services/complaintPriorityService.js';

// In-memory store initialized with rich mock data
let complaints = [
  {
    id: 'CMP-2026-8901',
    userId: 'USR-8821',
    citizenName: 'Rajendra Joshi',
    title: 'Severe Asphalt Potholes on Tilak Road Junction',
    category: 'Road / Pothole',
    ward: 'Ward 3 - Laxmi Nagar',
    location: 'Near Laxmi Narayan Temple, Tilak Road',
    address: 'Station Road, Ward 3, Kopargaon',
    coordinates: [19.8882, 74.4741],
    latitude: 19.8882,
    longitude: 74.4741,
    reportedDate: '2026-08-02',
    createdAt: '2026-08-02T10:30:00.000Z',
    status: 'In Progress',
    priority: 'HIGH',
    aiScore: 72,
    aiObservation: 'AI Visual Analysis: Pothole & Road Base Fracture Detected — Estimated Depth: 15cm, Hazard Level: High.',
    aiReasons: ['Core utility/roadway category', 'High-severity hazard keywords detected'],
    reporterName: 'Rajendra Joshi',
    reporterContact: '+91 98220 *****',
    description: 'Large 2-foot wide pothole causing severe traffic slowdowns and two-wheeler accidents during monsoon rains.',
    photos: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
    assignedDept: 'Public Works Department',
    upvotes: 42
  },
  {
    id: 'CMP-2026-8902',
    userId: 'USR-7712',
    citizenName: 'Sunita Gade',
    title: 'Drinking Water Pipeline Leakage & Low Pressure',
    category: 'Water Supply',
    ward: 'Ward 1 - Sangamner Naka',
    location: 'Station Road Lane 4',
    address: 'Station Road Lane 4, Ward 1, Kopargaon',
    coordinates: [19.8942, 74.4755],
    latitude: 19.8942,
    longitude: 74.4755,
    reportedDate: '2026-08-04',
    createdAt: '2026-08-04T14:15:00.000Z',
    status: 'Submitted',
    priority: 'MEDIUM',
    aiScore: 58,
    aiObservation: 'AI Visual Analysis: Pressurized Water Main Leakage & Roadside Puddling Detected.',
    aiReasons: ['Core utility category (Water Supply)', 'Leakage detected in description'],
    reporterName: 'Sunita Gade',
    reporterContact: '+91 94231 *****',
    description: 'Clean water leaking onto public road for 3 consecutive days. Surrounding households receiving low pressure.',
    photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'],
    assignedDept: 'Water Supply Dept',
    upvotes: 19
  },
  {
    id: 'CMP-2026-8903',
    userId: 'USR-6650',
    citizenName: 'Mahesh Thorat',
    title: 'Uncollected Commercial Waste Near Samvatsar Gate',
    category: 'Garbage',
    ward: 'Ward 6 - Samvatsar Border',
    location: 'Samvatsar Agri Market Entry',
    address: 'Agri Market Entry, Ward 6, Kopargaon',
    coordinates: [19.8995, 74.4940],
    latitude: 19.8995,
    longitude: 74.4940,
    reportedDate: '2026-08-06',
    createdAt: '2026-08-06T09:00:00.000Z',
    status: 'Resolved',
    priority: 'HIGH',
    aiScore: 65,
    aiObservation: 'AI Visual Analysis: Uncollected Organic Waste Pile — Sanitation Risk.',
    aiReasons: ['Standard civic maintenance category (Garbage)'],
    reporterName: 'Mahesh Thorat',
    reporterContact: '+91 97630 *****',
    description: 'Vegetable waste pile accumulation causing bad odor and pest breeding.',
    photos: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80'],
    assignedDept: 'Solid Waste Management',
    upvotes: 35
  }
];

// Helper: AI Observation Generator
function generateAiObservation(category, description, photosCount = 0) {
  const cat = (category || '').toLowerCase();
  let obs = "AI Visual Analysis: General civic maintenance issue detected. Verified by image submission.";

  if (cat.includes('pothole') || cat.includes('road')) {
    obs = "AI Visual Analysis: Severe Pothole & Road Surface Fracture Detected — Estimated Depth: 12cm. Immediate Asphalt Patching Required.";
  } else if (cat.includes('water')) {
    obs = "AI Visual Analysis: Pressurized Water Main Leakage & Roadside Runoff Observed — Loss Rate: High.";
  } else if (cat.includes('drainage')) {
    obs = "AI Visual Analysis: Stormwater Drain Overflow & Debris Blockage Detected — Localized Flood Risk.";
  } else if (cat.includes('garbage')) {
    obs = "AI Visual Analysis: Organic & Commercial Waste Pile Accumulation — Bio-Sanitation Warning.";
  } else if (cat.includes('light') || cat.includes('street')) {
    obs = "AI Visual Analysis: Non-functional Luminaire / Electrical Enclosure Damage — Night Visibility Risk.";
  } else if (cat.includes('electricity')) {
    obs = "AI Visual Analysis: Exposed Power Distribution Box / Overhead Cable Sag — High Voltage Risk.";
  } else if (cat.includes('property')) {
    obs = "AI Visual Analysis: Public Structure Encroachment / Footpath Obstruction Observed.";
  }

  if (photosCount > 0) {
    obs += ` [Confirmed via ${photosCount} ground photo proof submission(s)].`;
  }
  return obs;
}

// POST /api/complaints/upload
export const uploadPhotos = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photo files uploaded' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    
    const photoUrls = req.files.map(file => {
      return `${protocol}://${host}/uploads/complaints/${file.filename}`;
    });

    res.json({ success: true, photoUrls });
  } catch (e) {
    console.error('[Upload Controller] File upload error:', e);
    res.status(500).json({ error: e.message });
  }
};

// GET /api/complaints
export const getAllComplaints = (req, res) => {
  const { category, status, ward, priority } = req.query;
  let filtered = [...complaints];

  if (category) filtered = filtered.filter(c => c.category === category);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (ward) filtered = filtered.filter(c => c.ward && c.ward.includes(ward));
  if (priority) filtered = filtered.filter(c => c.priority === priority.toUpperCase());

  res.json(filtered);
};

// GET /api/complaints/:id
export const getComplaintById = (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  res.json(complaint);
};

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const {
      title, category, ward, location, address, coordinates, latitude, longitude,
      description, photos, photoUrls, reporterName, reporterContact, userId
    } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'category and description are required' });
    }

    const finalPhotos = photos || photoUrls || [];
    const lat = latitude || (coordinates ? coordinates[0] : 19.8916);
    const lng = longitude || (coordinates ? coordinates[1] : 74.4789);

    let aiResult = { priority: 'MEDIUM', score: 60, reasons: ['Standard civic grievance submitted via Citizen Portal'] };
    try {
      aiResult = await complaintPriorityService.calculatePriority(category, description, lat, lng);
    } catch (e) {
      console.warn('[Complaint Controller] AI scoring fallback:', e.message);
    }

    const aiObservation = req.body.aiObservation || generateAiObservation(category, description, finalPhotos.length);
    const newId = `CMP-2026-${Math.floor(9000 + Math.random() * 999)}`;
    const nowIso = new Date().toISOString();

    const complaint = {
      id: newId,
      userId: userId || 'USR-CITIZEN',
      citizenName: reporterName || 'Aniket Sharma',
      title: title || `${category} - ${location || address || 'Kopargaon'}`,
      category,
      ward: ward || 'Ward 3 - Station Area',
      location: location || address || 'Station Road, Kopargaon',
      address: address || location || 'Station Road, Ward 3, Kopargaon',
      coordinates: [lat, lng],
      latitude: lat,
      longitude: lng,
      reportedDate: nowIso.split('T')[0],
      createdAt: nowIso,
      status: 'Submitted', // Submitted, Acknowledged, Assigned, In Progress, Resolved, Rejected
      priority: aiResult.priority || 'MEDIUM',
      aiScore: aiResult.score || 60,
      aiObservation,
      aiReasons: aiResult.reasons || ['Validated via Citizen Upload Portal'],
      reporterName: reporterName || 'Aniket Sharma',
      reporterContact: reporterContact || '+91 98220 *****',
      description,
      photos: finalPhotos,
      assignedDept: resolveDept(category),
      upvotes: 1
    };

    complaints.unshift(complaint);
    res.status(201).json(complaint);
  } catch (e) {
    console.error('[Complaint Controller] createComplaint error:', e);
    res.status(500).json({ error: e.message });
  }
};

// PATCH /api/complaints/:id
export const updateComplaint = (req, res) => {
  const idx = complaints.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Complaint not found' });

  const allowed = ['status', 'priority', 'assignedDept', 'adminNote'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  complaints[idx] = { ...complaints[idx], ...updates };
  res.json(complaints[idx]);
};

// POST /api/complaints/:id/upvote
export const upvoteComplaint = (req, res) => {
  const idx = complaints.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Complaint not found' });
  complaints[idx].upvotes = (complaints[idx].upvotes || 0) + 1;
  res.json(complaints[idx]);
};

// DELETE /api/complaints/:id
export const deleteComplaint = (req, res) => {
  const exists = complaints.some(c => c.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Complaint not found' });
  complaints = complaints.filter(c => c.id !== req.params.id);
  res.json({ success: true, deleted: req.params.id });
};

// GET /api/complaints/hotspots
export const getHotspots = (req, res) => {
  const open = complaints.filter(c => c.status !== 'Resolved' && (c.coordinates || (c.latitude && c.longitude)));
  const features = open.map(c => {
    const lat = c.latitude || (c.coordinates ? c.coordinates[0] : 19.8916);
    const lng = c.longitude || (c.coordinates ? c.coordinates[1] : 74.4789);
    return {
      type: 'Feature',
      properties: {
        id: c.id,
        title: c.title,
        category: c.category,
        priority: c.priority,
        aiScore: c.aiScore,
        status: c.status,
        ward: c.ward,
        upvotes: c.upvotes
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    };
  });

  res.json({ type: 'FeatureCollection', features });
};

function resolveDept(category) {
  const map = {
    'Road / Pothole': 'Public Works Department',
    'Water Supply': 'Water Supply Department',
    'Drainage': 'Drainage Maintenance Cell',
    'Garbage': 'Solid Waste Management',
    'Street Light': 'Electrical Department',
    'Electricity': 'Electrical Department',
    'Public Property': 'Anti-Encroachment Cell',
    'Other': 'Municipal Grievance Cell'
  };
  return map[category] || 'Municipal Corporation';
}
