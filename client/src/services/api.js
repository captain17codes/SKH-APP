import axios from 'axios';
import {
  MOCK_PROJECTS,
  MOCK_COMPLAINTS,
  MOCK_LAND_PLOTS,
  MOCK_DOCUMENTS,
  KOPARGAON_WARDS_GEOJSON
} from '../data/mockData';

import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // Increased for Render cold starts
});

// Centralized Session Data Store
let liveProjects = [...MOCK_PROJECTS];
let liveComplaints = [...MOCK_COMPLAINTS];
let liveLandPlots = [...MOCK_LAND_PLOTS];
let liveDocuments = [...MOCK_DOCUMENTS];

// Track degraded mode to avoid spamming toasts
let isDegraded = false;

// Axios Interceptors
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kopargaon-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => {
    isDegraded = false;
    return response;
  },
  (error) => {
    // If backend is unreachable entirely
    isDegraded = true;
    return Promise.reject(error);
  }
);

// Centralized API Services with live fallback store
export const calculateClientProjectRisk = (project, complaints = liveComplaints) => {
  if (!project) return { risk: "UNKNOWN", score: 0, reasons: ["Insufficient project data for reliable risk analysis."], metrics: { elapsedPercentage: 0, expectedProgress: 0, actualProgress: 0, progressGap: 0, budgetUtilization: 0, budgetSpent: 0, totalBudget: 0, nearbyComplaintsCount: 0 }, recommendations: [] };

  const budget = Number(project.budget || 0);
  const spent = Number(project.spent || 0);
  const progress = Number(project.progress ?? -1);
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const expectedCompletion = (project.expectedCompletion || project.endDate) ? new Date(project.expectedCompletion || project.endDate) : null;

  if (progress < 0 || budget <= 0 || !startDate || !expectedCompletion || isNaN(startDate.getTime()) || isNaN(expectedCompletion.getTime())) {
    return {
      risk: "UNKNOWN",
      score: 0,
      reasons: ["Insufficient project data for reliable risk analysis."],
      metrics: { elapsedPercentage: 0, expectedProgress: 0, actualProgress: progress >= 0 ? progress : 0, progressGap: 0, budgetUtilization: budget > 0 ? Math.round((spent / budget) * 100) : 0, budgetSpent: spent, totalBudget: budget, nearbyComplaintsCount: 0 },
      recommendations: ["Ensure start date, expected completion date, budget, and reported progress are properly recorded."]
    };
  }

  const statusUpper = (project.status || '').toUpperCase();
  if (statusUpper === 'COMPLETED') {
    return {
      risk: "LOW",
      score: 0,
      reasons: ["Project is completed successfully."],
      metrics: { elapsedPercentage: 100, expectedProgress: 100, actualProgress: 100, progressGap: 0, budgetUtilization: Math.round((spent / budget) * 100), budgetSpent: spent, totalBudget: budget, nearbyComplaintsCount: 0 },
      recommendations: ["Perform post-completion audit."]
    };
  }

  if (statusUpper === 'CANCELLED') {
    return {
      risk: "UNKNOWN",
      score: 0,
      reasons: ["Project execution has been cancelled."],
      metrics: { elapsedPercentage: 0, expectedProgress: 0, actualProgress: progress, progressGap: 0, budgetUtilization: Math.round((spent / budget) * 100), budgetSpent: spent, totalBudget: budget, nearbyComplaintsCount: 0 },
      recommendations: ["Re-evaluate project status."]
    };
  }

  const now = new Date();
  const totalDurationMs = expectedCompletion.getTime() - startDate.getTime();
  const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
  const elapsedPercentage = totalDurationMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100))) : 0;
  const expectedProgress = elapsedPercentage;
  const actualProgress = progress;
  const progressGap = actualProgress - expectedProgress;
  const budgetUtilization = Math.round((spent / budget) * 100);
  const financialVariance = budgetUtilization - actualProgress;

  let nearbyUnresolvedCount = 0;
  if (Array.isArray(complaints)) {
    for (const cmp of complaints) {
      if ((cmp.status || '').toUpperCase() !== 'RESOLVED') {
        if (project.ward && cmp.ward && project.ward.toLowerCase().includes(cmp.ward.toLowerCase())) {
          nearbyUnresolvedCount++;
        }
      }
    }
  }

  let score = 0;
  const reasons = [];

  if (progressGap < 0) {
    const delayMagnitude = Math.abs(progressGap);
    if (delayMagnitude >= 30) { score += 35; reasons.push(`Progress is severely behind expected schedule (Gap: ${progressGap}%)`); }
    else if (delayMagnitude >= 15) { score += 25; reasons.push(`Progress is significantly behind expected schedule (Gap: ${progressGap}%)`); }
    else if (delayMagnitude >= 5) { score += 15; reasons.push(`Progress is moderately behind expected schedule (Gap: ${progressGap}%)`); }
  }

  if (financialVariance > 25) {
    score += 25;
    reasons.push(`Budget utilization (${budgetUtilization}%) is significantly higher than reported physical progress (${actualProgress}%)`);
  } else if (financialVariance > 10) {
    score += 15;
    reasons.push(`Budget utilization (${budgetUtilization}%) is moderately higher than reported physical progress (${actualProgress}%)`);
  }

  if (statusUpper === 'DELAYED') {
    score += 20;
    reasons.push("Project status is explicitly marked as DELAYED");
  }

  if (nearbyUnresolvedCount >= 10) {
    score += 20;
    reasons.push(`High complaint concentration (${nearbyUnresolvedCount} unresolved grievances) near project area`);
  } else if (nearbyUnresolvedCount >= 4) {
    score += 12;
    reasons.push(`Moderate complaint concentration (${nearbyUnresolvedCount} unresolved grievances) near project area`);
  } else if (nearbyUnresolvedCount >= 1) {
    score += 5;
    reasons.push(`Unresolved citizen complaints detected near project area (${nearbyUnresolvedCount} cases)`);
  }

  if (now > expectedCompletion) {
    score += 15;
    reasons.push("Project has surpassed its expected completion target date");
  }

  score = Math.min(100, score);
  let risk = "LOW";
  if (score > 75) risk = "CRITICAL";
  else if (score > 50) risk = "HIGH";
  else if (score > 25) risk = "MEDIUM";

  const recommendations = [];
  if (progressGap < -10 || statusUpper === 'DELAYED') {
    recommendations.push("Review project schedule and investigate causes of delay");
    recommendations.push("Verify reported physical progress through site inspection");
    recommendations.push("Reassess expected completion date");
  }
  if (financialVariance > 15) {
    recommendations.push("Review remaining budget allocation against remaining work");
  }
  if (nearbyUnresolvedCount > 0) {
    recommendations.push("Check nearby complaint concentration and resolve site issues");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintain standard progress monitoring and milestone tracking");
  }

  return {
    risk,
    score,
    reasons: reasons.length ? reasons : ["Project execution is operating within normal variance parameters."],
    metrics: {
      elapsedPercentage,
      expectedProgress,
      actualProgress,
      progressGap,
      budgetUtilization,
      budgetSpent: spent,
      totalBudget: budget,
      nearbyComplaintsCount: nearbyUnresolvedCount
    },
    recommendations
  };
};

