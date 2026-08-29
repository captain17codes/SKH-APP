import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Standard database client pool connection config
const dbConfig = {
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'kopargaon_gis'}`
};

let dbPool = null;
let useDatabase = false;

try {
  if (process.env.DATABASE_URL || process.env.POSTGRES_PASSWORD) {
    dbPool = new Pool(dbConfig);
    useDatabase = true;
    console.log('🔌 PostgreSQL Client Pool configured');
  }
} catch (e) {
  console.warn('⚠️ Could not connect to PostgreSQL. Defaulting to local GeoJSON static cache.');
}

// --------------------------------------------------
// GEOGRAPHIC MATH HELPERS FOR JS FALLBACK
// --------------------------------------------------

const haversineDistanceMeters = (coords1, coords2) => {
  const R = 6371e3; // Earth radius meters
  const lat1 = coords1[1] * Math.PI / 180;
  const lat2 = coords2[1] * Math.PI / 180;
  const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
  const dLng = (coords2[0] - coords1[0]) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const pointInPolygon = (point, ring) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Loader helpers for static JSON files
const loadLocalGeoJSON = (filename) => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'client/src/data/gis', filename),
    path.resolve(process.cwd(), '../client/src/data/gis', filename),
    path.resolve(process.cwd(), 'src/data/gis', filename),
    path.resolve('c:/Users/chava/OneDrive/Desktop/SKH/client/src/data/gis', filename)
  ];
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.error(`Failed to load local GeoJSON file at ${filePath}:`, e);
    }
  }
  return { type: 'FeatureCollection', features: [] };
};

export const postgresService = {
  isDatabaseAvailable: async () => {
    if (!useDatabase || !dbPool) return false;
    try {
      const client = await dbPool.connect();
      client.release();
      return true;
    } catch {
      return false;
    }
  },

  query: async (sql, params) => {
    if (!dbPool) throw new Error('Database unavailable');
    return dbPool.query(sql, params);
  },

  // --------------------------------------------------
  // WARDS DATA API
  // --------------------------------------------------
  getWards: async () => {
    if (await postgresService.isDatabaseAvailable()) {
      const res = await postgresService.query(
        `SELECT id, name, councillor, population, area_km2 as "areaKm2", density, type, completion_rate as "completionRate", color, ST_AsGeoJSON(geometry)::json as geometry FROM wards`
      );
      return {
        type: 'FeatureCollection',
        features: res.rows.map(row => ({
          type: 'Feature',
          properties: row,
          geometry: row.geometry
        }))
      };
    }
    return loadLocalGeoJSON('wards.geojson');
  },

  // --------------------------------------------------
  // PROJECTS DATA API
  // --------------------------------------------------
  getProjects: async () => {
    if (await postgresService.isDatabaseAvailable()) {
      const res = await postgresService.query(
        `SELECT id, name, category, description, status, progress, budget, spent, start_date as "startDate", expected_completion as "expectedCompletion", department, ward_id as "ward", ST_AsGeoJSON(geometry)::json as geometry FROM projects`
      );
      if (res.rows && res.rows.length > 0) return res.rows;
    }
    const geojson = loadLocalGeoJSON('projects.geojson');
    if (geojson.features && geojson.features.length > 0) {
      return geojson.features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        category: f.properties.category,
        description: f.properties.description,
        status: f.properties.status,
        progress: f.properties.progress,
        budget: f.properties.budget,
        spent: f.properties.spent,
        startDate: f.properties.startDate,
        expectedCompletion: f.properties.expectedCompletion,
        department: f.properties.department,
        ward: f.properties.ward,
        geometry: f.geometry,
        coordinates: f.geometry.type === 'Point' ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : null
      }));
    }
    return [
      {
        id: "PRJ-2026-001",
        name: "Godavari Riverfront Promenade & Flood Barrier",
        category: "Green Zone & Eco-Tourism",
        department: "Urban Development & Irrigation",
        ward: "Ward 2 - Riverbank",
        budget: 45000000,
        spent: 32500000,
        progress: 72,
        startDate: "2025-04-15",
        expectedCompletion: "2026-11-30",
        status: "IN_PROGRESS",
        contractor: "Maharashtra Infrastructure Corp",
        engineer: "Er. Ramesh Kulkarni",
        description: "Construction of 2.4 km reinforced riverside embankment, solar walkways, amphitheater, and flood telemetry sensors.",
        coordinates: [19.8985, 74.4840]
      },
      {
        id: "PRJ-2026-002",
        name: "Road Development — Ward 4",
        category: "Road Construction",
        department: "Public Works Department (PWD)",
        ward: "Ward 4 - Yesgaon Bypass",
        budget: 50000000,
        spent: 39000000,
        progress: 48,
        startDate: "2025-01-10",
        expectedCompletion: "2026-09-15",
        status: "DELAYED",
        contractor: "Shree Ganesh Construction Ltd",
        engineer: "Er. Sunita Jadhav",
        description: "Multi-lane arterial road asphalt resurfacing, storm drain reconstruction, and street light ducting in Ward 4.",
        coordinates: [19.8830, 74.4880]
      },
      {
        id: "PRJ-2026-003",
        name: "Underground 24x7 Water Grid & Smart Metering",
        category: "Water Supply",
        department: "Water Supply & Sanitation",
        ward: "Ward 3 - Laxmi Nagar",
        budget: 36000000,
        spent: 18000000,
        progress: 50,
        startDate: "2025-09-01",
        expectedCompletion: "2027-03-31",
        status: "IN_PROGRESS",
        contractor: "AquaTech Water Systems",
        engineer: "Er. Mahesh Patil",
        description: "Replacing 18 km aging cement water pipes with HDPE pressurized lines equipped with ultrasonic IoT meters.",
        coordinates: [19.8875, 74.4730]
      },
      {
        id: "PRJ-2026-004",
        name: "TAKLI MIDC 5MW Rooftop & Ground Solar Park",
        category: "Renewable Energy",
        department: "Renewable Energy & Power",
        ward: "Ward 5 - MIDC Zone",
        budget: 54000000,
        spent: 54000000,
        progress: 100,
        startDate: "2024-08-01",
        expectedCompletion: "2026-02-28",
        status: "COMPLETED",
        contractor: "MahaSolar CleanGrid",
        engineer: "Er. Anand Varma",
        description: "Grid-connected 5 MegaWatt solar photovoltaic station powering public streetlights and municipal pump stations.",
        coordinates: [19.8790, 74.4610]
      },
      {
        id: "PRJ-2026-005",
        name: "Yesgaon Multi-Modal Logistics & Cold Chain Yard",
        category: "Town Planning",
        department: "Town Planning & Industry",
        ward: "Ward 4 - Yesgaon Bypass",
        budget: 95000000,
        spent: 19000000,
        progress: 20,
        startDate: "2026-01-15",
        expectedCompletion: "2027-12-20",
        status: "PLANNED",
        contractor: "Apex Infra Projects",
        engineer: "Er. Vijay Tambe",
        description: "22-acre modern logistic hub featuring 10,000 MT temperature-controlled cold storage for agricultural produce.",
        coordinates: [19.8830, 74.4880]
      },
      {
        id: "PRJ-2026-006",
        name: "Subhash Road Heritage Market Beautification",
        category: "Heritage & Infrastructure",
        department: "Town Planning & Heritage",
        ward: "Ward 6 - Samvatsar Border",
        budget: 28000000,
        spent: 24000000,
        progress: 88,
        startDate: "2025-03-01",
        expectedCompletion: "2026-09-30",
        status: "APPROVED",
        contractor: "Heritage Craft Builders",
        engineer: "Er. Sneha Borse",
        description: "Pedestrianization of central market street, underground utility cabling, unified shop facade signages.",
        coordinates: [19.8900, 74.4760]
      }
    ];
  },

  // --------------------------------------------------
  // LAND USE DATA API
  // --------------------------------------------------
  getLandUse: async () => {
    if (await postgresService.isDatabaseAvailable()) {
      const res = await postgresService.query(
        `SELECT id, land_use_type as "category", area_sqm as "areaAcres", ward_id as "ward", ST_AsGeoJSON(geometry)::json as geometry FROM land_use`
      );
      return {
        type: 'FeatureCollection',
        features: res.rows.map(row => ({
          type: 'Feature',
          properties: row,
          geometry: row.geometry
        }))
      };
    }
    return loadLocalGeoJSON('land_use.geojson');
  },

  // --------------------------------------------------
  // COMPLAINTS DATA API
  // --------------------------------------------------
  getComplaints: async (wardId, status, category) => {
    let list = [];
    if (await postgresService.isDatabaseAvailable()) {
      try {
        const res = await postgresService.query(
          `SELECT id, title, category, ward_id as "ward", location, reported_date as "reportedDate", status, priority, description, ST_AsGeoJSON(geometry)::json as geometry FROM complaints`
        );
        list = res.rows.map(row => ({
          ...row,
          coordinates: row.geometry?.coordinates ? [row.geometry.coordinates[1], row.geometry.coordinates[0]] : null
        }));
      } catch (err) {
        list = [];
      }
    }
    if (!list.length) {
      try {
        const mockPaths = [
          path.resolve(process.cwd(), 'client/src/data/mockData.js'),
          path.resolve(process.cwd(), '../client/src/data/mockData.js'),
          path.resolve('c:/Users/chava/OneDrive/Desktop/SKH/client/src/data/mockData.js')
        ];
        for (const mp of mockPaths) {
          if (fs.existsSync(mp)) {
            const fileContent = fs.readFileSync(mp, 'utf-8');
            const match = fileContent.match(/export const mockComplaints\s*=\s*(\[[\s\S]*?\]);/);
            if (match) {
              const parsed = Function('"use strict";return (' + match[1] + ')')();
              list = parsed.map(c => ({
                id: c.id,
                title: c.title,
                category: c.category,
                status: c.status,
                priority: c.priority,
                ward: c.ward,
                location: c.location,
                description: c.description,
                createdAt: c.createdAt,
                coordinates: c.coordinates
              }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load mockComplaints in postgresService', e);
      }
    }

    if (wardId) {
      const wardNum = wardId.replace(/\D/g, '');
      list = list.filter(c => {
        if (!c.ward) return false;
        const cw = c.ward.toLowerCase();
        const wId = wardId.toLowerCase();
        return cw.includes(wId) || (wardNum && (cw.includes(`ward ${wardNum}`) || cw.includes(`w${wardNum}`) || cw === wardNum));
      });
    }
    if (status) {
      list = list.filter(c => (c.status || '').toLowerCase().includes(status.toLowerCase()));
    }
    if (category) {
      list = list.filter(c => (c.category || '').toLowerCase().includes(category.toLowerCase()));
    }
    return list;
  },

  // --------------------------------------------------
  // GEOGRAPHIC CALCULATIONS AND FALLBACKS
  // --------------------------------------------------
  getNearbyOSMFeatures: async (lat, lng, radiusMeters, amenityType) => {
    // If PostGIS is active, run real ST_DWithin query
    if (await postgresService.isDatabaseAvailable()) {
      const res = await postgresService.query(
        `SELECT id, name, type, ST_AsGeoJSON(geometry)::json as geometry, ST_Distance(geometry::geography, ST_MakePoint($1, $2)::geography) as distance 
         FROM infrastructure 
         WHERE type = $3 AND ST_DWithin(geometry::geography, ST_MakePoint($1, $2)::geography, $4)
         ORDER BY distance ASC`,
        [lng, lat, amenityType, radiusMeters]
      );
      return res.rows;
    }

    // Fallback: Query from LocalStorage cache files or static mocks
    const cacheKey = amenityType === 'school' ? 'kopargaon_osm_schools' : 'kopargaon_osm_hospitals';
    let localList = [];
    try {
      // In Node.js, we can read infrastructure mock files or parse the files
      const infra = loadLocalGeoJSON('infrastructure.geojson');
      // If we query schools
      if (amenityType === 'school') {
        localList = infra.features ? infra.features.filter(f => f.properties.type === 'school') : [];
      } else {
        localList = infra.features ? infra.features.filter(f => f.properties.type === 'hospital') : [];
      }
    } catch {
      // Return a basic list of schools/hospitals
      localList = [];
    }

    if (!localList.length) {
      // Generate some standard OSM features around center for fallback
      const mockInfra = loadLocalGeoJSON('infrastructure.js'); // check JS
    }

    return localList.map(item => {
      const pt = item.geometry.coordinates;
      const distance = haversineDistanceMeters([lng, lat], pt);
      if (distance <= radiusMeters) {
        return {
          id: item.properties.id,
          name: item.properties.name,
          type: item.properties.type,
          address: item.properties.address || 'Kopargaon Center',
          phone: item.properties.phone || '',
          website: item.properties.website || '',
          lat: pt[1],
          lng: pt[0],
          distance
        };
      }
      return null;
    }).filter(Boolean);
  },

  getNearbyRoads: async (lat, lng) => {
    if (await postgresService.isDatabaseAvailable()) {
      const res = await postgresService.query(
        `SELECT name, road_type, ST_Distance(geometry::geography, ST_MakePoint($1, $2)::geography) as distance 
         FROM roads 
         ORDER BY distance ASC`,
        [lng, lat]
      );
      return res.rows;
    }

    const roads = loadLocalGeoJSON('roads.geojson');
    return roads.features.map(f => {
      const lineCoords = f.geometry.coordinates;
      let minDistance = 99999999;
      for (const pt of lineCoords) {
        const d = haversineDistanceMeters([lng, lat], pt);
        if (d < minDistance) minDistance = d;
      }
      return {
        name: f.properties.name,
        lanes: f.properties.lanes,
        status: f.properties.status,
        distance: minDistance
      };
    }).sort((a, b) => a.distance - b.distance);
  },

  getPointWard: async (lat, lng) => {
    const wards = await postgresService.getWards();
    for (const f of wards.features) {
      if (f.geometry && f.geometry.type === 'Polygon') {
        const ring = f.geometry.coordinates[0];
        if (pointInPolygon([lng, lat], ring)) {
          return f.properties;
        }
      }
    }
    return null;
  },

  getNearbyComplaints: async (project) => {
    if (await postgresService.isDatabaseAvailable() && project && project.id) {
      try {
        const res = await postgresService.query(
          `SELECT c.id, c.title, c.category, c.status, c.priority, c.latitude, c.longitude, 
                  ST_Distance(c.geometry::geography, p.geometry::geography) as distance 
           FROM complaints c 
           JOIN projects p ON p.id = $1 
           WHERE ST_DWithin(c.geometry::geography, p.geometry::geography, 1000)
           ORDER BY distance ASC`,
          [project.id]
        );
        return res.rows.map(r => ({
          ...r,
          coordinates: [Number(r.latitude), Number(r.longitude)]
        }));
      } catch (e) {
        console.warn('PostGIS ST_DWithin query failed, using Haversine fallback:', e.message);
      }
    }

    // Fallback: Read complaints from mock/static data
    const mockComplaints = [
      { id: "CMP-2026-8901", title: "Severe Asphalt Potholes on Tilak Road Junction", category: "Road Damage", ward: "Ward 3", status: "In Progress", priority: "High", coordinates: [19.8882, 74.4741] },
      { id: "CMP-2026-8902", title: "Drinking Water Pipeline Leakage & Low Pressure", category: "Water Leakage", ward: "Ward 1", status: "Pending", priority: "Medium", coordinates: [19.8942, 74.4755] },
      { id: "CMP-2026-8903", title: "Uncollected Commercial Waste Near Samvatsar Gate", category: "Garbage", ward: "Ward 6", status: "Resolved", priority: "High", coordinates: [19.8995, 74.4940] },
      { id: "CMP-2026-8904", title: "Non-Functional LED Streetlights on Bypass Road", category: "Street Light", ward: "Ward 4", status: "In Progress", priority: "Medium", coordinates: [19.8845, 74.4862] },
      { id: "CMP-2026-8905", title: "Open Stormwater Drain Chamber Without Cover", category: "Drainage", ward: "Ward 5", status: "Pending", priority: "Critical", coordinates: [19.8798, 74.4635] },
      { id: "CMP-2026-8906", title: "Water Logging & Pothole Hazard on Ward 4 Approach", category: "Road Damage", ward: "Ward 4", status: "Pending", priority: "High", coordinates: [19.8835, 74.4875] },
      { id: "CMP-2026-8907", title: "Heavy Transport Vibration & Debris Obstruction", category: "Road Hazard", ward: "Ward 4", status: "Pending", priority: "High", coordinates: [19.8828, 74.4890] }
    ];

    const prjCoords = project.coordinates || (project.geometry?.type === 'Point' ? [project.geometry.coordinates[1], project.geometry.coordinates[0]] : null);

    return mockComplaints.filter(c => {
      if (prjCoords && c.coordinates) {
        const dist = haversineDistanceMeters(prjCoords, c.coordinates);
        return dist <= 1200;
      }
      if (project.ward && c.ward) {
        return project.ward.toLowerCase().includes(c.ward.toLowerCase());
      }
      return false;
    });
  },

  getComplaints: async (wardId, status, category) => {
    let list = [
      { id: "CMP-2026-8901", title: "Severe Asphalt Potholes on Tilak Road Junction", category: "Road Damage", ward: "Ward 3 - Laxmi Nagar", location: "Near Laxmi Narayan Temple, Tilak Road", status: "In Progress", priority: "HIGH", aiScore: 72, coordinates: [19.8882, 74.4741], upvotes: 42 },
      { id: "CMP-2026-8902", title: "Drinking Water Pipeline Leakage & Low Pressure", category: "Water Leakage", ward: "Ward 1 - Sangamner Naka", location: "Station Road Lane 4", status: "Pending", priority: "MEDIUM", aiScore: 58, coordinates: [19.8942, 74.4755], upvotes: 19 },
      { id: "CMP-2026-8903", title: "Uncollected Commercial Waste Near Samvatsar Gate", category: "Garbage", ward: "Ward 6 - Samvatsar Border", location: "Samvatsar Agri Market Entry", status: "Resolved", priority: "HIGH", aiScore: 65, coordinates: [19.8995, 74.4940], upvotes: 35 },
      { id: "CMP-2026-8904", title: "Non-Functional LED Streetlights on Bypass Road", category: "Street Light", ward: "Ward 4 - Yesgaon Bypass", location: "Yesgaon Flyover Approach Road", status: "In Progress", priority: "MEDIUM", aiScore: 45, coordinates: [19.8845, 74.4862], upvotes: 28 },
      { id: "CMP-2026-8905", title: "Open Stormwater Drain Chamber Without Cover", category: "Drainage", ward: "Ward 5 - MIDC Zone", location: "Takli Road near School Gate", status: "Pending", priority: "CRITICAL", aiScore: 88, coordinates: [19.8798, 74.4635], upvotes: 56 },
      { id: "CMP-2026-8906", title: "Unauthorized Construction Encroaches Public Footpath", category: "Illegal Construction", ward: "Ward 7 - Subhash Road", location: "Subhash Road Market Plot 45", status: "Under Review", priority: "MEDIUM", aiScore: 40, coordinates: [19.8905, 74.4768], upvotes: 14 }
    ];

    if (await postgresService.isDatabaseAvailable()) {
      try {
        const res = await postgresService.query(`SELECT * FROM complaints ORDER BY created_at DESC`);
        list = res.rows.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          ward: r.ward,
          location: r.location,
          status: r.status,
          priority: r.priority,
          aiScore: r.ai_score || r.aiScore || 50,
          aiReasons: r.ai_reasons || r.aiReasons || [],
          coordinates: r.latitude && r.longitude ? [Number(r.latitude), Number(r.longitude)] : null,
          upvotes: r.upvotes || 0
        }));
      } catch (e) {
        console.warn('DB getComplaints query failed, using static list:', e.message);
      }
    }

    if (wardId) {
      list = list.filter(c => c.ward && c.ward.toLowerCase().includes(wardId.toLowerCase()));
    }
    if (status) {
      list = list.filter(c => c.status && c.status.toLowerCase() === status.toLowerCase());
    }
    if (category) {
      list = list.filter(c => c.category && c.category.toLowerCase().includes(category.toLowerCase()));
    }

    return list;
  }
};

export default postgresService;
