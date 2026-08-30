import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MapView from '../components/gis/MapView';
import { KOPARGAON_CENTER } from '../data/mockData';
import KOPARGAON_WARDS_GEOJSON from '../data/gis/wardBoundaries';
import { gisService } from '../services/gisService';
import { overpassService } from '../services/overpassService';
import { complaintService } from '../services/api';
import toast from 'react-hot-toast';

const GisPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [mapCenter, setMapCenter] = useState(KOPARGAON_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [candidateLocations, setCandidateLocations] = useState([]);

  const [osmData, setOsmData] = useState({
    schools: [],
    hospitals: [],
    roads: []
  });
  const [loadingOsm, setLoadingOsm] = useState(false);
  const [osmError, setOsmError] = useState(null);
  const [complaintHotspots, setComplaintHotspots] = useState(null);

  const loadOsmData = async (force = false) => {
    setLoadingOsm(true);
    setOsmError(null);
    try {
      const [schools, hospitals, roads] = await Promise.all([
        overpassService.fetchSchools(force),
        overpassService.fetchHospitals(force),
        overpassService.fetchRoads(force)
      ]);
      setOsmData({ schools, hospitals, roads });
    } catch (e) {
      console.error('[GIS] Overpass API fetch failed – falling back to local Kopargaon GIS data.', e);
      try {
        const infraData = await gisService.getInfrastructure();
        setOsmData({
          schools: infraData?.schools || [],
          hospitals: infraData?.hospitals || [],
          roads: []
        });
      } catch (fallbackErr) {
        console.error('[GIS] Local GIS fallback also failed:', fallbackErr);
        setOsmError('Kopargaon GIS data could not be loaded. The base map is still available.');
      }
    } finally {
      setLoadingOsm(false);
    }
  };

  useEffect(() => {
    gisService.getProjects().then(setAllProjects);
    loadOsmData();
    complaintService.getHotspots()
      .then(setComplaintHotspots)
      .catch(e => console.warn('[GIS] Complaint hotspots load failed:', e.message));
  }, []);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoomParam = searchParams.get('zoom');
    const featureId = searchParams.get('featureId') || searchParams.get('project');
    const featureType = searchParams.get('featureType');
    const wardParam = searchParams.get('ward');
    const candidatesParam = searchParams.get('candidates');

    const targetZoom = zoomParam ? parseInt(zoomParam, 10) : 16;

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(targetZoom);
    }

    if (featureId) {
      const lowerFId = featureId.toLowerCase();
      if (lowerFId.includes('godavari') || lowerFId.includes('river') || lowerFId.includes('flood') || searchParams.get('flood') === 'true') {
        const targetLat = parseFloat(lat) || 19.8764;
        const targetLng = parseFloat(lng) || 74.4835;
        setSelectedFeature({
          feat: {
            id: 'Godavari_River',
            name: 'Godavari River & Flood Inundation Zone',
            type: 'flood_zone',
            coordinates: [targetLat, targetLng],
            lat: targetLat,
            lng: targetLng
          },
          type: 'flood'
        });
        setMapCenter([targetLat, targetLng]);
        setMapZoom(15);
        return;
      }

      gisService.getProjects().then(list => {
        const found = list.find(p => p.id === featureId || p.name.toLowerCase().includes(featureId.toLowerCase()));
        if (found) {
          setSelectedFeature({ feat: found, type: 'project' });
          if (found.coordinates && (!lat || !lng)) {
            setMapCenter(found.coordinates);
            setMapZoom(targetZoom);
          }
          return;
        }

        const wardMatch = KOPARGAON_WARDS_GEOJSON.features.find(f =>
          f.properties.id === featureId || f.properties.name.toLowerCase().includes(featureId.toLowerCase())
        );
        if (wardMatch) {
          setSelectedWardId(wardMatch.properties.id);
          setSelectedFeature({ feat: wardMatch.properties, type: 'ward' });
          if (!lat || !lng) {
            setMapCenter(wardMatch.geometry.coordinates[0][0].slice().reverse());
            setMapZoom(targetZoom);
          }
          return;
        }

        if (lat && lng) {
          setSelectedFeature({
            feat: {
              id: featureId,
              name: featureId,
              type: featureType || 'GIS Feature',
              coordinates: [parseFloat(lat), parseFloat(lng)],
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            },
            type: featureType || 'location'
          });
        }
      });
    } else if (wardParam) {
      const wardFeature = KOPARGAON_WARDS_GEOJSON.features.find(f => f.properties.id === wardParam);
      if (wardFeature) {
        setSelectedWardId(wardParam);
        setMapCenter(wardFeature.geometry.coordinates[0][0].slice().reverse());
        setMapZoom(15);
        setSelectedFeature({ feat: wardFeature.properties, type: 'ward' });
      }
    }

    if (candidatesParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(candidatesParam));
        const list = decoded.map(c => ({
          id: `candidate-${c.rank}`,
          rank: c.rank,
          score: c.score,
          lat: c.latitude || c.lat,
          lng: c.longitude || c.lng,
          name: c.name || `Candidate Plot #${c.rank}`,
          reasons: c.reasons || [],
          zoning: c.zoning || 'Vacant Land',
          area: c.area || 5.0
        }));
        setCandidateLocations(list);
        if (list.length > 0 && (!lat || !lng)) {
          setMapCenter([list[0].lat, list[0].lng]);
          setMapZoom(15);
        }
      } catch (e) {
        console.error('Failed to parse candidates query param:', e);
      }
    }
  }, [searchParams]);

  const getFeatureImage = (feat, type) => {
    if (type === 'project') {
      const id = feat.id;
      if (id === 'PRJ-2026-001') return 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-002') return 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-003') return 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-004') return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-005') return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80';
      if (id === 'PRJ-2026-006') return 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&auto=format&fit=crop&q=80';
    }
    if (type === 'hospital') return 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80';
    if (type === 'school') return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80';
    if (type === 'landUse' || type === 'land') return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80';
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuD96qAZhadygONzo71a2xjQnzlNr10Orj8Q5TLR_mFvy_dXVkmriUZ0ykhJD54RQQOdJoJMGr1XHYy_c-3hBDIt01CiAmRVfJstq_pa7giYB-bKCyXeOuDswo4TVdq9GLNr4wMdinVMOyMbleYf4VKbbisMMXXRqSLbbWtqfgAyB6Vyy266op9FDsXCm5y0j4If1T61rc_Se5oMy-0apeObpBZXB4V9bQi0oS-xANYzFA1PnTbxfDccFw';
  };

  const renderPopupContent = () => {
    if (!selectedFeature) return null;
    const { feat, type } = selectedFeature;

    let title = feat.name || feat.title || 'GIS Feature';
    let description = '';
    let statusLabel = type;
    let linkUrl = '#';

    if (type === 'project') {
      description = `${feat.department} - ${feat.ward}`;
      statusLabel = feat.status || 'Active';
      linkUrl = `/projects/${feat.id}`;
    } else if (type === 'ward') {
      title = `${feat.name}`;
      description = `Population: ${feat.population?.toLocaleString() || 'N/A'}`;
      statusLabel = 'Ward';
      linkUrl = `/projects?ward=${encodeURIComponent(feat.id)}`;
    } else if (type === 'candidate') {
      description = `Suitability Score: ${feat.score} / 100`;
      statusLabel = 'Candidate Site';
      linkUrl = `/projects?create=true&cat=Healthcare&lat=${feat.lat}&lng=${feat.lng}`;
    } else if (type === 'complaint') {
      description = feat.category;
      statusLabel = feat.status;
      linkUrl = '/complaints';
    }

    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
        {/* Pin indicator */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-surface rotate-45 border-r border-b border-outline-variant z-10"></div>
        {/* Card */}
        <div className="relative bg-surface rounded-xl shadow-lg border border-outline-variant w-80 overflow-hidden z-20 pointer-events-auto">
          <div className="h-24 w-full bg-cover bg-center" style={{ backgroundImage: `url('${getFeatureImage(feat, type)}')` }}></div>
          <div className="p-4 flex flex-col h-[150px]">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-title-lg text-title-lg text-on-surface leading-tight truncate pr-2">{title}</h4>
              <button onClick={() => setSelectedFeature(null)} className="text-outline hover:text-on-surface-variant transition-colors cursor-pointer shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-auto line-clamp-2">{description}</p>
            
            <div className="flex items-center gap-2 mb-4 mt-2">
              <span className="px-2 py-1 bg-surface-container-low text-primary font-label-sm text-label-sm rounded border border-primary-fixed-dim uppercase">{statusLabel}</span>
            </div>
            
            <Link to={linkUrl} className="inline-flex items-center gap-2 text-primary hover:text-primary-container font-label-md text-label-md transition-colors nav-link cursor-pointer w-fit">
              View Details
              <span className="material-symbols-outlined text-[18px] nav-link">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background w-full">
      <div className="flex-1 relative bg-surface-container-high overflow-hidden">
        
        {osmError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-error-container text-on-error-container px-4 py-2 rounded-xl shadow-md border border-error flex items-center gap-2">
             <span className="material-symbols-outlined text-[16px]">error</span>
             <span className="text-label-sm">{osmError}</span>
          </div>
        )}

        <MapView
          center={mapCenter}
          zoom={mapZoom}
          selectedWardId={selectedWardId}
          candidateLocations={candidateLocations}
          complaintHotspots={complaintHotspots}
          flat={true}
          onSelectFeature={(feat, type) => {
            setSelectedFeature({ feat, type });
            if (feat.coordinates && type === 'project') {
              setMapCenter(feat.coordinates);
              setMapZoom(16);
            } else if (feat.lat && feat.lng) {
              setMapCenter([feat.lat, feat.lng]);
              setMapZoom(16);
            }
          }}
          selectedFeature={selectedFeature}
          showAllControls={true}
          height="h-full"
          onZoomChange={setMapZoom}
          onCenterChange={setMapCenter}
          osmData={osmData}
        />
        
        {renderPopupContent()}

      </div>
    </div>
  );
};

export default GisPage;
