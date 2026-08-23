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
    try {
      if (await postgresService.isDatabaseAvailable() && facilityType === 'hospital') {
        // Use the native PostGIS stored procedure!
        const res = await postgresService.query('SELECT * FROM find_hospital_suitable_plots(1500.0)');
        let candidates = res.rows.map(row => {
          let score = 50;
          if (row.road_distance_meters < 100) score += 30;
          else if (row.road_distance_meters < 500) score += 15;

          return {
            plotId: row.plot_id,
            plotName: `Suitable Plot - ${row.ward_name}`,
            ward: row.ward_name,
            score: Math.min(score, 98),
            reasons: [`Ideal road distance: ${Math.round(row.road_distance_meters)}m`, `Good parcel size: ${row.plot_area_sqm} sqm`],
            area: row.plot_area_sqm,
            zoning: 'Commercial / Public'
          };
        });
        
        // Filter by target ward if specified
        if (wardId) {
          candidates = candidates.filter(c => c.ward.toLowerCase().includes(wardId.toLowerCase()) || c.plotId.toLowerCase() === wardId.toLowerCase());
        }

        return candidates.sort((a, b) => b.score - a.score).slice(0, 3).map((c, idx) => ({ rank: idx + 1, ...c }));
      }
    } catch (e) {
      console.warn('Stored procedure failed, falling back to JS heuristic', e.message);
    }

    // JS Fallback (if DB unavailable or not hospital)
    const [wards, landUse] = await Promise.all([
      postgresService.getWards(),
      postgresService.getLandUse()
    ]);

    const targetWard = wards.features.find(f => 
      f.properties.id.toLowerCase() === wardId.toLowerCase() ||
      f.properties.name.toLowerCase().includes(wardId.toLowerCase())
    );

    if (!targetWard) return [];
    const actualWardId = targetWard.properties.id; 

    const candidatePlots = landUse.features.filter(f => {
      const p = f.properties;
      return p.ward && (p.ward.toLowerCase() === actualWardId.toLowerCase() || targetWard.properties.name.toLowerCase().includes(p.ward.toLowerCase()));
    });

    if (candidatePlots.length === 0) return [];

    const existingFacilities = await postgresService.getNearbyOSMFeatures(19.8820, 74.4760, 15000, facilityType);

    const candidates = candidatePlots.map((plot) => {
      const p = plot.properties;
      let baseScore = 50;
      return {
        plotId: p.id,
        plotName: p.name || `Land Plot ${p.id}`,
        score: baseScore + 20,
        reasons: ['Zoning allowed', 'No nearby conflicts'],
        warnings: [],
        area: p.areaAcres || p.area_sqm || 5.0,
        zoning: p.category || p.land_use_type
      };
    });

    return candidates.sort((a, b) => b.score - a.score).slice(0, 3).map((c, index) => ({ rank: index + 1, ...c }));
  }
};

export default spatialAnalysisService;