// Centralized API Services with live fallback store
export const projectService = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/projects');
      return res.data;
    } catch {
      return liveProjects.map(p => {
        const riskAnalysis = calculateClientProjectRisk(p);
        return {
          ...p,
          aiRisk: riskAnalysis.risk,
          riskScore: riskAnalysis.score,
          riskAnalysis
        };
      });
    }
  },
  getById: async (id) => {
    try {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data;
    } catch {
      const p = liveProjects.find(item => item.id.toLowerCase() === id.toLowerCase());
      if (!p) return null;
      const riskAnalysis = calculateClientProjectRisk(p);
      return {
        ...p,
        aiRisk: riskAnalysis.risk,
        riskScore: riskAnalysis.score,
        riskAnalysis
      };
    }
  },
  getOverview: async () => {
    try {
      const res = await apiClient.get('/projects/overview');
      return res.data;
    } catch {
      const enriched = liveProjects.map(p => ({
        ...p,
        riskAnalysis: calculateClientProjectRisk(p)
      }));
      let ongoing = 0, completed = 0, delayed = 0, highRisk = 0, criticalRisk = 0;
      enriched.forEach(p => {
        const st = (p.status || '').toUpperCase();
        if (st === 'IN_PROGRESS' || st === 'ONGOING' || st === 'APPROVED') ongoing++;
        if (st === 'COMPLETED') completed++;
        if (st === 'DELAYED') delayed++;
        if (p.riskAnalysis.risk === 'HIGH') highRisk++;
        if (p.riskAnalysis.risk === 'CRITICAL') criticalRisk++;
      });
      return {
        totalProjects: liveProjects.length,
        ongoing,
        completed,
        delayed,
        highRisk,
        criticalRisk
      };
    }
  },
  create: async (projectData) => {
    try {
      const res = await apiClient.post('/projects', projectData);
      return res.data;
    } catch {
      const newProj = {
        id: `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...projectData,
        spent: projectData.spent || 0,
        progress: projectData.progress || 0,
        status: projectData.status || 'PLANNED',
        documentsCount: 1,
        photosCount: 2,
        coordinates: projectData.coordinates || [19.8917 + (Math.random() - 0.5) * 0.02, 74.4789 + (Math.random() - 0.5) * 0.02],
        timeline: projectData.timeline || [
          { date: new Date().toISOString().split('T')[0], title: 'Project Registered (Offline)', status: 'completed' }
        ]
      };
      liveProjects = [newProj, ...liveProjects];
      const riskAnalysis = calculateClientProjectRisk(newProj);
      return { ...newProj, aiRisk: riskAnalysis.risk, riskScore: riskAnalysis.score, riskAnalysis };
    }
  },
  update: async (id, updatedFields) => {
    try {
      const res = await apiClient.put(`/projects/${id}`, updatedFields);
      return res.data;
    } catch {
      liveProjects = liveProjects.map(p => p.id === id ? { ...p, ...updatedFields } : p);
      const updated = liveProjects.find(p => p.id === id);
      const riskAnalysis = calculateClientProjectRisk(updated);
      return { ...updated, aiRisk: riskAnalysis.risk, riskScore: riskAnalysis.score, riskAnalysis };
    }
  },
  delete: async (id) => {
    try {
      await apiClient.delete(`/projects/${id}`);
    } catch {
      liveProjects = liveProjects.filter(p => p.id !== id);
    }
    return true;
  }
};

export const complaintService = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/complaints');
      return res.data;
    } catch {
      return liveComplaints;
    }
  },
  getMyComplaints: async () => {
    try {
      const res = await apiClient.get('/complaints/my');
      return res.data;
    } catch {
      return liveComplaints.filter(c => c.reporterName === 'Anonymous Citizen' || c.reporterContact); 
    }
  },
  create: async (complaintData) => {
    try {
      const res = await apiClient.post('/complaints', complaintData);
      liveComplaints = [res.data, ...liveComplaints];
      return res.data;
    } catch {
      const newComp = {
        id: `CMP-2026-${Math.floor(8000 + Math.random() * 900)}`,
        ...complaintData,
        photos: (Array.isArray(complaintData.photos) && complaintData.photos.length > 0)
          ? complaintData.photos
          : (complaintData.imageBase64 ? [complaintData.imageBase64] : (complaintData.photoUrl ? [complaintData.photoUrl] : [])),
        reportedDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        priority: 'MEDIUM',
        aiScore: 50,
        aiReasons: ['Offline — AI scoring unavailable'],
        upvotes: 1
      };
      liveComplaints = [newComp, ...liveComplaints];
      return newComp;
    }
  },
  updateStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/complaints/${id}`, { status });
      return res.data;
    } catch {
      liveComplaints = liveComplaints.map(c => c.id === id ? { ...c, status } : c);
      return liveComplaints.find(c => c.id === id);
    }
  },
  upvote: async (id) => {
    try {
      const res = await apiClient.post(`/complaints/${id}/upvote`);
      return res.data;
    } catch {
      liveComplaints = liveComplaints.map(c => c.id === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c);
      return liveComplaints.find(c => c.id === id);
    }
  },
  delete: async (id) => {
    try {
      await apiClient.delete(`/complaints/${id}`);
    } catch {
      liveComplaints = liveComplaints.filter(c => c.id !== id);
    }
    return true;
  },
  getHotspots: async () => {
    try {
      const res = await apiClient.get('/complaints/hotspots');
      return res.data;
    } catch {
      // Build GeoJSON from live store fallback
      const open = liveComplaints.filter(c => c.status !== 'Resolved' && c.coordinates);
      return {
        type: 'FeatureCollection',
        features: open.map(c => ({
          type: 'Feature',
          properties: {
            id: c.id,
            title: c.title,
            category: c.category,
            priority: c.priority || 'MEDIUM',
            aiScore: c.aiScore || 50,
            status: c.status,
            ward: c.ward,
            upvotes: c.upvotes
          },
          geometry: {
            type: 'Point',
            coordinates: [c.coordinates[1], c.coordinates[0]]
          }
        }))
      };
    }
  },
  sendOtp: async (phone) => {
    try {
      const res = await apiClient.post('/complaints/otp/send', { phone });
      return res.data;
    } catch (e) {
      console.log('Offline mock send OTP');
      return { success: true, message: `OTP sent to ${phone}` };
    }
  },
  verifyOtp: async (phone, code) => {
    try {
      const res = await apiClient.post('/complaints/otp/verify', { phone, code });
      return res.data;
    } catch (e) {
      if (code === '123456') {
        const token = `verify_mock_${Date.now()}`;
        return { success: true, verificationToken: token };
      }
      throw new Error('Invalid OTP', { cause: e });
    }
  }
};

