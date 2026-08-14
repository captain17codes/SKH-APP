import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import SearchBar from '../components/common/SearchBar';
import { KOPARGAON_CENTER } from '../data/mockData';
import { KOPARGAON_WARDS_GEOJSON } from '../data/gis/wardBoundaries';
import { gisService } from '../services/gisService';
import { complaintService } from '../services/api';
import {
  MapPin, MessageSquareWarning, Clock, FolderKanban, Layers, AlertTriangle,
  Bot, Building2, Search, X, Plus, CheckCircle2, RefreshCw, Send, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const CitizenGisPage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [isNearMeOpen, setIsNearMeOpen] = useState(false);
  const [loadingNearMe, setLoadingNearMe] = useState(false);

  // Citizen-focused Map Layer Toggles
  const [citizenLayers, setCitizenLayers] = useState({
    complaints: true,
    projects: true,
    roads: true,
    water: true,
    drainage: true,
    hospitals: true,
    schools: true,
    facilities: true
  });

  const handleWhatsHappeningNearMe = () => {
    setLoadingNearMe(true);
    toast.loading('Scanning nearby ward complaints, projects & public facilities...', { duration: 1200 });
    setTimeout(() => {
      setLoadingNearMe(false);
      setIsNearMeOpen(true);
      toast.success('Nearby Area Summary Loaded!');
    }, 1200);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
      f.properties.name.toLowerCase().includes(query) || f.properties.id.toLowerCase().includes(query)
    );
    if (wardMatch) {
      setSelectedWardId(wardMatch.properties.id);
      setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
      setMapZoom(15);
      setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
      return;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span>Kopargaon Dedicated Citizen GIS Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Public Complaints, PWD Infrastructure & Civic Amenities Overlay</p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search ward or location..."
            />
          </form>

          <button
            onClick={handleWhatsHappeningNearMe}
            disabled={loadingNearMe}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm shrink-0 cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            <span>What's Happening Near Me</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Box */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            onSelectFeature={(feat) => setSelectedFeature({ feat, type: 'general' })}
            showAllControls={true}
            height="h-full"
          />
        </div>

        {selectedFeature && (
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-xs animate-in slide-in-from-right duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">CITIZEN GIS PARCEL</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedFeature.feat.name || selectedFeature.feat.title || 'Civic Amenity'}
                  </h3>
                </div>
                <button onClick={() => setSelectedFeature(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                <p><span className="text-slate-400">Ward:</span> <strong>{selectedFeature.feat.ward || 'Ward 3 - Station Area'}</strong></p>
                <p><span className="text-slate-400">Status:</span> <strong className="text-emerald-500">Active Public Amenity</strong></p>
                <p><span className="text-slate-400">Road Quality:</span> <strong>Good (Asphalt Surfaced)</strong></p>
              </div>
            </div>

            <button
              onClick={handleWhatsHappeningNearMe}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center shadow-lg cursor-pointer"
            >
              Scan Neighborhood Amenities →
            </button>
          </div>
        )}
      </div>

      {/* WHAT'S HAPPENING NEAR ME MODAL */}
      {isNearMeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">NEIGHBORHOOD CIVIC SUMMARY</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">What's Happening Near Me</h3>
              </div>
              <button onClick={() => setIsNearMeOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">🏗️ Nearby Smart City Projects (1km Buffer)</span>
                <p>• Station Road Surfacing & Lighting (₹4.8 Cr — 90% Done)</p>
                <p>• Godavari Riverfront Green Promenade (₹12.5 Cr — 82% Done)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">⚠️ Active Grievances in Ward</span>
                <p>• 2 streetlight maintenance tickets logged (under 24h SLA resolution)</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsNearMeOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Close Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenGisPage;
