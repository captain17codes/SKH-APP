import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import SearchBar from '../components/common/SearchBar';
import { KOPARGAON_CENTER } from '../data/mockData';
import { propertyService } from '../services/api';
import { MapPin, Layers, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CitizenPropertyMapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    propertyService.getAll().then(list => {
      setProperties(list);

      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      const propId = searchParams.get('id');

      if (lat && lng) {
        setMapCenter([parseFloat(lat), parseFloat(lng)]);
        setMapZoom(16);
      }

      if (propId) {
        const found = list.find(p => p.id.toLowerCase() === propId.toLowerCase());
        if (found) setSelectedProperty(found);
      }
    });
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase();
    const match = properties.find(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.locality && p.locality.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    );

    if (match && match.latitude && match.longitude) {
      setMapCenter([match.latitude, match.longitude]);
      setMapZoom(16);
      setSelectedProperty(match);
      toast.success(`Located ${match.name || match.title}`);
    } else {
      toast.error('No matching property found on GIS map');
    }
  };

  const formatPrice = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span>Kopargaon Interactive Property GIS Map</span>
          </h3>
          <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span>Commercial</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Residential</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Industrial</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span>Plot / Farm</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Locate property title or ID..."
            />
          </form>

          <Link to="/citizen/properties" className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>List View</span>
          </Link>
        </div>
      </div>

      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-230px)] min-h-[600px]">
        <div className="flex-1 relative h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            onSelectFeature={(feat) => setSelectedProperty(feat)}
            showAllControls={true}
            height="h-full"
          />
        </div>

        {selectedProperty && (
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 lg:rounded-xl shadow-xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 text-xs">
            <div className="h-44 w-full relative bg-slate-950">
              <img
                src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'}
                alt={selectedProperty.name || selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md">
                {formatPrice(selectedProperty.price || selectedProperty.expectedPrice)}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">#{selectedProperty.id}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedProperty.name || selectedProperty.title}</h3>
                  <p className="text-slate-500">{selectedProperty.locality} • {selectedProperty.ward}</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-700 dark:text-slate-300">
                  <p><span className="text-slate-400">Type:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedProperty.type || selectedProperty.propertyType}</strong></p>
                  <p><span className="text-slate-400">Area:</span> <strong>{selectedProperty.area?.toLocaleString()} {selectedProperty.areaUnit || 'sq.ft'}</strong></p>
                  <p><span className="text-slate-400">Land Use:</span> <strong className="text-emerald-500">{selectedProperty.landUse}</strong></p>
                  <p><span className="text-slate-400">Road Access:</span> <strong>{selectedProperty.roadAccess}</strong></p>
                  <p><span className="text-slate-400">Status:</span> <strong>{selectedProperty.status}</strong></p>
                </div>
              </div>

              <Link
                to={`/citizen/properties/${selectedProperty.id}`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold rounded-xl shadow-lg block"
              >
                View Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenPropertyMapPage;