export const landService = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/land-use');
      return res.data;
    } catch {
      return liveLandPlots;
    }
  }
};

export const propertyService = {
  getAll: async (params = {}) => {
    try {
      const res = await apiClient.get('/properties', { params });
      return res.data;
    } catch {
      return liveLandPlots;
    }
  },
  getById: async (id) => {
    try {
      const res = await apiClient.get(`/properties/${id}`);
      return res.data;
    } catch {
      return liveLandPlots.find(p => p.id === id) || null;
    }
  },
  create: async (propertyData) => {
    try {
      const res = await apiClient.post('/properties', propertyData);
      return res.data;
    } catch {
      const newProp = {
        id: `KOP-PR-${Math.floor(100 + Math.random() * 900)}`,
        ...propertyData,
        status: 'Available',
        verificationStatus: 'Pending Verification',
        createdAt: new Date().toISOString()
      };
      liveLandPlots.unshift(newProp);
      return newProp;
    }
  },
  submitInquiry: async (propertyId, inquiryData) => {
    try {
      const res = await apiClient.post(`/properties/${propertyId}/inquiry`, inquiryData);
      return res.data;
    } catch {
      return { success: true };
    }
  },
  getMyListings: async (sellerId) => {
    try {
      const res = await apiClient.get(`/properties/my-listings/${sellerId}`);
      return res.data;
    } catch {
      return liveLandPlots.filter(p => p.sellerId === sellerId);
    }
  },
  updateStatus: async (id, statusData) => {
    try {
      const res = await apiClient.patch(`/properties/${id}/status`, statusData);
      return res.data;
    } catch {
      return { success: true };
    }
  }
};

