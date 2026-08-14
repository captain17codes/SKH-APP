import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const dbConfig = {
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'kopargaon_gis'}`
};

let dbPool = null;
let useDatabase = false;

try {
  if (process.env.DATABASE_URL || process.env.POSTGRES_PASSWORD) {
    dbPool = new Pool(dbConfig);
    useDatabase = true;
  }
} catch (e) {
  console.warn('[AI Priority] PostgreSQL connection failed. Using GeoJSON file fallback.');
}

// Haversine helper
const haversineDistanceMeters = (c1, c2) => {
  const R = 6371e3;
  const lat1 = c1[1] * Math.PI / 180;
  const lat2 = c2[1] * Math.PI / 180;
  const dLat = (c2[1] - c1[1]) * Math.PI / 180;
  const dLng = (c2[0] - c1[0]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Point in polygon
const pointInPolygon = (pt, ring) => {
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

// Load fallback GeoJSONs
const loadLocalGeoJSON = (filename) => {
  try {
    const filePath = path.resolve(process.cwd(), '../client/src/data/gis', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Failed to load ${filename}`, e);
  }
  return { type: 'FeatureCollection', features: [] };
};

export const complaintPriorityService = {
  calculatePriority: async (category, description, latitude, longitude) => {
    let score = 50;
    const reasons = [];
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // 1. Base Score by Category
    const cat = category.toLowerCase();
    if (cat.includes('road') || cat.includes('drainage') || cat.includes('water') || cat.includes('electric')) {
      score = 55;
      reasons.push(`Core utility/roadway category (${category})`);
    } else if (cat.includes('light') || cat.includes('garbage') || cat.includes('traffic')) {
      score = 45;
      reasons.push(`Standard civic maintenance category (${category})`);
    } else {
      score = 35;
      reasons.push(`General municipal request category (${category})`);
    }

    // 2. Keyword Severity Check
    const desc = (description || '').toLowerCase();
    const severeRegex = /burst|flood|leak|overflow|hazard|dangerous|accident|injury|broken|spill|collapse/i;
    const urgentRegex = /urgent|immediate|critical|severe|blockage|outage/i;

    if (severeRegex.test(desc)) {
      score += 15;
      reasons.push('High-severity hazard keywords detected in description');
    }
    if (urgentRegex.test(desc)) {
      score += 5;
      reasons.push('Urgency indicator terms present in user submission');
    }

    // 3. Proximity to Critical Infrastructure
    let nearCriticalInfra = false;
    try {
      const infra = loadLocalGeoJSON('infrastructure.geojson');
      for (const feat of infra.features) {
        if (feat.geometry && feat.geometry.type === 'Point') {
          const dist = haversineDistanceMeters([lng, lat], feat.geometry.coordinates);
          if (dist <= 500) {
            nearCriticalInfra = true;
            break;
          }
        }
      }
    } catch {}

    if (nearCriticalInfra) {
      score += 10;
      reasons.push('Located near critical municipal asset (hospital/school buffer zone)');
    }

    // 4. Proximity to major roads
    let nearMajorRoad = false;
    try {
      const roads = loadLocalGeoJSON('roads.geojson');
      for (const feat of roads.features) {
        if (feat.geometry && feat.geometry.type === 'LineString') {
          for (const coord of feat.geometry.coordinates) {
            if (haversineDistanceMeters([lng, lat], coord) <= 150) {
              nearMajorRoad = true;
              break;
            }
          }
        }
      }
    } catch {}

    if (nearMajorRoad) {
      score += 5;
      reasons.push('Proximity to major high-traffic road bypass corridor');
    }

    // 5. Ward Population Density
    let highPopWard = false;
    let wardName = '';
    try {
      const wards = loadLocalGeoJSON('wards.geojson');
      for (const feat of wards.features) {
        if (feat.geometry && feat.geometry.type === 'Polygon') {
          const ring = feat.geometry.coordinates[0];
          if (pointInPolygon([lng, lat], ring)) {
            wardName = feat.properties.name;
            if (feat.properties.population > 8000) {
              highPopWard = true;
            }
            break;
          }
        }
      }
    } catch {}

    if (highPopWard) {
      score += 10;
      reasons.push(`Located in high-density population zone (${wardName})`);
    }

    // 6. Cluster Check: Count nearby complaints of same category
    let clusterCount = 0;
    try {
      if (useDatabase && dbPool) {
        const client = await dbPool.connect();
        const res = await client.query(
          `SELECT COUNT(*) FROM complaints 
           WHERE category = $1 AND status != 'RESOLVED' AND status != 'REJECTED'
             AND ST_DWithin(geometry::geography, ST_MakePoint($2, $3)::geography, 1000)`,
          [category, lng, lat]
        );
        client.release();
        clusterCount = parseInt(res.rows[0].count);
      } else {
        // Fallback file check
        const cachePath = path.resolve(process.cwd(), '../client/src/data/gis/complaints.geojson');
        if (fs.existsSync(cachePath)) {
          const list = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          clusterCount = list.features.filter(f => 
            f.properties.category === category &&
            f.properties.status !== 'RESOLVED' &&
            f.properties.status !== 'REJECTED' &&
            haversineDistanceMeters([lng, lat], f.geometry.coordinates) <= 1000
          ).length;
        }
      }
    } catch (e) {
      console.error('[AI Priority] Cluster check failed', e);
    }

    if (clusterCount >= 3) {
      score += 15;
      reasons.push(`Multiple complaints registered nearby of same category (${clusterCount} open cases)`);
    } else if (clusterCount >= 1) {
      score += 5;
      reasons.push('Previous issue tickets reported in this immediate coordinates zone');
    }

    // Cap score
    score = Math.min(100, Math.max(0, score));

    // Priority Rating mapping
    let priority = 'LOW';
    if (score >= 85) priority = 'CRITICAL';
    else if (score >= 70) priority = 'HIGH';
    else if (score >= 50) priority = 'MEDIUM';

    return {
      priority,
      score,
      reasons
    };
  }
};
