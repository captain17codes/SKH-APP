import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Search, Filter, MapPin, Layers, DollarSign, ArrowRight,
  ShieldCheck, Clock, CheckCircle2, AlertCircle, Plus, Eye, Home, Sparkles,
  Menu, Sun, Moon, LogOut, ChevronDown, Check, X, ShieldAlert, Map, List,
  Droplets, Zap, Compass, CheckSquare, HelpCircle
} from 'lucide-react';
import { propertyService } from '../services/api';
import SearchBar from '../components/common/SearchBar';
import MapView from '../components/gis/MapView';
import { KOPARGAON_CENTER } from '../data/mockData';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All Categories',
  'Commercial Plots',
  'Shops',
  'Offices',
  'Warehouses',
  'Industrial Land',
  'Residential Property',
  'Agricultural Land'
];

const WARDS = [
  'All Wards',
  'Ward 1 - Market Yard',
  'Ward 2 - Tilak Road',
  'Ward 3 - Station Area',
  'Ward 4 - Bypass Corridor',
  'Ward 5 - Housing Board',
  'Ward 6 - Samvatsar Border',
  'Ward 7 - Subhash Road'
];

const LAND_USES = [
  'All Land Uses',
  'Commercial',
  'Residential',
  'Industrial',
  'Agricultural',
  'Mixed Use'
];

const STATUS_OPTIONS = [
  'All Statuses',
  'Available',
  'Under Verification',
  'Sold'
];