export const documentService = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/documents');
      return res.data;
    } catch {
      return liveDocuments;
    }
  },
  create: async (docData) => {
    try {
      const res = await apiClient.post('/documents', docData);
      return res.data;
    } catch {
      liveDocuments = [docData, ...liveDocuments];
      return docData;
    }
  }
};

export const aiPlannerService = {
  queryAI: async (prompt, language) => {
    try {
      const res = await apiClient.post('/ai/urban-planner', { query: prompt, language: language || 'en-IN' });
      return res.data;
    } catch (e) {
      console.error('❌ Backend POST /api/ai/urban-planner failed:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        config: e.config
      });
      throw e;
    }
  },
  synthesizeTTS: async (text, language) => {
    try {
      const res = await apiClient.post('/tts', { text, language: language || 'mr-IN' }, { responseType: 'blob' });
      return res.data;
    } catch (e) {
      console.error('❌ Backend POST /api/tts failed:', e);
      throw e;
    }
  }
};

export const ttsService = {
  speak: async (text, language) => {
    try {
      const response = await apiClient.post(
        '/tts',
        { text, language },
        { responseType: 'blob' }
      );
      return URL.createObjectURL(response.data);
    } catch (e) {
      console.error('Backend POST /api/tts failed:', e);
      throw e;
    }
  }
};

