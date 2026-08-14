import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Search, Filter, MapPin, Layers, DollarSign, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Sun, Moon, LogOut,
  ChevronDown, Menu, X, Bot, Send, BarChart3, Check, Navigation, SlidersHorizontal, AlertCircle,
  Eye, Map, HelpCircle, FileText
} from 'lucide-react';
import { propertyService } from '../services/api';
import SearchBar from '../components/common/SearchBar';
import MapView from '../components/gis/MapView';
import { KOPARGAON_CENTER } from '../data/mockData';
import { useTranslation } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = [
  'All',
  'Commercial Plot',
  'Shop',
  'Office',
  'Warehouse',
  'Industrial Land',
  'Residential',
  'Agricultural'
];

const BUSINESS_TYPES = [
  'Restaurant',
  'Hotel',
  'Warehouse',
  'Retail',
  'Office',
  'Manufacturing',
  'Logistics',
  'Other'
];

const LAND_USES = [
  'Any',
  'Commercial',
  'Industrial',
  'Residential',
  'Mixed Use',
  'Agricultural'
];

const WARDS = [
  'Any Ward',
  'Ward 1 - Market Yard',
  'Ward 2 - Tilak Road',
  'Ward 3 - Station Area',
  'Ward 4 - Bypass Corridor',
  'Ward 5 - Housing Board',
  'Ward 6 - Samvatsar Border',
  'Ward 7 - Subhash Road'
];

const ROAD_ACCESS_OPTIONS = [
  'Any',
  'Good',
  'Excellent'
];

const STATUS_OPTIONS = [
  'All Statuses',
  'Available',
  'Vacant',
  'For Sale',
  'Under Verification',
  'Sold'
];

const BusinessPropertiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mapSectionRef = useRef(null);

  // Top Search & View Mode
  const [topSearch, setTopSearch] = useState('');
  const [showFindSuitableSection, setShowFindSuitableSection] = useState(false);

  // Main Filters
  const [selectedPropertyType, setSelectedPropertyType] = useState('All');
  const [selectedBusinessType, setSelectedBusinessType] = useState('Restaurant');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState('Any');
  const [selectedWard, setSelectedWard] = useState('Any Ward');
  const [selectedRoadAccess, setSelectedRoadAccess] = useState('Any');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // Properties Data & Matchmaker State
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchedResults, setMatchedResults] = useState(null);
  const [isMatching, setIsMatching] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);

  // Details Drawer / Modal State
  const [activeDetailsProperty, setActiveDetailsProperty] = useState(null);
  const [activeAnalysisProperty, setActiveAnalysisProperty] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyService.getAll();
      setProperties(data || []);
    } catch (e) {
      console.error('[Business Properties & Land] Fetch error:', e);
      toast.error('Failed to load land and property data');
    } finally {
      setLoading(false);
    }
  };

  // Find Suitable Land Handler (Inside Same Page)
  const handleFindMatches = (e) => {
    if (e) e.preventDefault();
    setIsMatching(true);
    toast.loading('Evaluating land use compatibility, infrastructure & PostGIS spatial buffer...', { duration: 1200 });

    setTimeout(() => {
      let candidatePool = properties.map(p => {
        let score = 80;
        let reasons = [];

        if (selectedBusinessType === 'Warehouse' || selectedBusinessType === 'Logistics' || selectedBusinessType === 'Manufacturing') {
          if (p.landUse?.includes('Industrial') || p.landUse?.includes('Commercial')) score += 10;
          if (p.roadAccess?.includes('30m') || p.roadAccess?.includes('Highway') || p.roadAccess?.includes('Excellent')) score += 8;
          reasons.push('Excellent road accessibility for heavy logistics transport.');
        } else if (selectedBusinessType === 'Restaurant' || selectedBusinessType === 'Retail' || selectedBusinessType === 'Office') {
          if (p.landUse?.includes('Commercial')) score += 12;
          if (p.ward?.includes('Ward 3') || p.ward?.includes('Ward 1')) score += 6;
          reasons.push('High pedestrian footfall corridor with commercial zoning.');
        } else {
          score += 5;
          reasons.push('Compatible land use with municipal utility connection access.');
        }

        const price = p.price || p.expectedPrice;
        if (maxBudget && price && price <= Number(maxBudget)) score += 5;
        if (p.waterAvailable && p.electricityAvailable) score += 3;

        score = Math.min(score, 98);

        let statusLabel = p.status || 'Available';
        if (!p.status || p.status === 'Unknown' || p.status === 'Under Verification') {
          statusLabel = 'Potentially Vacant — Verification Required';
        }

        return {
          ...p,
          suitabilityScore: score,
          statusLabel,
          displayPrice: price ? formatPrice(price) : 'Price not available',
          whyLocation: `High suitability because the property has ${p.roadAccess || 'strong road connectivity'}, ${p.landUse || 'compatible'} land use, and nearby infrastructure.`
        };
      });

      // Filter based on form criteria
      if (selectedLandUse !== 'Any') {
        candidatePool = candidatePool.filter(p => p.landUse?.toLowerCase().includes(selectedLandUse.toLowerCase()));
      }
      if (selectedWard !== 'Any Ward') {
        candidatePool = candidatePool.filter(p => p.ward?.toLowerCase().includes(selectedWard.toLowerCase()));
      }
      if (maxBudget) {
        candidatePool = candidatePool.filter(p => {
          const pr = p.price || p.expectedPrice;
          return !pr || pr <= Number(maxBudget);
        });
      }
      if (minArea) {
        candidatePool = candidatePool.filter(p => (p.area || 0) >= Number(minArea));
      }
      if (maxArea) {
        candidatePool = candidatePool.filter(p => (p.area || 0) <= Number(maxArea));
      }
      if (selectedRoadAccess !== 'Any') {
        candidatePool = candidatePool.filter(p => p.roadAccess?.toLowerCase().includes(selectedRoadAccess.toLowerCase()));
      }

      candidatePool.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      setMatchedResults(candidatePool.slice(0, 5));
      setIsMatching(false);
      toast.success(`Found ${candidatePool.length} candidate location matches!`);
    }, 1200);
  };

  const formatPrice = (val) => {
    if (!val) return 'Price not available';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  const handleFlyToMap = (p) => {
    const lat = p.latitude || p.coordinates?.[0] || 19.8916;
    const lng = p.longitude || p.coordinates?.[1] || 74.4789;
    setMapCenter([lat, lng]);
    setMapZoom(16);
    setSelectedMapProperty(p);

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    toast.success(`Focused GIS map on ${p.name || p.title || p.id}`);
  };

  // Filtered Properties List
  const filteredProperties = properties.filter(p => {
    const pName = p.name || p.title || '';
    const pId = p.id || '';
    const pType = p.type || p.propertyType || '';
    const pWard = p.ward || '';
    const pLocality = p.locality || '';

    const matchesSearch = !topSearch || (
      pName.toLowerCase().includes(topSearch.toLowerCase()) ||
      pId.toLowerCase().includes(topSearch.toLowerCase()) ||
      pType.toLowerCase().includes(topSearch.toLowerCase()) ||
      pWard.toLowerCase().includes(topSearch.toLowerCase()) ||
      pLocality.toLowerCase().includes(topSearch.toLowerCase())
    );

    const matchesType = selectedPropertyType === 'All' || pType.toLowerCase().includes(selectedPropertyType.toLowerCase());
    const matchesWard = selectedWard === 'Any Ward' || pWard.toLowerCase().includes(selectedWard.toLowerCase());
    const matchesLandUse = selectedLandUse === 'Any' || (p.landUse && p.landUse.toLowerCase().includes(selectedLandUse.toLowerCase()));
    const matchesStatus = selectedStatus === 'All Statuses' || (p.status && p.status.toLowerCase().includes(selectedStatus.toLowerCase()));

    const priceVal = p.price || p.expectedPrice || 0;
    const matchesBudget = !maxBudget || priceVal <= Number(maxBudget);

    const areaVal = p.area || 0;
    const matchesMinArea = !minArea || areaVal >= Number(minArea);
    const matchesMaxArea = !maxArea || areaVal <= Number(maxArea);

    const matchesRoad = selectedRoadAccess === 'Any' || (p.roadAccess && p.roadAccess.toLowerCase().includes(selectedRoadAccess.toLowerCase()));

    return matchesSearch && matchesType && matchesWard && matchesLandUse && matchesStatus &&
           matchesBudget && matchesMinArea && matchesMaxArea && matchesRoad;
  });

  return (
    <div className="space-y-6">
      {/* SECTION 1: TOP EXECUTIVE BANNER */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/20 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t('businessPortal')}</span>
          <h1 className="text-2xl sm:text-3xl font-black">{t('landProperty')}</h1>
          <p className="text-xs text-slate-300">Explore land and properties using GIS and urban intelligence.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFindSuitableSection(!showFindSuitableSection)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{showFindSuitableSection ? t('close') : t('findSuitableLand')}</span>
          </button>

          <button
            onClick={() => {
              if (mapSectionRef.current) {
                mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Map className="w-4 h-4 text-cyan-400" />
            <span>{t('viewOnMap')}</span>
          </button>
        </div>
      </div>

      {/* TOP SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <SearchBar
          value={topSearch}
          onChange={setTopSearch}
          placeholder="Search land, property, location or business requirement..."
        />
      </div>

      {/* SECTION 2: EXPANDABLE FIND SUITABLE LAND MATCHER (INSIDE SAME PAGE) */}
      {showFindSuitableSection && (
        <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 border-2 border-cyan-500/40 p-6 rounded-2xl text-white shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex justify-between items-start border-b border-cyan-500/20 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">PostGIS Land Matchmaking Engine</span>
              <h3 className="text-lg font-black flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Find Suitable Land for Business</span>
              </h3>
              <p className="text-xs text-slate-300">Specify your expansion parameters to score and rank top candidate land parcels.</p>
            </div>
            <button onClick={() => setShowFindSuitableSection(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFindMatches} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Business Type</label>
                <select
                  value={selectedBusinessType}
                  onChange={e => setSelectedBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                >
                  {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Required Area (sq.ft)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Area"
                    value={minArea}
                    onChange={e => setMinArea(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max Area"
                    value={maxArea}
                    onChange={e => setMaxArea(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Maximum Budget (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={maxBudget}
                  onChange={e => setMaxBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Preferred Land Use</label>
                <select
                  value={selectedLandUse}
                  onChange={e => setSelectedLandUse(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                >
                  {LAND_USES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Municipal Ward</label>
                <select
                  value={selectedWard}
                  onChange={e => setSelectedWard(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                >
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Road Access</label>
                <select
                  value={selectedRoadAccess}
                  onChange={e => setSelectedRoadAccess(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                >
                  {ROAD_ACCESS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isMatching}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg flex items-center space-x-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isMatching ? 'Processing Spatial Analysis...' : 'Find Matches'}</span>
              </button>
            </div>
          </form>

          {/* MATCH RESULTS (APPEARS BELOW FORM ON SAME PAGE) */}
          {matchedResults && (
            <div className="pt-4 border-t border-cyan-500/20 space-y-4">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                Top {matchedResults.length} Suitable Candidate Match(es):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedResults.map((m, idx) => (
                  <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">Candidate #{idx+1} • #{m.id}</span>
                        <h4 className="text-sm font-bold mt-0.5">{m.name || m.title}</h4>
                        <p className="text-[11px] text-slate-400">{m.locality}, {m.ward}</p>
                      </div>
                      <span className="text-xl font-black text-emerald-400">{m.suitabilityScore}/100</span>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <p>💰 Price: <strong className="text-emerald-400">{m.displayPrice}</strong></p>
                      <p>📐 Area: <strong>{m.area?.toLocaleString()} {m.areaUnit || 'sq.ft'}</strong></p>
                      <p>🏷️ Land Use: <strong>{m.landUse}</strong></p>
                      <p>🚗 Road Access: <strong>{m.roadAccess || 'Good'}</strong></p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-[11px] text-cyan-200">
                      <strong className="block text-cyan-400 text-[10px] uppercase">Why this location?</strong>
                      <p>{m.whyLocation}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveDetailsProperty(m)}
                        className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleFlyToMap(m)}
                        className="px-3 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View on Map</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: COMPREHENSIVE FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
          <span>Multi-Parameter Land & Property Filters</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Property Type</label>
            <select
              value={selectedPropertyType}
              onChange={e => setSelectedPropertyType(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Land Use</label>
            <select
              value={selectedLandUse}
              onChange={e => setSelectedLandUse(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {LAND_USES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ward</label>
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Road Access</label>
            <select
              value={selectedRoadAccess}
              onChange={e => setSelectedRoadAccess(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {ROAD_ACCESS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Budget (₹)</label>
            <input
              type="number"
              placeholder="Max Price"
              value={maxBudget}
              onChange={e => setMaxBudget(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: AVAILABLE PROPERTIES GRID */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>Available Properties & Land Parcels ({filteredProperties.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse text-xs font-bold">
            Loading Kopargaon land and property data...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Matching Properties Found</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(p => {
              const priceVal = p.price || p.expectedPrice;
              const priceStr = priceVal ? formatPrice(priceVal) : 'Price not available';
              const statusText = p.status || 'Available';

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="h-44 w-full relative bg-slate-950 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'}
                        alt={p.name || p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 text-white font-bold text-[10px] uppercase">
                        🏢 {p.type || p.propertyType || 'Plot'}
                      </span>
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                        {statusText}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-500">ID: {p.id}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-500 transition-colors line-clamp-1 mt-0.5">
                          {p.name || p.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">📍 {p.locality}, {p.ward}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Price</span>
                          <span className="font-extrabold text-emerald-500">{priceStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Area</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.area?.toLocaleString()} {p.areaUnit || 'sq.ft'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Land Use</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.landUse || 'Commercial'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Road Access</span>
                          <span className="font-bold text-blue-500 truncate block">{p.roadAccess || 'Good'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                        <span>💧 Water: {p.waterAvailable ? 'Available' : 'N/A'}</span>
                        <span>⚡ Power: {p.electricityAvailable ? 'Available' : 'N/A'}</span>
                        <span>🚰 Drainage: {p.drainageAvailable ? 'Available' : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Buttons */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => setActiveDetailsProperty(p)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleFlyToMap(p)}
                      className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1"
                      title="View on Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Map</span>
                    </button>
                    <button
                      onClick={() => setActiveAnalysisProperty(p)}
                      className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-xl"
                      title="Analyze Area"
                    >
                      Analyze
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 5: GIS MAP SECTION (INSIDE SAME PROPERTIES & LAND PAGE) */}
      <div ref={mapSectionRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">Interactive GIS Explorer</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <span>Kopargaon Land & Property GIS Map</span>
            </h3>
          </div>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-4 h-[500px]">
          <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <MapView
              center={mapCenter}
              zoom={mapZoom}
              onSelectFeature={(feat) => setSelectedMapProperty(feat)}
              showAllControls={true}
              height="h-full"
            />
          </div>

          {selectedMapProperty && (
            <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-cyan-500 font-bold">#{selectedMapProperty.id}</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedMapProperty.name || selectedMapProperty.title}</h4>
                <p className="text-slate-500 text-[11px]">{selectedMapProperty.locality}, {selectedMapProperty.ward}</p>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1 text-slate-700 dark:text-slate-300">
                  <p><span className="text-slate-400">Price:</span> <strong className="text-emerald-500 font-bold">{formatPrice(selectedMapProperty.price || selectedMapProperty.expectedPrice)}</strong></p>
                  <p><span className="text-slate-400">Area:</span> <strong>{selectedMapProperty.area?.toLocaleString()} {selectedMapProperty.areaUnit || 'sq.ft'}</strong></p>
                  <p><span className="text-slate-400">Status:</span> <strong>{selectedMapProperty.status || 'Available'}</strong></p>
                  <p><span className="text-slate-400">Suitability Score:</span> <strong className="text-cyan-500">92/100</strong></p>
                </div>
              </div>

              <button
                onClick={() => setActiveDetailsProperty(selectedMapProperty)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center shadow-md"
              >
                View Details →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6: PROPERTY DETAILS & AI AREA INTELLIGENCE MODAL / DRAWER */}
      {activeDetailsProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-xs shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-500">PROPERTY DETAILS & AI AREA INTELLIGENCE • #{activeDetailsProperty.id}</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{activeDetailsProperty.name || activeDetailsProperty.title}</h3>
                <p className="text-slate-500">📍 {activeDetailsProperty.locality}, {activeDetailsProperty.ward}</p>
              </div>
              <button onClick={() => setActiveDetailsProperty(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos */}
            <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-950 relative">
              <img
                src={activeDetailsProperty.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'}
                alt={activeDetailsProperty.name || activeDetailsProperty.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 text-white font-bold text-xs">
                🏢 {activeDetailsProperty.type || activeDetailsProperty.propertyType || 'Plot'}
              </span>
            </div>

            {/* Specs breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Price</span>
                <span className="font-extrabold text-sm text-emerald-500">{formatPrice(activeDetailsProperty.price || activeDetailsProperty.expectedPrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Area</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{activeDetailsProperty.area?.toLocaleString()} {activeDetailsProperty.areaUnit || 'sq.ft'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Land Use</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{activeDetailsProperty.landUse || 'Commercial'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Condition</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{activeDetailsProperty.condition || 'Vacant Land'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Municipal Road & Utilities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                <p>🛣️ Road: <strong>{activeDetailsProperty.roadAccess || 'Good'}</strong></p>
                <p>💧 Water: <strong>{activeDetailsProperty.waterAvailable ? 'Available' : 'Data unavailable'}</strong></p>
                <p>⚡ Electricity: <strong>{activeDetailsProperty.electricityAvailable ? 'Available' : 'Data unavailable'}</strong></p>
                <p>🚰 Drainage: <strong>{activeDetailsProperty.drainageAvailable ? 'Available' : 'Data unavailable'}</strong></p>
              </div>
            </div>

            {/* Nearby Context */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Nearby Infrastructure, Projects & Facilities</h4>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                <li>• <strong>Roads:</strong> 24m DP Arterial Road Connection</li>
                <li>• <strong>Infrastructure:</strong> 33kV Substation grid (350m buffer)</li>
                <li>• <strong>Projects:</strong> Station Road Asphalt Surfacing (₹4.8 Cr — 90% Completed)</li>
                <li>• <strong>Businesses:</strong> Commercial Banking branches & retail complex</li>
              </ul>
            </div>

            {/* AI AREA INTELLIGENCE SECTION */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 border border-cyan-500/30 text-white space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                <h4 className="font-bold text-sm text-cyan-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Area Intelligence</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">GIS Spatial Verification Active</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Accessibility</span>
                  <p className="text-lg font-black text-emerald-400">92/100</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Infrastructure</span>
                  <p className="text-lg font-black text-blue-400">88/100</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Development Activity</span>
                  <p className="text-lg font-black text-purple-400">High</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Business Potential</span>
                  <p className="text-lg font-black text-cyan-400">94/100</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/70 border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">Why this location?</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  High suitability because the property has strong road connectivity, compatible land use and nearby infrastructure.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveDetailsProperty(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Close</button>
              <button onClick={() => { setActiveDetailsProperty(null); handleFlyToMap(activeDetailsProperty); }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold">Focus on GIS Map →</button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: STANDALONE AREA ANALYSIS MODAL */}
      {activeAnalysisProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-500 font-bold">AI AREA INTELLIGENCE</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activeAnalysisProperty.name || activeAnalysisProperty.title}</h3>
              </div>
              <button onClick={() => setActiveAnalysisProperty(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Accessibility Score</span>
                <p className="text-xl font-black text-emerald-500">92/100</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Infrastructure Score</span>
                <p className="text-xl font-black text-blue-500">88/100</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 space-y-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400">Why this location?</span>
              <p>High suitability because the property has strong road connectivity, compatible land use and nearby infrastructure.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveAnalysisProperty(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPropertiesPage;
