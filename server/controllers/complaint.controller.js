import { complaintPriorityService } from '../services/complaintPriorityService.js';
import { smsService } from '../services/sms.service.js';

// In-memory store (no DB required; swapped with PostGIS queries when available)
let complaints = [
  {
    id: 'CMP-2026-8901',
    title: 'Severe Asphalt Potholes on Tilak Road Junction',
    category: 'Road Damage',
    ward: 'Ward 3 - Laxmi Nagar',
    location: 'Near Laxmi Narayan Temple, Tilak Road',
    coordinates: [19.8882, 74.4741],
    reportedDate: '2026-08-02',
    status: 'In Progress',
    priority: 'HIGH',
    aiScore: 72,
    aiReasons: ['Core utility/roadway category', 'High-severity hazard keywords detected'],
    reporterName: 'Rajendra Joshi',
    reporterContact: '+91 98220 *****',
    description: 'Large 2-foot wide pothole causing severe traffic slowdowns and two-wheeler accidents during monsoon rains.',
    assignedDept: 'Public Works Department',
    upvotes: 42
  },
  {
    id: 'CMP-2026-8902',
    title: 'Drinking Water Pipeline Leakage & Low Pressure',
    category: 'Water Leakage',
    ward: 'Ward 1 - Sangamner Naka',
    location: 'Station Road Lane 4',
    coordinates: [19.8942, 74.4755],
    reportedDate: '2026-08-04',
    status: 'Pending',
    priority: 'MEDIUM',
    aiScore: 58,
    aiReasons: ['Core utility/roadway category (Water Leakage)', 'High-severity hazard keywords detected in description'],
    reporterName: 'Sunita Gade',
    reporterContact: '+91 94231 *****',
    description: 'Clean water leaking onto public road for 3 consecutive days. Surrounding households receiving low pressure.',
    assignedDept: 'Water Supply Dept',
    upvotes: 19
  },
  {
    id: 'CMP-2026-8903',
    title: 'Uncollected Commercial Waste Near Samvatsar Gate',
    category: 'Garbage',
    ward: 'Ward 6 - Samvatsar Border',
    location: 'Samvatsar Agri Market Entry',
    coordinates: [19.8995, 74.4940],
    reportedDate: '2026-08-06',
    status: 'Resolved',
    priority: 'HIGH',
    aiScore: 65,
    aiReasons: ['Standard civic maintenance category (Garbage)', 'Multiple complaints registered nearby of same category'],
    reporterName: 'Mahesh Thorat',
    reporterContact: '+91 97630 *****',
    description: 'Vegetable waste pile accumulation causing bad odor and pest breeding.',
    assignedDept: 'Solid Waste Management',
    upvotes: 35
  },
  {
    id: 'CMP-2026-8904',
    title: 'Non-Functional LED Streetlights on Bypass Road',
    category: 'Street Light',
    ward: 'Ward 4 - Yesgaon Bypass',
    location: 'Yesgaon Flyover Approach Road',
    coordinates: [19.8845, 74.4862],
    reportedDate: '2026-08-01',
    status: 'In Progress',
    priority: 'MEDIUM',
    aiScore: 45,
    aiReasons: ['Standard civic maintenance category (Street Light)', 'Proximity to major high-traffic road bypass corridor'],
    reporterName: 'Prakash Shinde',
    reporterContact: '+91 98902 *****',
    description: 'Dark stretch of 800 meters leading to safety hazards for night commuters.',
    assignedDept: 'Electrical Department',
    upvotes: 28
  },
  {
    id: 'CMP-2026-8905',
    title: 'Open Stormwater Drain Chamber Without Cover',
    category: 'Drainage',
    ward: 'Ward 5 - MIDC Zone',
    location: 'Takli Road near School Gate',
    coordinates: [19.8798, 74.4635],
    reportedDate: '2026-08-05',
    status: 'Pending',
    priority: 'CRITICAL',
    aiScore: 88,
    aiReasons: ['Core utility/roadway category', 'High-severity hazard keywords detected in description', 'Located near critical municipal asset (school buffer zone)', 'Located in high-density population zone'],
    reporterName: 'Kavita Salunke',
    reporterContact: '+91 91580 *****',
    description: 'Concrete cover broken off drain box near primary school entrance. Immediate hazard for children.',
    assignedDept: 'Drainage Maintenance',
    upvotes: 56
  },
  {
    id: 'CMP-2026-8906',
    title: 'Unauthorized Construction Encroaches Public Footpath',
    category: 'Illegal Construction',
    ward: 'Ward 7 - Subhash Road',
    location: 'Subhash Road Market Plot 45',
    coordinates: [19.8905, 74.4768],
    reportedDate: '2026-07-28',
    status: 'Under Review',
    priority: 'MEDIUM',
    aiScore: 40,
    aiReasons: ['General municipal request category (Illegal Construction)'],
    reporterName: 'Anil Wagh',
    reporterContact: '+91 94222 *****',
    description: 'Commercial shop extension extending 6 feet onto municipal sidewalk blockading pedestrian movement.',
    assignedDept: 'Anti-Encroachment Cell',
    upvotes: 14
  }
];

// Secure storage for sensitive contact info, keyed by complaint ID
const secureContacts = new Map();
// Pre-populate secureContacts for dummy data
complaints.forEach(c => {
  secureContacts.set(c.id, {
    reporterContact: c.reporterContact,
    isAnonymous: false // Legacy dummy data isn't anonymous
  });
});

