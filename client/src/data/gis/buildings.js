// Kopargaon Major Public & Commercial Buildings GeoJSON
export const BUILDINGS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "bldg-1",
      properties: {
        id: "BLDG-KMC-HQ",
        name: "Kopargaon Municipal Council Headquarters",
        type: "Civic Administrative",
        floors: 4,
        status: "Active",
        ward: "Ward 1"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4770, 19.8915],
            [74.4782, 19.8918],
            [74.4780, 19.8910],
            [74.4768, 19.8907],
            [74.4770, 19.8915]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "bldg-2",
      properties: {
        id: "BLDG-CIVIL-HOSP",
        name: "Civil Hospital Main Surgical Block",
        type: "Healthcare",
        floors: 3,
        status: "Active",
        ward: "Ward 1"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4790, 19.8928],
            [74.4802, 19.8931],
            [74.4800, 19.8922],
            [74.4788, 19.8919],
            [74.4790, 19.8928]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "bldg-3",
      properties: {
        id: "BLDG-SOMAIYA",
        name: "Somaiya College Administrative Wing",
        type: "Educational",
        floors: 3,
        status: "Active",
        ward: "Ward 1"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4725, 19.8942],
            [74.4735, 19.8945],
            [74.4733, 19.8936],
            [74.4723, 19.8933],
            [74.4725, 19.8942]
          ]
        ]
      }
    }
  ]
};

export default BUILDINGS_GEOJSON;
