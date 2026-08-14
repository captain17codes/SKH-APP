import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, MapPin, BarChart3, Layers, Briefcase,
  FileCheck, Bot, Building2, Search, Bell, Sun, Moon, LogOut,
  Upload, CheckCircle2, TrendingUp, ArrowRight, Shield, AlertTriangle,
  Menu, X, ChevronDown, Send, FileText, Check, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const BusinessDashboardPage = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const businessNavItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'site-intelligence', label: t('aiSiteIntelligence'), icon: Sparkles, badge: '★ Killer Feature' },
    { id: 'business-gis', label: t('businessGis'), icon: MapPin, badge: 'Live GIS' },
    { id: 'area-intelligence', label: t('areaIntelligence'), icon: BarChart3 },
    { id: 'properties-land', label: t('landProperty'), icon: Layers, path: '/business/properties' },
    { id: 'market-intelligence', label: t('marketCompetitorIntel'), icon: BarChart3 },
    { id: 'upcoming-dev', label: t('upcomingDevelopment'), icon: Building2 },
    { id: 'ai-assistant', label: t('aiBusinessAssistant'), icon: Bot, badge: 'AI Advisor' }
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

  // AI Site Intelligence State Engine
  const [selectedSite, setSelectedSite] = useState('Station Road Commercial Plot #14 - Ward 3');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');

  // Comprehensive Site Intelligence Report Data
  const [siteReport, setSiteReport] = useState({
    siteName: 'Station Road Commercial Plot #14 (CTS #142/A)',
    suitabilityScore: 94,
    suitabilityGrade: 'Highly Feasible — Grade A Commercial Node',
    photoObservations: [
      'Flat clear ground parcel with 24-meter frontage along main DP road',
      'Adjacent to commercial banking structures and retail shops',
      'Clear overhead line clearances, zero structural encroachments observed'
    ],
    gisLocation: 'Ward 3 — Station Area, Kopargaon (19.8916° N, 74.4789° E)',
    landUse: 'C-2 Heavy Commercial Zone (Kopargaon Development Plan 2030)',
    roadAccessibility: '24m Wide DP Arterial Road with direct access to State Highway 10',
    nearbyInfrastructure: [
      '33kV Electric Power Substation located 350 meters East',
      '500mm Municipal Water Trunk Main running parallel to site boundary',
      'Underground Stormwater Drainage Grid (90% coverage)'
    ],
    nearbyProjects: [
      'Station Road Asphalt Surfacing & Solar Lighting (₹4.8 Cr — 90% Completed)',
      'Godavari Riverfront Promenade & Green Belt (₹12.5 Cr — 82% Completed)'
    ],
    nearbyBusinesses: 'High Density Retail, SBI Bank Branch, HDFC Regional Office, Commercial Complex',
    citizenComplaints: '2 active road repair tickets logged within 500m (both within 24h SLA)',
    developmentContext: 'Identified as Primary Commercial Growth Axis under Kopargaon Smart City Master Plan',
    opportunities: [
      'High daily pedestrian footfall (14,200+ / day)',
      'Excellent vehicle accessibility with 24m DP road widening',
      'Zero flood risk zone score (above 100-yr flood buffer level)'
    ],
    risks: [
      'Peak-hour traffic congestion between 5:00 PM – 7:00 PM near railway station approach'
    ],
    recommendedBusinessTypes: [
      'Supermarket / Hypermarket Store',
      'Commercial Bank / Financial Services Branch',
      'EV Fast-Charging & Convenience Hub',
      'QSR / Family Dining Restaurant'
    ]
  });

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChat, setAiChat] = useState([
    { sender: 'bot', text: 'Welcome to Kopargaon AI Site Intelligence! Ask me anything regarding commercial site viability, zoning laws, upcoming municipal tenders, or footfall density.' }
  ]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleRunAnalysis = (siteName) => {
    setSelectedSite(siteName);
    setIsAnalyzing(true);
    setAnalysisStep('Scanning site imagery & computer vision features...');

    setTimeout(() => setAnalysisStep('Mapping 11-layer vector GeoJSON spatial grid...'), 600);
    setTimeout(() => setAnalysisStep('Calculating 1km infrastructure buffer & footfall density...'), 1200);
    setTimeout(() => setAnalysisStep('Evaluating citizen SLA complaints & development risk matrix...'), 1800);

    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('AI Site Intelligence Report Generated!');

      if (siteName.includes('Bypass')) {
        setSiteReport({
          siteName: 'Bypass Corridor Plot #42 (Highway Node)',
          suitabilityScore: 88,
          suitabilityGrade: 'Ideal for Logistics, EV Charging & Motel',
          photoObservations: [
            'Wide industrial plot adjacent to 30m State Highway Bypass Corridor',
            'Direct heavy vehicle turning radius available',
            'Unobstructed line of sight for highway signage'
          ],
          gisLocation: 'Ward 4 — Bypass Corridor, Kopargaon (19.8850° N, 74.4620° E)',
          landUse: 'I-1 Light Industrial & Commercial Highway Zone',
          roadAccessibility: '30m National Highway Bypass Corridor with 4-lane median access',
          nearbyInfrastructure: [
            'High Voltage Express Power Line parallel to highway',
            'Freight Warehousing Water Connection Points'
          ],
          nearbyProjects: [
            'Godavari Riverfront Promenade & Green Belt (82% Done)',
            'Smart Waste Transfer Facility (Phase 1 Active)'
          ],
          nearbyBusinesses: 'Logistics Warehouses, Transport Dhaba, Auto Service Hub, Fuel Station',
          citizenComplaints: '1 streetlight repair complaint logged within 1km (Resolved)',
          developmentContext: 'Transit Oriented Logistics Node under Kopargaon Industrial Strategy',
          opportunities: [
            'High interstate vehicle transit density',
            'Large contiguous acreage for warehousing & truck parking',
            'Low land acquisition cost per sq.ft'
          ],
          risks: [
            'Requires dedicated highway entry/exit NOC approval'
          ],
          recommendedBusinessTypes: [
            'Logistics & Warehousing Terminal',
            'Commercial EV Highway Charging Station',
            'Automobile Showroom & Service Center',
            'Motel & Transit Highway Plaza'
          ]
        });
      } else if (siteName.includes('Gaothan')) {
        setSiteReport({
          siteName: 'Gaothan Market Parcel #8 (Heritage Core)',
          suitabilityScore: 79,
          suitabilityGrade: 'Best for Boutique Retail & Heritage Services',
          photoObservations: [
            'High-density traditional market street frontage',
            'Narrow road access with high pedestrian footfall',
            'Historic gaothan stone structure elevation'
          ],
          gisLocation: 'Ward 1 — Gaothan Market Yard (19.8940° N, 74.4710° E)',
          landUse: 'C-1 Core Mixed Residential Commercial',
          roadAccessibility: '12m Municipal Market Street',
          nearbyInfrastructure: [
            'Municipal Water Grid Connection',
            'Low Voltage Underground Power'
          ],
          nearbyProjects: [
            'Gaothan Underground Water Pipeline Replacement (65% Done)'
          ],
          nearbyBusinesses: 'Textile Shops, Gold Jewellers, Grain Merchants, Sweet Marts',
          citizenComplaints: '4 active drainage clearance complaints (Under SLA resolution)',
          developmentContext: 'Traditional Heritage Commercial Core',
          opportunities: [
            'Very high local pedestrian buying density',
            'Established commercial reputation for retail trade'
          ],
          risks: [
            'Limited vehicle parking space available'
          ],
          recommendedBusinessTypes: [
            'Gold Jewelry / Textile Retail Boutique',
            'Local Bank / NBFC Branch',
            'Traditional Sweets & Bakery Hub'
          ]
        });
      } else {
        setSiteReport({
          siteName: 'Station Road Commercial Plot #14 (CTS #142/A)',
          suitabilityScore: 94,
          suitabilityGrade: 'Highly Feasible — Grade A Commercial Node',
          photoObservations: [
            'Flat clear ground parcel with 24-meter frontage along main DP road',
            'Adjacent to commercial banking structures and retail shops',
            'Clear overhead line clearances, zero structural encroachments observed'
          ],
          gisLocation: 'Ward 3 — Station Area, Kopargaon (19.8916° N, 74.4789° E)',
          landUse: 'C-2 Heavy Commercial Zone (Kopargaon Development Plan 2030)',
          roadAccessibility: '24m Wide DP Arterial Road with direct access to State Highway 10',
          nearbyInfrastructure: [
            '33kV Electric Power Substation located 350 meters East',
            '500mm Municipal Water Trunk Main running parallel to site boundary',
            'Underground Stormwater Drainage Grid (90% coverage)'
          ],
          nearbyProjects: [
            'Station Road Asphalt Surfacing & Solar Lighting (₹4.8 Cr — 90% Completed)',
            'Godavari Riverfront Promenade & Green Belt (₹12.5 Cr — 82% Completed)'
          ],
          nearbyBusinesses: 'High Density Retail, SBI Bank Branch, HDFC Regional Office, Commercial Complex',
          citizenComplaints: '2 active road repair tickets logged within 500m (both within 24h SLA)',
          developmentContext: 'Identified as Primary Commercial Growth Axis under Kopargaon Smart City Master Plan',
          opportunities: [
            'High daily pedestrian footfall (14,200+ / day)',
            'Excellent vehicle accessibility with 24m DP road widening',
            'Zero flood risk zone score (above 100-yr flood buffer level)'
          ],
          risks: [
            'Peak-hour traffic congestion between 5:00 PM – 7:00 PM near railway station approach'
          ],
          recommendedBusinessTypes: [
            'Supermarket / Hypermarket Store',
            'Commercial Bank / Financial Services Branch',
            'EV Fast-Charging & Convenience Hub',
            'QSR / Family Dining Restaurant'
          ]
        });
      }
    }, 2400);
  };

  const handleAiSend = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userMsg = aiPrompt;
    setAiChat(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiPrompt('');

    setTimeout(() => {
      let reply = "Based on Kopargaon's 11-layer vector GIS data, commercial plots along Station Road and Bypass Road offer the highest ROI due to upcoming 24m DP road widenings and low flood risk scores.";
      
      const lower = userMsg.toLowerCase();

      // Check for Marathi Language / Script
      const isMarathi = /[\u0900-\u097F]/.test(userMsg) && (lower.includes('नमस्कार') || lower.includes('व्यवसाय') || lower.includes('जागा') || lower.includes('जमीन') || lower.includes('कोपरगाव') || lower.includes('दुकान'));
      // Check for Hindi Language / Script
      const isHindi = /[\u0900-\u097F]/.test(userMsg) || lower.includes('नमस्ते') || lower.includes('व्यापार') || lower.includes('जगह') || lower.includes('जमीन') || lower.includes('दुकान');

      if (isMarathi || lower.includes('marathi') || lower.includes('मराठी')) {
        if (lower.includes('जागा') || lower.includes('जमीन') || lower.includes('plot')) {
          reply = "कोपरगाव व्यापारी माहिती: स्टेशन रोड (वॉर्ड ३) आणि बायपास रस्ता (वॉर्ड ४) येथे २४ मीटर डीपी रस्ता रुंदीकरणामुळे व्यावसायिक गुंतवणुकीसाठी सर्वाधिक संधी उपलब्ध आहे.";
        } else if (lower.includes('दुकान') || lower.includes('व्यवसाय') || lower.includes('shop')) {
          reply = "किरकोळ विक्री आणि बँकिंगसाठी वॉर्ड ३ (स्टेशन भाग) मध्ये दररोज १४,००० हून अधिक पादचाऱ्यांची वर्दळ आहे. लॉजिस्टिक्ससाठी वॉर्ड ४ बायपास रस्ता उत्तम आहे.";
        } else {
          reply = "नमस्कार! मी आपला कोपरगाव व्यावसायिक AI सल्लागार आहे. मी आपणास जागा निवड, जीआयएस मॅपिंग आणि टेंडर माहिती पुरवू शकतो.";
        }
      } else if (isHindi || lower.includes('hindi') || lower.includes('हिंदी')) {
        if (lower.includes('जगह') || lower.includes('जमीन') || lower.includes('plot')) {
          reply = "कोपरगांव व्यावसायिक विश्लेषण: स्टेशन रोड (वार्ड 3) और बाईपास रोड (वार्ड 4) में 24 मीटर डीपी सड़क चौड़ीकरण के कारण व्यावसायिक निवेश के लिए सर्वोत्तम अवसर उपलब्ध हैं।";
        } else if (lower.includes('दुकान') || lower.includes('व्यापार') || lower.includes('shop')) {
          reply = "रिटेल और बैंकिंग व्यवसाय के लिए वार्ड 3 (स्टेशन क्षेत्र) में दैनिक 14,000+ लोगों का फुटफॉल है। लॉजिस्टिक्स के लिए वार्ड 4 बाईपास कॉरिडोर उपयुक्त है।";
        } else {
          reply = "नमस्ते! मैं आपका कोपरगांव व्यावसायिक AI सलाहकार हूँ। मैं स्थान विश्लेषण, जीआईएस मैपिंग और टेंडर जानकारी में आपकी मदद कर सकता हूँ।";
        }
      } else {
        if (lower.includes('good for my business') || lower.includes('location')) {
          reply = "To evaluate if a location is good for your business, run our 'AI Site Intelligence' analysis above! It combines footfall index, DP road width, power grid proximity, and municipal project activity.";
        } else if (lower.includes('where') || lower.includes('open')) {
          reply = "For retail and banking: Ward 3 Station Area offers peak footfall (14k+/day). For warehousing/logistics: Ward 4 Bypass Corridor has direct highway connectivity and commercial plot availability.";
        } else if (lower.includes('land') || lower.includes('commercial')) {
          reply = "Kopargaon Municipal Council currently has 3 commercial land lease plots open for bidding in Ward 3 and Ward 4 under the Business Opportunities section.";
        }
      }

      setAiChat(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* VIEW 1: DASHBOARD OVERVIEW */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Executive Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/20 p-6 rounded-2xl text-white shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t('businessPortal')}</span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t('growthWorkspace')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{t('growthWorkspaceDesc')}</p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setActiveView('site-intelligence')}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Site Intelligence</span>
                  </button>
                </div>
              </div>

              {/* Key Business Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Peak Footfall Zone</span>
                  <p className="text-2xl font-bold text-cyan-500">14.2k / day</p>
                  <span className="text-[10px] text-cyan-400 font-semibold">Ward 3 Station Corridor</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Available Land Leases</span>
                  <p className="text-2xl font-bold text-emerald-500">4 Plots</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">Clear Title Verified</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Active PPP Tenders</span>
                  <p className="text-2xl font-bold text-blue-500">3 Tenders</p>
                  <span className="text-[10px] text-blue-400 font-semibold">EMD Registered</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Avg Commercial Score</span>
                  <p className="text-2xl font-bold text-purple-500">92/100</p>
                  <span className="text-[10px] text-purple-400 font-semibold">Grade A Viability</span>
                </div>
              </div>

              {/* Quick Feature Shortcut Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setActiveView('site-intelligence')}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 cursor-pointer space-y-3 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">★ KILLER FEATURE</span>
                    <ArrowRight className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Site Intelligence Report</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload site photography + select location pin to generate a 12-metric suitability analysis report combining land use, infrastructure, and footfall.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ★ AI SITE INTELLIGENCE (KILLER FEATURE) */}
          {activeView === 'site-intelligence' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">★ Business Killer Feature</span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-cyan-500" />
                    <span>AI Site Intelligence Engine</span>
                  </h2>
                </div>
              </div>

              {/* Step 1: Input Control Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Upload Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">📸 1. Upload Site Photo / Imagery:</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-cyan-500 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-950 transition-colors cursor-pointer relative">
                      <Upload className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Click or Drag Ground Inspection Image</p>
                      <span className="text-[10px] text-slate-500 block mt-1">Computer vision extracts land frontage & road clearance</span>
                    </div>
                  </div>

                  {/* Location Selector */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">📍 2. Select GIS Location Parcel:</label>
                      <select
                        value={selectedSite}
                        onChange={e => setSelectedSite(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option>Station Road Commercial Plot #14 - Ward 3</option>
                        <option>Bypass Corridor Plot #42 (Highway Node) - Ward 4</option>
                        <option>Gaothan Market Parcel #8 (Heritage Core) - Ward 1</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRunAnalysis(selectedSite)}
                      disabled={isAnalyzing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAnalyzing ? 'Analyzing Spatial GIS Data...' : 'Run AI Site Intelligence Analysis'}</span>
                    </button>
                  </div>
                </div>

                {/* Analysis Processing State Bar */}
                {isAnalyzing && (
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2 animate-pulse">
                    <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>{analysisStep}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Comprehensive AI Site Intelligence Report */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
                {/* Report Header */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">Official Intelligence Assessment</span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{siteReport.siteName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{siteReport.gisLocation}</p>
                  </div>

                  <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-3xl font-black text-emerald-500 block leading-none">{siteReport.suitabilityScore}/100</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Suitability Score</span>
                    </div>
                  </div>
                </div>

                {/* Report Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  {/* Photo Observations */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-cyan-500" />
                      <span>📸 Photo Observations</span>
                    </h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      {siteReport.photoObservations.map((obs, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-cyan-500 font-bold">•</span>
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Land Use & Zoning */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>🗺️ Land Use & Zoning</span>
                    </h4>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{siteReport.landUse}</p>
                    <span className="text-[10px] text-slate-500 block">Kopargaon Master Plan Vector Layer Verified</span>
                  </div>

                  {/* Road Access & DP Width */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>🛣️ Road Access & DP Width</span>
                    </h4>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{siteReport.roadAccessibility}</p>
                  </div>

                  {/* Nearby Infrastructure */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span>⚡ Nearby Infrastructure (Power & Water)</span>
                    </h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      {siteReport.nearbyInfrastructure.map((inf, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          <span>{inf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footfall & Business Activity */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span>🏢 Footfall & Commercial Activity</span>
                    </h4>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{siteReport.nearbyBusinesses}</p>
                  </div>

                  {/* Nearby Municipal Projects */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span>🏗️ Nearby Municipal Projects (1km Buffer)</span>
                    </h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      {siteReport.nearbyProjects.map((proj, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span>{proj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Citizen Complaints SLA */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>⚠️ Citizen Complaints & SLA</span>
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300">{siteReport.citizenComplaints}</p>
                  </div>

                  {/* Opportunities & Risks */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">💡 Opportunities & ⚠️ Risks</h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Opportunities:</span>
                        {siteReport.opportunities.map((opp, i) => (
                          <p key={i} className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{opp}</span>
                          </p>
                        ))}
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-rose-500 uppercase">Risks:</span>
                        {siteReport.risks.map((r, i) => (
                          <p key={i} className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                            <span className="text-rose-500 font-bold">!</span>
                            <span>{r}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Business Types */}
                  <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/30 text-white space-y-3 lg:col-span-1">
                    <h4 className="font-bold flex items-center space-x-2 text-cyan-400">
                      <Briefcase className="w-4 h-4" />
                      <span>🏷️ Recommended Businesses</span>
                    </h4>
                    <div className="space-y-1.5">
                      {siteReport.recommendedBusinessTypes.map((b, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-950/80 border border-cyan-500/20 font-semibold text-slate-200 text-[11px]">
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: BUSINESS GIS */}
          {activeView === 'business-gis' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <span>Commercial Zoning & Vector GIS Map</span>
              </h3>
              <div className="h-[400px] bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-cyan-400">OpenStreetMap GeoJSON Commercial Layer</p>
                  <p className="text-xs text-slate-300">C-2 Commercial Zone • MIDC Industrial Estate • DP Arterial Roads</p>
                </div>
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-cyan-400 mx-auto animate-pulse mb-2" />
                  <p className="text-sm font-bold">Kopargaon Spatial Commercial Viewer</p>
                  <span className="text-xs text-slate-400">Density Score: 88/100</span>
                </div>
                <Link to="/business/gis" className="w-fit px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold mx-auto">
                  Launch Interactive Business GIS
                </Link>
              </div>
            </div>
          )}

          {/* VIEW 4: AREA INTELLIGENCE */}
          {activeView === 'area-intelligence' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                <span>Kopargaon Ward Purchasing Power & Demographics</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { ward: 'Ward 3 - Station Area', footfall: '14,200 / day', density: 'Very High', bestFor: 'Banking, Supermarket, Fast Food' },
                  { ward: 'Ward 4 - Bypass Corridor', footfall: '9,800 / day', density: 'High (Transit)', bestFor: 'Logistics, Automobile, EV Hub' },
                  { ward: 'Ward 1 - Market Yard', footfall: '12,500 / day', density: 'High (Retail)', bestFor: 'Wholesale, Agri-Business, Retail' }
                ].map((w, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{w.ward}</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Daily Footfall</span>
                        <span className="font-bold text-cyan-500">{w.footfall}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Density Rating</span>
                        <span className="font-bold text-emerald-500">{w.density}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2"><span className="font-bold text-slate-300">Best for:</span> {w.bestFor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 5: PROPERTIES & LAND */}
          {activeView === 'properties-land' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                <span>Commercial Property & Land Listings</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {[
                  { title: 'Station Road Plot #14', area: '12,500 sq.ft', zone: 'C-2 Commercial', price: '₹1.8 Cr' },
                  { title: 'Bypass Corridor Plot #42', area: '35,000 sq.ft', zone: 'I-1 Logistics', price: '₹4.2 Cr' }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                    <p className="text-slate-500">Area: {item.area} • Zone: {item.zone} • Price: <span className="font-bold text-cyan-500">{item.price}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: AI BUSINESS ASSISTANT */}
          {activeView === 'ai-assistant' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                <span>AI Business Investment Advisor</span>
              </h3>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-[350px] overflow-y-auto space-y-3 text-xs">
                {aiChat.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3.5 rounded-2xl ${
                      m.sender === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAiSend} className="flex gap-2 text-xs">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ask e.g. Is Ward 4 good for a solar logistics hub?"
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
                <button type="submit" className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl flex items-center space-x-1">
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
    </div>
  );
};

export default BusinessDashboardPage;