// Helper to strip sensitive info before sending to client
const sanitizeComplaint = (c) => {
  const contactInfo = secureContacts.get(c.id) || {};
  const isAnonymous = c.isAnonymous || contactInfo.isAnonymous;
  
  if (isAnonymous) {
    return {
      ...c,
      reporterName: 'Anonymous Citizen',
      reporterContact: '[REDACTED]',
      isAnonymous: true
    };
  }
  return c;
};

// GET /api/complaints
export const getAllComplaints = (req, res) => {
  const { category, status, ward, priority } = req.query;
  let filtered = [...complaints];

  if (category) filtered = filtered.filter(c => c.category === category);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (ward) filtered = filtered.filter(c => c.ward && c.ward.includes(ward));
  if (priority) filtered = filtered.filter(c => c.priority === priority.toUpperCase());

  res.json(filtered.map(sanitizeComplaint));
};

// GET /api/complaints/my
export const getMyComplaints = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  const userComplaints = complaints.filter(c => c.userId === userId || c.reporterId === userId);
  res.json(userComplaints.map(sanitizeComplaint));
};

// GET /api/complaints/:id
export const getComplaintById = (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  res.json(sanitizeComplaint(complaint));
};

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const {
      title, category, ward, location, coordinates, description,
      reporterName, reporterContact, isAnonymous, verificationToken
    } = req.body;

    if (!title || !category || !location) {
      return res.status(400).json({ error: 'title, category, and location are required' });
    }

    let verifiedPhone = null;
    if (verificationToken && mockOtpStore.has(verificationToken)) {
      verifiedPhone = mockOtpStore.get(verificationToken);
      mockOtpStore.delete(verificationToken);
    } else if (!req.user && verificationToken) {
      return res.status(401).json({ error: 'Invalid or missing OTP verification token. Please verify your mobile number.' });
    }

    // Run AI priority scoring
    const lat = coordinates ? coordinates[0] : null;
    const lng = coordinates ? coordinates[1] : null;

    let aiResult = { priority: 'MEDIUM', score: 50, reasons: ['Default scoring applied — coordinates not provided'] };
    if (lat !== null && lng !== null) {
      try {
        aiResult = await complaintPriorityService.calculatePriority(category, description || '', lat, lng);
      } catch (e) {
        console.error('[Complaint Controller] AI priority scoring failed:', e.message);
      }
    }

    const authenticatedUser = req.user || null;
    const newId = `CMP-2026-${Math.floor(9000 + Math.random() * 999)}`;
    const complaint = {
      id: newId,
      userId: authenticatedUser ? authenticatedUser.id : (req.body.userId || null),
      citizenName: authenticatedUser ? authenticatedUser.name : (reporterName || 'Citizen'),
      title,
      category,
      ward: ward || 'Unknown Ward',
      location,
      coordinates: coordinates || null,
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: aiResult.priority,
      aiScore: aiResult.score,
      aiReasons: aiResult.reasons,
      reporterName: isAnonymous ? 'Anonymous Citizen' : (authenticatedUser ? authenticatedUser.name : (reporterName || 'Anonymous')),
      reporterContact: isAnonymous ? '[REDACTED]' : (verifiedPhone || (authenticatedUser ? authenticatedUser.phone : null) || reporterContact || 'N/A'),
      isAnonymous: !!isAnonymous,
      description: description || '',
      assignedDept: resolveDept(category),
      upvotes: 1
    };

    // Store actual secure data separately
    secureContacts.set(newId, {
      reporterContact: verifiedPhone || (authenticatedUser ? authenticatedUser.phone : null) || reporterContact || 'N/A',
      isAnonymous: !!isAnonymous
    });

    complaints.unshift(complaint);
    res.status(201).json(sanitizeComplaint(complaint));
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

// GET /api/complaints/hotspots  — returns GeoJSON feature collection for map
export const getHotspots = (req, res) => {
  const open = complaints.filter(c => c.status !== 'Resolved' && c.coordinates);
  const features = open.map(c => ({
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
      // GeoJSON = [lng, lat]; our data stores [lat, lng]
      coordinates: [c.coordinates[1], c.coordinates[0]]
    }
  }));

  res.json({ type: 'FeatureCollection', features });
};

// Helper — map category to department
function resolveDept(category) {
  const map = {
    'Road': 'Public Works Department',
    'Road Damage': 'Public Works Department',
    'Water': 'Water Supply Department',
    'Water Leakage': 'Water Supply Department',
    'Drainage': 'Drainage Maintenance',
    'Street Light': 'Electrical Department',
    'Garbage': 'Solid Waste Management',
    'Traffic': 'Traffic & Transport',
    'Electricity': 'Electrical Department',
    'Illegal Construction': 'Anti-Encroachment Cell',
    'Public Infrastructure': 'Public Works Department'
  };
  return map[category] || 'Municipal Corporation';
}

// ---- MOCK OTP IMPLEMENTATION ----
const mockOtpStore = new Map(); // token -> phone
const mockOtpCodes = new Map(); // phone -> code

export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  
  // Generate a real OTP or use 123456 if DEV_MODE
  const isDev = process.env.DEV_MODE === 'true';
  const code = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  mockOtpCodes.set(phone, code);
  
  try {
    await smsService.sendSms(phone, `Your Kopargaon Smart City verification code is: ${code}`);
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP via SMS gateway' });
  }
};

export const verifyOtp = (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
  
  const expected = mockOtpCodes.get(phone);
  if (expected === code) {
    mockOtpCodes.delete(phone);
    // Issue a temporary verification token valid for submitting a complaint
    const token = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    mockOtpStore.set(token, phone);
    
    return res.json({ success: true, verificationToken: token });
  }
  
  return res.status(401).json({ error: 'Invalid OTP' });
};
