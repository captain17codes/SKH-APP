import * as turf from '@turf/turf';

export const turfService = {
  /**
   * Find which ward a given point (lng, lat) falls into.
   * @param {number} lng Longitude
   * @param {number} lat Latitude
   * @param {Object} wardsGeoJSON FeatureCollection of wards
   * @returns {Object|null} The ward properties or null if outside
   */
  getWardFromPoint: (lng, lat, wardsGeoJSON) => {
    if (!wardsGeoJSON || !wardsGeoJSON.features) return null;
    
    const pt = turf.point([lng, lat]);
    
    for (const feature of wardsGeoJSON.features) {
      // Support Polygon and MultiPolygon
      if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        if (turf.booleanPointInPolygon(pt, feature)) {
          return feature.properties;
        }
      }
    }
    return null;
  },

  /**
   * Generates a circular buffer polygon around a point.
   * @param {number} lng 
   * @param {number} lat 
   * @param {number} radiusKm 
   * @returns {Object} GeoJSON Polygon feature
   */
  generateHazardBuffer: (lng, lat, radiusKm = 0.5) => {
    const pt = turf.point([lng, lat]);
    return turf.buffer(pt, radiusKm, { units: 'kilometers' });
  }
};

export default turfService;
