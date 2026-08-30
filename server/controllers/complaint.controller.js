import { complaintPriorityService } from '../services/complaintPriorityService.js';
import { smsService } from '../services/sms.service.js';
import { verificationService } from '../services/verification.service.js';
import { 
  getAllComplaints as getAllComplaintsDb,
  getComplaintById as getComplaintByIdDb,
  createComplaintDb,
  updateComplaintStatusDb,
  upvoteComplaintDb,
  deleteComplaintDb
} from '../models/complaint.model.js';

export const complaintStoreController = {
  getHealth: async () => {
    const complaints = await getAllComplaintsDb();
    return {
      store: 'complaints (postgres/fallback)',
      count: complaints.length,
      status: complaints.length === 0 ? 'wiped' : 'healthy'
    };
  },
  wipe: () => {
    return false; // Deprecated with DB
  },
  restore: () => {
    return false; // Deprecated with DB
  }
};

// Helper to strip sensitive info before sending to client
const sanitizeComplaint = (c) => {
  if (c.isAnonymous) {
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
export const getAllComplaints = async (req, res) => {
  try {
    const { category, status, ward, priority } = req.query;
    let complaints = await getAllComplaintsDb();
    
    if (category) complaints = complaints.filter(c => c.category === category);
    if (status) complaints = complaints.filter(c => c.status === status);
    if (ward) complaints = complaints.filter(c => c.ward && c.ward.includes(ward));
    if (priority) complaints = complaints.filter(c => c.priority === priority.toUpperCase());

    res.json(complaints.map(sanitizeComplaint));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// GET /api/complaints/my
export const getMyComplaints = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const userId = req.user.id;
    const complaints = await getAllComplaintsDb();
    const userComplaints = complaints.filter(c => c.userId === userId || c.reporterId === userId);
    res.json(userComplaints.map(sanitizeComplaint));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user complaints' });
  }
};

// GET /api/complaints/:id
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await getComplaintByIdDb(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(sanitizeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
};

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const {
      title, category, ward, location, coordinates, description,
      reporterName, reporterContact, isAnonymous, verificationToken, imageBase64
    } = req.body;

    if (!title || !category || !location || !coordinates) {
      return res.status(400).json({ error: 'title, category, location, and GPS coordinates are strictly required' });
    }

    const lat = coordinates[0];
    const lng = coordinates[1];

    // 1. GIS Sanity Check
    if (!verificationService.checkGisSanity(lat, lng)) {
      return res.status(403).json({ error: 'Complaint rejected: GPS coordinates are outside Kopargaon municipal limits.' });
    }

    let verifiedPhone = null;
    if (verificationToken && mockOtpStore.has(verificationToken)) {
      verifiedPhone = mockOtpStore.get(verificationToken);
      mockOtpStore.delete(verificationToken);
    } else if (!req.user && verificationToken) {
      return res.status(401).json({ error: 'Invalid or missing OTP verification token. Please verify your mobile number.' });
    }
    
    const contact = verifiedPhone || (req.user ? req.user.phone : reporterContact);
    const ip = req.ip || req.connection.remoteAddress;

    // 2. Burst Clustering Check
    const isBurst = verificationService.checkBurstClustering(contact, ip);

    // 3. pHash Image Check
    let pHash = null;
    if (imageBase64) {
      pHash = await verificationService.generatePHash(imageBase64);
      if (verificationService.checkDuplicateImage(pHash)) {
        return res.status(409).json({ error: 'Complaint rejected: Duplicate image detected in our database.' });
      }
    }

    // 4. Corroboration Check
    const isCorroborated = verificationService.checkCorroboration(lat, lng);

    let verificationStatus = isCorroborated ? 'Corroborated' : (isBurst ? 'Suspicious' : 'Pending');

    // Run AI priority scoring
    let aiResult = { priority: 'MEDIUM', score: 50, reasons: [] };
    if (lat !== null && lng !== null) {
      try {
        aiResult = await complaintPriorityService.calculatePriority(category, description || '', lat, lng);
      } catch (e) {
        console.error('[Complaint Controller] AI priority scoring failed:', e.message);
      }
    }

    const authenticatedUser = req.user || null;
    const newId = `CMP-2026-${Math.floor(9000 + Math.random() * 999)}`;
    const complaintData = {
      id: newId,
      userId: authenticatedUser ? authenticatedUser.id : (req.body.userId || null),
      citizenName: authenticatedUser ? authenticatedUser.name : (reporterName || 'Citizen'),
      title,
      category,
      ward: ward || 'Unknown Ward',
      location,
      coordinates: coordinates || null,
      reportedDate: new Date().toISOString().split('T')[0], // Enforced date format
      status: 'Pending',
      verification_status: verificationStatus,
      priority: aiResult.priority,
      aiScore: aiResult.score,
      aiReasons: aiResult.reasons,
      reporterName: isAnonymous ? 'Anonymous Citizen' : (authenticatedUser ? authenticatedUser.name : (reporterName || 'Anonymous')),
      reporterContact: isAnonymous ? '[REDACTED]' : (contact || 'N/A'),
      isAnonymous: !!isAnonymous,
      description: description || '',
      assignedDept: resolveDept(category),
      photos: imageBase64 ? [imageBase64] : [],
      upvotes: 1
    };

    const newComplaint = await createComplaintDb(complaintData);
    
    // 5. Log for future checks and store hash
    verificationService.logComplaint(contact, ip, lat, lng);
    if (pHash) {
      verificationService.storeHash(newId, pHash);
    }

    res.status(201).json(sanitizeComplaint(newComplaint));
  } catch (e) {
    console.error('[Complaint Controller] createComplaint error:', e);
    res.status(500).json({ error: e.message });
  }
};

// PATCH /api/complaints/:id
export const updateComplaint = async (req, res) => {
  try {
    const { status, priority, assignedDept, adminNote } = req.body;
    
    // We only support updating status via the model currently for simplicity, 
    // but typically you'd expand the SQL to update all these. 
    // For Vercel fixes, status is the main priority.
    if (status) {
      const updated = await updateComplaintStatusDb(req.params.id, status);
      if (!updated) return res.status(404).json({ error: 'Complaint not found' });
      return res.json(sanitizeComplaint(updated));
    }
    
    const complaint = await getComplaintByIdDb(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(sanitizeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};

// POST /api/complaints/:id/upvote
export const upvoteComplaint = async (req, res) => {
  try {
    const updated = await upvoteComplaintDb(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Complaint not found' });
    res.json(sanitizeComplaint(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote complaint' });
  }
};

// DELETE /api/complaints/:id
export const deleteComplaint = async (req, res) => {
  try {
    const deleted = await deleteComplaintDb(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ success: true, deleted: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
};

// GET /api/complaints/hotspots  — returns GeoJSON feature collection for map
export const getHotspots = async (req, res) => {
  try {
    const allComplaints = await getAllComplaintsDb();
    const open = allComplaints.filter(c => c.status !== 'Resolved' && c.coordinates);
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
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