export const gisService = {
  getWardsGeoJSON: async () => {
    try {
      const res = await apiClient.get('/gis/wards');
      return res.data;
    } catch {
      return KOPARGAON_WARDS_GEOJSON;
    }
  }
};

// Demo users for client-side fallback when server is unreachable
const CLIENT_DEMO_USERS = [
  { id: 'ADMIN-001', name: 'Admin Officer', email: 'admin@kopargaon.gov', password: 'admin123', role: 'Administrator' },
  { id: 'BUSINESS-001', name: 'Business User', email: 'business@gmail.com', password: 'business', role: 'Business' }
];

export const authService = {
  sendOtp: async (phone) => {
    try {
      const res = await apiClient.post('/auth/otp/send', { phone });
      return res.data;
    } catch {
      // Fallback: simulate OTP sent in dev
      console.log('[AUTH FALLBACK] OTP send simulated for', phone);
      return { success: true, message: `OTP sent to ${phone}` };
    }
  },
  verifyOtp: async (phone, otp, role) => {
    try {
      const res = await apiClient.post('/auth/otp/verify', { phone, otp, role });
      return res.data;
    } catch {
      // Fallback: accept 123456 as demo OTP
      if (otp === '123456') {
        return {
          success: true,
          token: `mock_citizen_token_${Date.now()}`,
          user: { id: `CITIZEN-${phone}`, name: 'Citizen (Demo)', email: `${phone}@citizen.local`, role: role || 'Citizen' }
        };
      }
      throw new Error('Invalid OTP');
    }
  },
  adminLogin: async (email, password) => {
    try {
      const res = await apiClient.post('/auth/admin/login', { email, password });
      return res.data;
    } catch (e) {
      // Client-side demo fallback when server is unreachable
      const demo = CLIENT_DEMO_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (demo) {
        console.warn('[AUTH FALLBACK] Server unreachable — using client-side demo credentials.');
        return {
          success: true,
          token: `demo_token_${demo.id}_${Date.now()}`,
          user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role }
        };
      }
      throw e;
    }
  },
  googleVerify: async (credential, role) => {
    const res = await apiClient.post('/auth/google/verify', { credential, role });
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  }
};

export const scenarioService = {
  create: async (data) => {
    const res = await apiClient.post('/scenarios', data);
    return res.data.data;
  },
  getAll: async (status) => {
    const res = await apiClient.get('/scenarios', { params: { status } });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/scenarios/${id}`);
    return res.data.data;
  },
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/scenarios/${id}/status`, { status });
    return res.data.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/scenarios/${id}`);
    return res.data;
  },
  getAiAssessment: async (scenarioData) => {
    const res = await apiClient.post('/ai/scenario-assessment', scenarioData);
    return res.data.assessment;
  }
};

export const milestoneService = {
  getByProject: async (projectId) => {
    const res = await apiClient.get(`/projects/${projectId}/milestones`);
    return res.data.data;
  },
  create: async (projectId, data) => {
    const res = await apiClient.post(`/projects/${projectId}/milestones`, data);
    return res.data.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/projects/milestones/${id}`, data);
    return res.data.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/projects/milestones/${id}`);
    return res.data;
  }
};

export default apiClient;
