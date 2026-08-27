import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/api';
import MapView from '../components/gis/MapView';
import { KOPARGAON_CENTER } from '../data/mockData';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Agricultural',
  'Commercial',
  'Residential',
  'Industrial'
];

const WARDS = [
  'Ward (All)',
  'Ward 1',
  'Ward 2',
  'Ward 3',
  'Ward 4',
  'Ward 5',
  'Ward 6',
  'Ward 7'
];

const STATUS_OPTIONS = [
  'Status: All',
  'Status: Available',
  'Status: Pending',
  'Status: Sold'
];

const CitizenPropertyMarketplacePage = () => {
  const navigate = useNavigate();

  // View Mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWard, setSelectedWard] = useState('Ward (All)');
  const [selectedStatus, setSelectedStatus] = useState('Status: All');
  
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
    const pType = p.type || p.propertyType || '';
    const pWard = p.ward || '';

    const matchesSearch = !searchQuery || pName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || pType.toLowerCase().includes(selectedCategory.toLowerCase());
    
    const wardRaw = selectedWard === 'Ward (All)' ? '' : selectedWard;
    const matchesWard = !wardRaw || pWard.toLowerCase().includes(wardRaw.toLowerCase());
    
    const statusRaw = selectedStatus.replace('Status: ', '').trim();
    const matchesStatus = statusRaw === 'All' || p.status.toLowerCase() === statusRaw.toLowerCase();

    return matchesSearch && matchesCategory && matchesWard && matchesStatus;
  });

  const formatPrice = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="w-full">
      <div className="mb-[2.5rem]">
        <h2 className="font-display-md text-display-md text-on-background mb-2">Property Marketplace</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Discover available agricultural, commercial, and residential properties in Kopargaon.</p>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm mb-[2.5rem] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-outline-variant/30">
        <div className="flex gap-2 flex-wrap items-center">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-label-sm text-label-sm flex items-center gap-1 cursor-pointer transition-colors border ${
                  isSelected 
                    ? 'bg-primary-container text-on-primary-container border-primary-container' 
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border-outline-variant'
                }`}
              >
                {isSelected && <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>check</span>}
                {cat}
              </button>
            )
          })}
        </div>
        
        <div className="flex gap-4 flex-wrap flex-1 items-center justify-end">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{viewMode === 'list' ? 'map' : 'list'}</span>
            {viewMode === 'list' ? 'Map View' : 'List View'}
          </button>
          
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              type="text"
              placeholder="Search properties..."
              className="pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-body-sm outline-none focus:border-primary text-on-surface w-full md:w-48"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-body-sm outline-none focus:border-primary cursor-pointer text-on-surface"
            value={selectedWard}
            onChange={e => setSelectedWard(e.target.value)}
          >
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          
          <select 
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-body-sm outline-none focus:border-primary cursor-pointer text-on-surface"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="relative h-[600px] rounded-xl overflow-hidden border border-outline-variant shadow-md">
          <MapView
            center={mapCenter}
            zoom={14}
            onSelectFeature={(feat) => setSelectedMapProperty(feat)}
            showAllControls={true}
            height="h-full"
          />
          {selectedMapProperty && (
            <div className="absolute top-4 right-4 w-80 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-4 z-[1000] flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="font-title-lg text-title-lg text-on-background line-clamp-1">{selectedMapProperty.name || selectedMapProperty.title}</h3>
                <button onClick={() => setSelectedMapProperty(null)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined">close</span></button>
              </div>
              <p className="font-title-lg text-title-lg text-primary">{formatPrice(selectedMapProperty.price || selectedMapProperty.expectedPrice)}</p>
              <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>{selectedMapProperty.locality}, {selectedMapProperty.ward}</span>
              </div>
              <Link
                to={`/citizen/properties/${selectedMapProperty.id}`}
                className="w-full py-2 mt-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                View Details
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-12 text-center text-on-surface-variant">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
             <div className="col-span-full py-12 text-center text-on-surface-variant">No matching properties found.</div>
          ) : (
            filteredProperties.map(p => {
              const pName = p.name || p.title || 'Property';
              const pPrice = p.price || p.expectedPrice || 0;
              const pType = p.type || p.propertyType || 'Residential';
              const pLocality = p.locality || 'Unknown';
              const pWard = p.ward || 'Unknown Ward';
              const pArea = p.area || 0;
              const isAvailable = p.status === 'Available';
              const defaultImage = pType.toLowerCase().includes('agri') 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWsXSqEgKkvPhY0P2ZSvI1DitsvgBxEdv_iana8rQg4k8rCNqBmvJxAwVttZcXYmltT-YSbl2HjxPO9uip7ng7S7ADZVp5NOtu3Lwjr5JsF38_Hb3LrAwjBfcDImqcXFrqmS_rSDe5Q3TSkms6iMt25w4xqzOX7BynBzBV9CLWgUbN8xT0sK4o5aTKpgYCdZ3kT1pVGWa_CDRHZQ9gh-ZswnYdsorXzOXA_HalYZn7UNnkCrBREB-4Jw'
                : pType.toLowerCase().includes('commer') 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPkubnFCzYe7JobmtQ8OFphPhq6zo2KtOA16D_Jmv8wwKqeb0QALmzF8ewiqzJnGKsRrUPAZtQv4cMs9xZWodqcBu8iRYzYH1kx93ac6tz_wA6315Aaq7bec2mQvCAOGL_hWtbh9osMwi2BqheRkz2gx2k7yGlqlXHK7wYVgNxEYARzcjy8tngIjuMvUNuK5Ut_X9oawn3zXpiA2s6jmUNzchylU_93QibdZg2UDMz_3xz6YrnUN4RZA'
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQW9JasS62nnlPUtJM_QSu7GvbkEDs0BAFXWZI18jNloByJaAiErCZN-JamcBZ8mdoiFTG6K5MF15TbPcV1INJbZCyZU65x5TIlqygcEDrJMF6SrMrHdT5N0oyC9ouyiRWz0xk-oOEirSs-tyKmaG-vDpQcqs68LLyMhMEZySG5hRZJkxajHlP76VNutO6t97Fw9-xk9_Ica80bP3x2IVEI6tGlWnk8cc1J2WnOUWl2jGJio2vMBuIQ';
              
              return (
                <div key={p.id} className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-48 relative">
                    <img 
                      src={p.images?.[0] || defaultImage} 
                      alt={pName} 
                      className="w-full h-full object-cover"
                    />
                    {isAvailable && (
                      <div className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded-full font-label-sm text-label-sm shadow-sm">
                        Available
                      </div>
                    )}
                    <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-on-surface hover:text-error transition-colors shadow-sm cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-title-lg text-title-lg text-on-background line-clamp-1 flex-1 pr-2">{pName}</h3>
                      <span className="font-title-lg text-title-lg text-primary whitespace-nowrap">{formatPrice(pPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm mb-4">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span>{pWard}, {pLocality}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6 font-body-sm text-body-sm">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-outline">straighten</span> {pArea.toLocaleString()} sq.ft
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-outline">category</span> {pType}
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <span className="px-2 py-1 bg-surface-container-high text-on-surface rounded font-label-sm text-label-sm">Condition: Good</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-outline-variant">
                      <Link 
                        to={`/citizen/properties/${p.id}`}
                        className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        View Details <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CitizenPropertyMarketplacePage;
