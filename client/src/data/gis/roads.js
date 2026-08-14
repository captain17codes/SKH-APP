// Kopargaon Major Road Network GeoJSON
export const ROADS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "rd-1",
      properties: {
        id: "RD-NH160",
        name: "National Highway NH-160 Bypass",
        category: "Highway",
        lanes: 4,
        status: "Good",
        ward: "Ward 4"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [74.4600, 19.8970],
          [74.4750, 19.8940],
          [74.4900, 19.8850]
        ]
      }
    },
    {
      type: "Feature",
      id: "rd-2",
      properties: {
        id: "RD-TILAK",
        name: "Tilak Road Commercial Corridor",
        category: "Arterial",
        lanes: 2,
        status: "Resurfacing Planned",
        ward: "Ward 3"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [74.4660, 19.8880],
          [74.4750, 19.8860],
          [74.4850, 19.8820]
        ]
      }
    },
    {
      type: "Feature",
      id: "rd-3",
      properties: {
        id: "RD-TAKLI",
        name: "Takli MIDC Heavy Transport Road",
        category: "Industrial Road",
        lanes: 2,
        status: "Good",
        ward: "Ward 5"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [74.4530, 19.8840],
          [74.4650, 19.8780],
          [74.4750, 19.8750]
        ]
      }
    }
  ]
};

export default ROADS_GEOJSON;