const CitizenPropertyMarketplacePage = () => {
  const navigate = useNavigate();

  // View Mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [selectedLandUse, setSelectedLandUse] = useState('All Land Uses');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [filterWaterOnly, setFilterWaterOnly] = useState(false);
  const [filterPowerOnly, setFilterPowerOnly] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyService.getAll();
      setProperties(data);
    } catch (e) {
      console.error('Failed to fetch property listings:', e);
      toast.error('Could not load property listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(p => {
    const pName = p.name || p.title || '';
    const pId = p.id || '';
    const pType = p.type || p.propertyType || '';
    const pWard = p.ward || '';
    const pLocality = p.locality || '';

    const matchesSearch = !searchQuery || (
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pWard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pLocality.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesCategory = selectedCategory === 'All Categories' || (
      pType.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory.includes('Commercial') && pType.toLowerCase().includes('commercial')) ||
      (selectedCategory.includes('Shop') && pType.toLowerCase().includes('shop')) ||
      (selectedCategory.includes('Office') && pType.toLowerCase().includes('office')) ||
      (selectedCategory.includes('Warehouse') && pType.toLowerCase().includes('warehouse')) ||
      (selectedCategory.includes('Industrial') && pType.toLowerCase().includes('industrial')) ||
      (selectedCategory.includes('Residential') && pType.toLowerCase().includes('residential')) ||
      (selectedCategory.includes('Agricultural') && pType.toLowerCase().includes('agricultural'))
    );

    const matchesWard = selectedWard === 'All Wards' || pWard.toLowerCase().includes(selectedWard.toLowerCase());
    const matchesLandUse = selectedLandUse === 'All Land Uses' || (p.landUse && p.landUse.toLowerCase().includes(selectedLandUse.toLowerCase()));
    const matchesStatus = selectedStatus === 'All Statuses' || p.status.toLowerCase() === selectedStatus.toLowerCase();

    const priceVal = p.price || p.expectedPrice || 0;
    const matchesMinPrice = !minPrice || priceVal >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || priceVal <= Number(maxPrice);

    const areaVal = p.area || 0;
    const matchesMinArea = !minArea || areaVal >= Number(minArea);
    const matchesMaxArea = !maxArea || areaVal <= Number(maxArea);

    const matchesWater = !filterWaterOnly || Boolean(p.waterAvailable);
    const matchesPower = !filterPowerOnly || Boolean(p.electricityAvailable);

    return matchesSearch && matchesCategory && matchesWard && matchesLandUse && matchesStatus &&
           matchesMinPrice && matchesMaxPrice && matchesMinArea && matchesMaxArea &&
           matchesWater && matchesPower;
  });

  const formatPrice = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    if (status === 'Available') {
      return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px]">🟢 Available</span>;
    } else if (status === 'Under Verification') {
      return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px]">🟡 Under Verification</span>;
    } else {
      return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-[10px]">🔴 Sold</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Top Banner with Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/20 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Municipal Land Intelligence</span>
          <h2 className="text-xl sm:text-2xl font-black">🏢 Land & Property</h2>
          <p className="text-xs text-slate-300">Explore available land and properties in Kopargaon using List View and GIS Map View.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* List vs Map View Toggle */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'map' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-cyan-400" />
              <span>Map View</span>
            </button>
          </div>

          <Link
            to="/citizen/properties/sell"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Sell My Property</span>
          </Link>
        </div>
      </div>

      {/* Quick Property Categories Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {CATEGORIES.map(cat => {
          const isSel = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 ${
                isSel
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Comprehensive Search & Filter Controls Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Search Property / Location</label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by property name, ID, ward, locality, type..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Municipal Ward</label>
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              {WARDS.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Property Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Land Use:</span>
            <select
              value={selectedLandUse}
              onChange={e => setSelectedLandUse(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              {LAND_USES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Price (₹):</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg w-24"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg w-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Area (sq.ft):</span>
            <input
              type="number"
              placeholder="Min"
              value={minArea}
              onChange={e => setMinArea(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg w-24"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxArea}
              onChange={e => setMaxArea(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg w-24"
            />
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterWaterOnly}
              onChange={e => setFilterWaterOnly(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Water Supply</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterPowerOnly}
              onChange={e => setFilterPowerOnly(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Electricity</span>
          </label>

          {(searchQuery || selectedCategory !== 'All Categories' || selectedWard !== 'All Wards' || selectedLandUse !== 'All Land Uses' || selectedStatus !== 'All Statuses' || minPrice || maxPrice || minArea || maxArea || filterWaterOnly || filterPowerOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedWard('All Wards');
                setSelectedLandUse('All Land Uses');
                setSelectedStatus('All Statuses');
                setMinPrice('');
                setMaxPrice('');
                setMinArea('');
                setMaxArea('');
                setFilterWaterOnly(false);
                setFilterPowerOnly(false);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Informational Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start space-x-2.5 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Important Citizen Disclaimer:</span>
          <p className="text-[11px] mt-0.5 leading-relaxed">
            Property information is provided for informational purposes. Ownership, title, permissions and legal documents should be independently verified before any transaction.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT AREA SWITCH (LIST VIEW VS MAP VIEW) */}
      {viewMode === 'map' ? (
        <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-250px)] min-h-[600px] bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <MapView
              center={mapCenter}
              zoom={14}
              onSelectFeature={(feat) => setSelectedMapProperty(feat)}
              showAllControls={true}
              height="h-full"
            />
          </div>

          {selectedMapProperty && (
            <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-500">#{selectedMapProperty.id}</span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedMapProperty.name || selectedMapProperty.title}</h4>
                  </div>
                  {getStatusBadge(selectedMapProperty.status)}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1 text-slate-700 dark:text-slate-300">
                  <p><span className="text-slate-400">Price:</span> <strong className="text-emerald-500 font-bold">{formatPrice(selectedMapProperty.price || selectedMapProperty.expectedPrice)}</strong></p>
                  <p><span className="text-slate-400">Area:</span> <strong>{selectedMapProperty.area} {selectedMapProperty.areaUnit || 'sq.ft'}</strong></p>
                  <p><span className="text-slate-400">Location:</span> <strong>{selectedMapProperty.locality}, {selectedMapProperty.ward}</strong></p>
                </div>
              </div>

              <Link
                to={`/citizen/properties/${selectedMapProperty.id}`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center shadow-lg"
              >
                View Details →
              </Link>
            </div>
          )}
        </div>
      ) : (
        loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse text-xs font-bold">
            Loading Kopargaon Available Properties...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <Layers className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Matching Properties Found</p>
            <p className="text-xs text-slate-500">Try adjusting your filters, category tab, or price range.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(p => {
              const pName = p.name || p.title || 'Land Property';
              const pId = p.id || 'KOP-LAND-001';
              const pType = p.type || p.propertyType || 'Commercial Plot';
              const pPrice = p.price || p.expectedPrice || 0;
              const pLocality = p.locality || 'Yesgaon Bypass';
              const pWard = p.ward || 'Ward 4';

              return (
                <div
                  key={pId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Image & Badges */}
                    <div className="h-48 w-full relative bg-slate-950 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'}
                        alt={pName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Property Type Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-md">
                        🏢 {pType}
                      </span>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(p.status)}
                      </div>

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-3 left-3">
                        <span className="text-xl font-black text-white block drop-shadow-md">{formatPrice(pPrice)}</span>
                        <span className="text-[10px] text-slate-300 font-mono">₹{p.pricePerUnit?.toLocaleString()} / {p.areaUnit || 'sq.ft'}</span>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-5 space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Property ID: {pId}</span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors line-clamp-1 mt-0.5">
                          {pName}
                        </h3>
                      </div>

                      <div className="flex items-center text-slate-500 dark:text-slate-400 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">📍 {pLocality}, {pWard}</span>
                      </div>

                      {/* Explicit Property Specs Table Box */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">💰 Price</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(pPrice)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">📐 Area</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.area?.toLocaleString()} {p.areaUnit || 'sq.ft'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">🏷️ Land Use</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.landUse || 'Commercial'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">🚗 Road Access</span>
                          <span className="font-bold text-blue-500 truncate block">{p.roadAccess || 'Excellent'}</span>
                        </div>
                      </div>

                      {/* Utilities Availability Icons */}
                      <div className="flex items-center space-x-3 text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                        <span className={`flex items-center space-x-1 ${p.waterAvailable ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                          <span>💧 Water: {p.waterAvailable ? 'Available' : 'N/A'}</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${p.electricityAvailable ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                          <span>⚡ Electricity: {p.electricityAvailable ? 'Available' : 'N/A'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-5 pt-0 flex items-center space-x-2">
                    <Link
                      to={`/citizen/properties/${pId}`}
                      className="flex-1 text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                    >
                      View Details
                    </Link>

                    <Link
                      to={`/citizen/properties/map?lat=${p.latitude}&lng=${p.longitude}&id=${pId}`}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center space-x-1"
                      title="View on Property GIS Map"
                    >
                      <MapPin className="w-4 h-4 text-cyan-500" />
                      <span>View on Map</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default CitizenPropertyMarketplacePage;
