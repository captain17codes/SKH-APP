import axios from 'axios';

const OVERPASS_API_URL = import.meta.env.VITE_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

// Bounding box for Kopargaon (~0.04 degrees around center 19.8820, 74.4760)
const KOPARGAON_BBOX = '19.8620,74.4560,19.9020,74.4960';

// Cache helpers
const cacheGet = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const cacheSet = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage cache failed', e);
  }
};

export const overpassService = {
  fetchSchools: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cacheGet('kopargaon_osm_schools');
      if (cached) return cached;
    }

    const query = `[out:json][timeout:25];
      (
        node["amenity"="school"](${KOPARGAON_BBOX});
        way["amenity"="school"](${KOPARGAON_BBOX});
        relation["amenity"="school"](${KOPARGAON_BBOX});
      );
      out body geom;`;

    const res = await axios.post(OVERPASS_API_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const transformed = overpassService.transformSchoolData(res.data.elements || []);
    cacheSet('kopargaon_osm_schools', transformed);
    return transformed;
  },

  fetchHospitals: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cacheGet('kopargaon_osm_hospitals');
      if (cached) return cached;
    }

    const query = `[out:json][timeout:25];
      (
        node["amenity"="hospital"](${KOPARGAON_BBOX});
        way["amenity"="hospital"](${KOPARGAON_BBOX});
        relation["amenity"="hospital"](${KOPARGAON_BBOX});
      );
      out body geom;`;

    const res = await axios.post(OVERPASS_API_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const transformed = overpassService.transformHospitalData(res.data.elements || []);
    cacheSet('kopargaon_osm_hospitals', transformed);
    return transformed;
  },

  fetchRoads: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cacheGet('kopargaon_osm_roads');
      if (cached) return cached;
    }

    const query = `[out:json][timeout:25];
      (
        way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|unclassified"](${KOPARGAON_BBOX});
      );
      out body geom;`;

    const res = await axios.post(OVERPASS_API_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const transformed = overpassService.transformRoadData(res.data.elements || []);
    cacheSet('kopargaon_osm_roads', transformed);
    return transformed;
  },

  transformSchoolData: (elements) => {
    return elements.map(el => {
      const tags = el.tags || {};
      let lat = el.lat;
      let lng = el.lon;

      if (!lat && el.geometry && el.geometry.length > 0) {
        // Use centroid or first coordinate for ways/relations
        lat = el.geometry[0].lat;
        lng = el.geometry[0].lon;
      }

      if (!lat || !lng) return null;

      return {
        id: String(el.id),
        name: tags.name || 'OSM School',
        type: 'School',
        address: tags['addr:full'] || tags['addr:street'] || tags['addr:place'] || '',
        phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || tags['contact:website'] || '',
        lat,
        lng
      };
    }).filter(Boolean);
  },

  transformHospitalData: (elements) => {
    return elements.map(el => {
      const tags = el.tags || {};
      let lat = el.lat;
      let lng = el.lon;

      if (!lat && el.geometry && el.geometry.length > 0) {
        lat = el.geometry[0].lat;
        lng = el.geometry[0].lon;
      }

      if (!lat || !lng) return null;

      return {
        id: String(el.id),
        name: tags.name || 'OSM Hospital',
        type: 'Hospital',
        address: tags['addr:full'] || tags['addr:street'] || tags['addr:place'] || '',
        phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || tags['contact:website'] || '',
        emergency: tags.emergency || '',
        lat,
        lng
      };
    }).filter(Boolean);
  },

  transformRoadData: (elements) => {
    return elements.map(el => {
      const tags = el.tags || {};
      if (!el.geometry || el.geometry.length < 2) return null;

      const coordinates = el.geometry.map(pt => [pt.lat, pt.lon]);

      return {
        id: String(el.id),
        name: tags.name || tags.ref || 'Unnamed Road',
        type: tags.highway || 'unclassified',
        surface: tags.surface || '',
        maxSpeed: tags.maxspeed || '',
        coordinates
      };
    }).filter(Boolean);
  }
};

export default overpassService;
