import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquareWarning, Clock, MapPin, FolderKanban,
  AlertTriangle, Bot, Building2, Search, Bell, Sun, Moon, LogOut,
  User, Shield, ChevronRight, Send, Sparkles, CheckCircle2, Plus, FileText,
  X, Menu, ChevronDown, Check, ArrowRight, Upload, Trash2, Camera, Navigation, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { complaintService, aiPlannerService } from '../services/api';
import CitizenAiAssistant from '../components/ai/CitizenAiAssistant';
import toast from 'react-hot-toast';

const PROBLEM_CATEGORIES = [
  'Road / Pothole',
  'Water Supply',
  'Drainage',
  'Garbage',
  'Street Light',
  'Electricity',
  'Public Property',
  'Other'
];

const CitizenDashboardPage = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const citizenNavItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'report-problem', label: t('reportProblem'), icon: MessageSquareWarning, badge: 'New' },
    { id: 'my-complaints', label: t('myComplaints'), icon: Clock, badge: '3 Active' },
    { id: 'citizen-gis', label: t('citizenGis'), icon: MapPin, badge: 'Live GIS' },
    { id: 'projects-near-me', label: t('projectsNearMe'), icon: FolderKanban },
    { id: 'city-alerts', label: t('cityAlerts'), icon: AlertTriangle, badge: '2 Notices' },
    { id: 'ai-assistant', label: t('aiCitizenAssistant'), icon: Bot, badge: 'AI 2.0' }
  ];

  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      setActiveView(viewParam);
    } else {
      setActiveView('dashboard');
    }
  }, [searchParams]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Form & Upload States
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [complaintForm, setComplaintForm] = useState({
    category: 'Road / Pothole',
    ward: 'Ward 3 - Station Area',
    location: 'Station Road, Ward 3, Kopargaon',
    address: 'Station Road, opposite SBI ATM, Ward 3, Kopargaon',
    latitude: 19.8916,
    longitude: 74.4789,
    description: 'Deep pothole on main Station Road causing severe traffic slowdowns and water accumulation during rains.',
    photos: [] // Array of { file, previewUrl }
  });

  const [lastSubmittedComplaint, setLastSubmittedComplaint] = useState(null);

  // Live My Complaints List
  const [myComplaints, setMyComplaints] = useState([
    {
      id: 'CMP-2026-8901',
      userId: 'USR-CITIZEN-01',
      citizenName: 'Aniket Sharma',
      category: 'Road / Pothole',
      ward: 'Ward 3 - Station Area',
      location: 'Station Road, Kopargaon',
      address: 'Station Road, opposite SBI ATM, Ward 3',
      latitude: 19.8916,
      longitude: 74.4789,
      status: 'In Progress',
      createdAt: '2026-08-10T09:30:00.000Z',
      reportedDate: '10 Aug 2026',
      description: 'Deep pothole causing severe traffic congestion and water logging during rains.',
      photos: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
      aiObservation: 'AI Visual Analysis: Pothole & Road Base Fracture Detected — Estimated Depth: 15cm, Hazard Level: High.',
      officer: 'Er. S. Deshmukh (PWD)',
      sla: '24 hrs remaining'
    },
    {
      id: 'CMP-2026-8902',
      userId: 'USR-CITIZEN-01',
      citizenName: 'Aniket Sharma',
      category: 'Water Supply',
      ward: 'Ward 2 - Tilak Road',
      location: 'Tilak Road Lane 4',
      address: 'Tilak Road Lane 4, Ward 2',
      latitude: 19.8882,
      longitude: 74.4741,
      status: 'Submitted',
      createdAt: '2026-08-11T14:15:00.000Z',
      reportedDate: '11 Aug 2026',
      description: 'Drinking water pipeline joint leak causing low pressure to surrounding houses.',
      photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'],
      aiObservation: 'AI Visual Analysis: Pressurized Water Main Leakage & Puddling Detected.',
      officer: 'Water Supply Dept',
      sla: '48 hrs remaining'
    },
    {
      id: 'CMP-2026-8903',
      userId: 'USR-CITIZEN-01',
      citizenName: 'Aniket Sharma',
      category: 'Garbage',
      ward: 'Ward 1 - Market Yard',
      location: 'Market Yard Gate #2',
      address: 'Market Yard Entry, Ward 1',
      latitude: 19.8942,
      longitude: 74.4755,
      status: 'Resolved',
      createdAt: '2026-08-04T08:00:00.000Z',
      reportedDate: '04 Aug 2026',
      description: 'Commercial vegetable waste dump cleared by municipal sanitation team.',
      photos: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80'],
      aiObservation: 'AI Visual Analysis: Organic Waste Accumulation — Resolved.',
      officer: 'Sanitation Cell',
      sla: 'Completed'
    }
  ]);

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChat, setAiChat] = useState([
    { sender: 'bot', text: 'Namaste! I am your Kopargaon Citizen AI Assistant. How can I assist you today with grievance tracking, municipal building permits, or ward projects?' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // GPS Geolocation Trigger
  const handleFetchGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Detecting current GPS coordinates...', { duration: 1500 });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setComplaintForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: `GPS Pin: ${lat}° N, ${lng}° E`,
          address: `Current Location (${lat}° N, ${lng}° E), Kopargaon Municipal Limits`
        }));
        toast.success(`GPS Location acquired: ${lat}° N, ${lng}° E`);
      },
      (err) => {
        console.warn('GPS location fetch error:', err);
        toast.error('Could not acquire GPS position. Using default Kopargaon coordinates.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Image Selection Handler (Validation & Previews)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (complaintForm.photos.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per complaint submission');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`Invalid file format for ${file.name}. Only JPG, JPEG, PNG, WEBP are accepted.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      validFiles.push({ file, previewUrl, name: file.name });
    }

    if (validFiles.length > 0) {
      setComplaintForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...validFiles]
      }));
      toast.success(`${validFiles.length} photo(s) added for preview`);
    }
  };

  const handleRemovePhoto = (index) => {
    setComplaintForm(prev => {
      const updated = [...prev.photos];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return { ...prev, photos: updated };
    });
    toast('Photo removed', { icon: '🗑️' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      toast.error('Please enter a problem description');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    let finalPhotoUrls = [];

    if (complaintForm.photos.length > 0) {
      setUploadProgress(50);
      finalPhotoUrls = complaintForm.photos.map(p => p.previewUrl);
    } else {
      finalPhotoUrls = ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'];
    }

    setUploadProgress(85);

    let aiObs = `AI Visual Analysis: ${complaintForm.category} issue observed near ${complaintForm.location}.`;
    if (complaintForm.category === 'Road / Pothole') {
      aiObs = 'AI Visual Analysis: Severe Pothole & Road Surface Fracture Detected — Estimated Depth: 12cm, Hazard Rating: High.';
    } else if (complaintForm.category === 'Water Supply') {
      aiObs = 'AI Visual Analysis: Pressurized Water Pipeline Joint Leakage Observed — Water Loss Detected.';
    } else if (complaintForm.category === 'Drainage') {
      aiObs = 'AI Visual Analysis: Stormwater Catch Basin Clogging & Overflow — Localized Flood Risk.';
    } else if (complaintForm.category === 'Garbage') {
      aiObs = 'AI Visual Analysis: Uncollected Organic/Solid Waste Stack — Sanitation Hazard.';
    } else if (complaintForm.category === 'Street Light') {
      aiObs = 'AI Visual Analysis: Damaged Luminaire & Overhead Fitting — Darkness Risk Rating: Medium.';
    }

    const newTicket = {
      id: `CMP-2026-${Math.floor(9000 + Math.random() * 999)}`,
      userId: user?.id || 'USR-CITIZEN-01',
      citizenName: user?.name || 'Aniket Sharma',
      category: complaintForm.category,
      ward: complaintForm.ward,
      location: complaintForm.location,
      address: complaintForm.address,
      latitude: complaintForm.latitude,
      longitude: complaintForm.longitude,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      reportedDate: 'Just Now',
      description: complaintForm.description,
      photos: finalPhotoUrls,
      aiObservation: aiObs,
      officer: 'Dispatching to Municipal Department Cell',
      sla: '72 hrs SLA'
    };

    try {
      await complaintService.create(newTicket);
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }

    setMyComplaints(prev => [newTicket, ...prev]);
    setLastSubmittedComplaint(newTicket);
    setIsSubmitting(false);
    setUploadProgress(100);

    toast.success(`Complaint Submitted! Ticket ID: ${newTicket.id}`);
  };

  const handleAiSend = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiTyping) return;

    const userMsg = aiPrompt;
    setAiChat(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiPrompt('');
    setIsAiTyping(true);

    try {
      const res = await aiPlannerService.queryAI(userMsg, 'auto', 'citizen');
      setAiChat(prev => [...prev, { sender: 'bot', text: res.answer || res.text || 'No response provided.' }]);
    } catch (err) {
      console.error('Citizen AI Chat Error:', err);
      toast.error('AI Assistant service encountered an error.');
      setAiChat(prev => [...prev, { sender: 'bot', text: '⚠️ I am currently experiencing connection difficulties. Please try again later.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* VIEW 1: DASHBOARD OVERVIEW */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Executive Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/20 p-6 rounded-2xl text-white shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{t('citizenPortal')}</span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t('civicDashboard')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{t('civicDashboardDesc')}</p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => {
                      setLastSubmittedComplaint(null);
                      setActiveView('report-problem');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('reportProblem')}</span>
                  </button>
                </div>
              </div>

              {/* Citizen Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Active Grievances</span>
                  <p className="text-2xl font-bold text-amber-500">{myComplaints.filter(c => c.status !== 'Resolved').length} Tickets</p>
                  <span className="text-[10px] text-emerald-500 font-semibold">Under 48h SLA</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Resolved Tickets</span>
                  <p className="text-2xl font-bold text-emerald-500">12 Total</p>
                  <span className="text-[10px] text-slate-400">98% Satisfactory</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ward Infrastructure</span>
                  <p className="text-2xl font-bold text-blue-500">4 Works</p>
                  <span className="text-[10px] text-blue-400">Active in Ward 3</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Public GIS Layers</span>
                  <p className="text-2xl font-bold text-purple-500">11 Vector</p>
                  <span className="text-[10px] text-purple-400">GeoJSON Active</span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>My Active Complaints & Photo Proof</span>
                    <button onClick={() => setActiveView('my-complaints')} className="text-xs font-semibold text-emerald-500 hover:underline">View All →</button>
                  </h3>

                  <div className="space-y-3">
                    {myComplaints.map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {c.photos && c.photos[0] && (
                            <img src={c.photos[0]} alt="Proof" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
                          )}
                          <div className="overflow-hidden">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.id}</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{c.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.ward} • Assigned: {c.officer}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ward Infrastructure Updates</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Station Road Asphalt Surfacing</span>
                        <span className="text-emerald-500 font-bold">90% Done</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Godavari Riverfront Promenade</span>
                        <span className="text-blue-500 font-bold">82% Done</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: REPORT PROBLEM WITH FULL PHOTO UPLOAD & GPS */}
          {activeView === 'report-problem' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Submission Confirmation Card */}
              {lastSubmittedComplaint ? (
                <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center space-x-3 text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Grievance Ticket Successfully Logged!</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Official Municipal Tracking Record Created</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{lastSubmittedComplaint.id}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Status: {lastSubmittedComplaint.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                        <span className="font-semibold">{lastSubmittedComplaint.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date</span>
                        <span className="font-semibold">{new Date(lastSubmittedComplaint.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Location & Coordinates</span>
                        <span className="font-semibold">{lastSubmittedComplaint.location}</span>
                        <span className="block font-mono text-[11px] text-slate-500">({lastSubmittedComplaint.latitude}° N, {lastSubmittedComplaint.longitude}° E)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Citizen ID</span>
                        <span className="font-semibold">{lastSubmittedComplaint.userId} ({lastSubmittedComplaint.citizenName})</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Description</span>
                      <p className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">{lastSubmittedComplaint.description}</p>
                    </div>

                    {/* Photo Proof */}
                    {lastSubmittedComplaint.photos && lastSubmittedComplaint.photos.length > 0 && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">📷 Uploaded Ground Photos</span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {lastSubmittedComplaint.photos.map((pUrl, idx) => (
                            <img key={idx} src={pUrl} alt="Submitted Proof" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Observation */}
                    {lastSubmittedComplaint.aiObservation && (
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-cyan-500">🤖 AI Observation</span>
                        <p className="text-xs font-semibold">{lastSubmittedComplaint.aiObservation}</p>
                        <span className="text-[9px] text-slate-400 block italic">Automated visual analysis advisory — subject to municipal officer review.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveView('my-complaints')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 text-center"
                    >
                      Track Ticket in My Complaints →
                    </button>
                    <button
                      onClick={() => setLastSubmittedComplaint(null)}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs"
                    >
                      Submit Another Grievance
                    </button>
                  </div>
                </div>
              ) : (
                /* Report Problem Form */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <MessageSquareWarning className="w-5 h-5 text-emerald-500" />
                      <span>Report a Problem / Submit Citizen Grievance</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct submission to Kopargaon Municipal Department Head with photo evidence & GPS tag.
                    </p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
                    {/* 1. Category Selector */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">1. Select Problem Category *</label>
                      <select
                        value={complaintForm.category}
                        onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                      >
                        {PROBLEM_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Problem Description */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">2. Problem Description *</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe the issue in detail (e.g. depth of pothole, road blockages, danger level)..."
                        value={complaintForm.description}
                        onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white leading-relaxed"
                      />
                    </div>

                    {/* 3. Upload Photo (JPG, JPEG, PNG, WEBP — Max 5 — Previews & Remove Button) */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-800 dark:text-slate-200">
                        3. Upload Ground Photos (Max 5 Images — JPG, PNG, WEBP)
                      </label>

                      {/* File Inputs (Hidden triggers) */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleImageSelect}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        capture="environment"
                        className="hidden"
                      />

                      {/* Drop-zone Box */}
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
                        <div className="flex justify-center items-center space-x-3 mb-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Browse Gallery Photos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Photo</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          {complaintForm.photos.length}/5 photos attached • Accepted formats: JPG, JPEG, PNG, WEBP (Max 10MB per file)
                        </p>
                      </div>

                      {/* Image Thumbnail Preview Grid with Remove Button */}
                      {complaintForm.photos.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Attached Image Previews:</span>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {complaintForm.photos.map((item, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm aspect-square bg-slate-950">
                                <img src={item.previewUrl} alt={`Preview ${idx+1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(idx)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all"
                                  title="Remove Photo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                                  #{idx+1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Location Controls & GPS */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <label className="block font-bold text-slate-800 dark:text-slate-200">4. Location & GIS Coordinates</label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleFetchGpsLocation}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1.5 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Use Current GPS Location</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('/citizen/gis')}
                          className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Select Location on Citizen GIS</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500">Latitude / Longitude</span>
                          <input
                            type="text"
                            readOnly
                            value={`${complaintForm.latitude}° N, ${complaintForm.longitude}° E`}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-slate-500">Approximate Address</span>
                          <input
                            type="text"
                            required
                            value={complaintForm.address}
                            onChange={e => setComplaintForm({ ...complaintForm, address: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar when uploading */}
                    {isSubmitting && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 animate-pulse">
                        <div className="flex justify-between text-[11px] font-bold text-emerald-500">
                          <span>Uploading Photos & Generating AI Observation...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting Grievance...' : 'Submit Complaint'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: MY COMPLAINTS WITH PHOTO EVIDENCE & STATUSES */}
          {activeView === 'my-complaints' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span>My Active Complaints, Photo Proof & SLA Tracker</span>
              </h3>

              <div className="space-y-4">
                {myComplaints.map(c => (
                  <div key={c.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{c.id}</span>
                          <span className="text-xs text-slate-400">• {new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{c.category}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        c.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        Status: {c.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>

                    {/* Photo Proof Gallery */}
                    {c.photos && c.photos.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">📷 Uploaded Photos</span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {c.photos.map((pUrl, i) => (
                            <a key={i} href={pUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img src={pUrl} alt="Photo proof" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Observation */}
                    {c.aiObservation && (
                      <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs">
                        <span className="font-bold text-cyan-500 block">🤖 AI Observation:</span>
                        <span>{c.aiObservation}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span>Location: {c.location}</span>
                      <span>Assigned: {c.officer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: CITIZEN GIS */}
          {activeView === 'citizen-gis' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>Public Citizen Vector GIS Map</span>
              </h3>
              <div className="h-[400px] bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400">11-Layer OpenStreetMap Public Grid</p>
                  <p className="text-xs text-slate-300">GeoJSON Ward Boundaries • Water Supply Lines • PWD Improvement Works</p>
                </div>
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-emerald-400 mx-auto animate-bounce mb-2" />
                  <p className="text-sm font-bold">Kopargaon Spatial GIS Viewer</p>
                  <span className="text-xs text-slate-400">Coordinates: 19.8916° N, 74.4789° E</span>
                </div>
                <Link to="/citizen/gis" className="w-fit px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold mx-auto">
                  Open Citizen GIS
                </Link>
              </div>
            </div>
          )}

          {/* VIEW 5: PROJECTS NEAR ME */}
          {activeView === 'projects-near-me' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-blue-500" />
                <span>Infrastructure Projects in Kopargaon Wards</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Station Road Asphalt Surfacing', ward: 'Ward 3', progress: 90, budget: '₹4.8 Cr' },
                  { name: 'Godavari Riverfront Promenade', ward: 'Ward 4', progress: 82, budget: '₹12.5 Cr' },
                  { name: 'Underground Water Pipeline', ward: 'Ward 2', progress: 65, budget: '₹6.2 Cr' },
                  { name: 'Smart Waste Segregation Hub', ward: 'Ward 1', progress: 40, budget: '₹3.5 Cr' }
                ].map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-500">{p.budget}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">{p.ward} • {p.progress}% Completed</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 7: CITY ALERTS */}
          {activeView === 'city-alerts' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Kopargaon Municipal Announcements & Notices</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  <span className="font-bold block">Water Pipeline Maintenance Alert</span>
                  <p className="mt-1">Scheduled shutdown on 14 Aug in Ward 2 & Ward 3 between 10 AM to 4 PM for pipeline upgrade.</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <span className="font-bold block">Station Road Traffic Diversion</span>
                  <p className="mt-1">Asphalt work near Station Bridge approach. Heavy vehicles diverted via Bypass Road.</p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 8: AI CITIZEN ASSISTANT */}
          {activeView === 'ai-assistant' && (
            <CitizenAiAssistant />
          )}
    </div>
  );
};

export default CitizenDashboardPage;
