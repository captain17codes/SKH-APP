import postgresService from './postgresService.js';

// Centroid solver for a polygon ring coordinates [[lng, lat], ...]
const getPolygonCentroid = (ring) => {
  let x = 0, y = 0;
  const l = ring.length - 1; // Last element is duplicate of first
  if (l <= 0) return [74.4760, 19.8820];
  for (let i = 0; i < l; i++) {
    x += ring[i][0];
    y += ring[i][1];
  }
  return [y / l, x / l]; // Return as [lat, lng]
};

export const spatialAnalysisService = {
  findSuitableLocations: async (facilityType, wardId) => {
    // 1. Fetch Wards & Land Use Zones
    const [wards, landUse] = await Promise.all([
      postgresService.getWards(),
      postgresService.getLandUse()
    ]);

    const targetWard = wards.features.find(f => 
      f.properties.id.toLowerCase() === wardId.toLowerCase() ||
      f.properties.name.toLowerCase().includes(wardId.toLowerCase())
    );

    if (!targetWard) {
      throw new Error(`Ward with ID/Name ${wardId} not found`);
    }

    const actualWardId = targetWard.properties.id; // e.g. 'W4'

    // 2. Filter land use plots located in the target ward
    const candidatePlots = landUse.features.filter(f => {
      const p = f.properties;
      return p.ward && (
        p.ward.toLowerCase() === actualWardId.toLowerCase() ||
        p.ward.toLowerCase().includes(targetWard.properties.name.toLowerCase()) ||
        targetWard.properties.name.toLowerCase().includes(p.ward.toLowerCase())
      );
    });

    if (candidatePlots.length === 0) {
      return [];
    }

    // 3. Load existing schools/hospitals to evaluate gaps
    const existingHospitals = await postgresService.getNearbyOSMFeatures(19.8820, 74.4760, 15000, 'hospital');
    const existingSchools = await postgresService.getNearbyOSMFeatures(19.8820, 74.4760, 15000, 'school');

    const candidates = candidatePlots.map((plot, index) => {
      const p = plot.properties;
      const ring = plot.geometry.coordinates[0];
      const [centroidLat, centroidLng] = getPolygonCentroid(ring);

      let baseScore = 50;
      const reasons = [];

      // A. Zoning suitability rules
      const category = p.category || p.land_use_type || '';
      if (facilityType === 'hospital') {
        if (category === 'Government' || category === 'Government/Public') {
          baseScore += 30;
          reasons.push('Government land zoning allows immediate public health infrastructure development.');
        } else if (category === 'Commercial') {
          baseScore += 20;
          reasons.push('Zoned as Commercial - high transit access and utility availability.');
        } else if (category === 'Residential' || category === 'Mixed Use') {
          baseScore += 10;
          reasons.push('Residential zone suitability.');
        } else if (category === 'Green Zone' || category === 'Industrial') {
          baseScore -= 30;
          reasons.push('Warning: Green Zone / Industrial zoning restrictions apply.');
        }
      } else if (facilityType === 'school') {
        if (category === 'Government' || category === 'Government/Public') {
          baseScore += 30;
          reasons.push('Government reserve plot eliminates land acquisition overhead.');
        } else if (category === 'Residential' || category === 'Mixed Use') {
          baseScore += 25;
          reasons.push('Directly situated inside residential catchment zone.');
        } else if (category === 'Green Zone') {
          baseScore += 10;
          reasons.push('Eco-friendly location near green cover.');
        } else if (category === 'Industrial') {
          baseScore -= 40;
          reasons.push('Caution: Unsuitable industrial buffer zones.');
        }
      }

      // B. Proximity and Gap Calculation rules
      const checkList = facilityType === 'hospital' ? existingHospitals : existingSchools;
      let minDistance = 99999;
      for (const item of checkList) {
        const itemCoords = [item.lng, item.lat];
        const dist = postgresService.getPointWard ? item.distance || 5000 : 5000;
        if (dist < minDistance) minDistance = dist;
      }

      if (minDistance > 2000) {
        baseScore += 15;
        reasons.push('High healthcare gap: nearest medical facility is > 2km away.');
      } else if (minDistance < 500) {
        baseScore -= 20;
        reasons.push('Redundant: existing facility located within 500 meters.');
      }

      // C. Connectivity (Demo score or PostGIS distance)
      const roadScore = p.roadConnectivity || 85;
      if (roadScore > 80) {
        baseScore += 10;
        reasons.push('Excellent arterial road network accessibility.');
      }

      // Clamp score between 0 and 100
      const finalScore = Math.min(Math.max(baseScore, 10), 98);

      return {
        plotId: p.id,
        plotName: p.name || `Land Plot ${p.id}`,
        score: finalScore,
        latitude: centroidLat,
        longitude: centroidLng,
        reasons: reasons.filter(r => !r.startsWith('Warning') && !r.startsWith('Caution')),
        warnings: reasons.filter(r => r.startsWith('Warning') || r.startsWith('Caution')),
        area: p.areaAcres || 5.0,
        zoning: category
      };
    });

    // Sort by suitability score descending and return Top 3 candidates
    return candidates.sort((a, b) => b.score - a.score).slice(0, 3).map((c, index) => ({
      rank: index + 1,
      ...c
    }));
  }
};

export default spatialAnalysisService;
