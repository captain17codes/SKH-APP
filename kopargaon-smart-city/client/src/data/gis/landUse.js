// Kopargaon Land Use Master Zoning GeoJSON
export const LAND_USE_ZONING_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "lu-res-1",
      properties: {
        id: "PLOT-RES-01",
        category: "Residential",
        name: "Laxmi Nagar High-Density Residential Zone",
        ward: "Ward 3",
        areaAcres: 42.5,
        currentUsage: "Residential Apartments & Houses",
        recommendedUsage: "Vertical FSI 2.5 Expansion",
        color: "#3b82f6"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4690, 19.8860],
            [74.4760, 19.8890],
            [74.4740, 19.8810],
            [74.4660, 19.8800],
            [74.4690, 19.8860]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "lu-com-1",
      properties: {
        id: "PLOT-COM-01",
        category: "Commercial",
        name: "Sangamner Naka Central Business District",
        ward: "Ward 1",
        areaAcres: 18.2,
        currentUsage: "Retail Markets & Banks",
        recommendedUsage: "Multi-modal Transit Commercial Hub",
        color: "#f59e0b"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4660, 19.8940],
            [74.4730, 19.8970],
            [74.4750, 19.8910],
            [74.4670, 19.8890],
            [74.4660, 19.8940]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "lu-ind-1",
      properties: {
        id: "PLOT-IND-01",
        category: "Industrial",
        name: "Takli MIDC Manufacturing Belt",
        ward: "Ward 5",
        areaAcres: 65.0,
        currentUsage: "Manufacturing Factories & Warehouses",
        recommendedUsage: "Solar-Powered Clean Manufacturing",
        color: "#ec4899"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4560, 19.8840],
            [74.4660, 19.8850],
            [74.4630, 19.8770],
            [74.4530, 19.8750],
            [74.4560, 19.8840]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "lu-grn-1",
      properties: {
        id: "PLOT-GRN-01",
        category: "Green Zone",
        name: "Godavari Riverbank Protected Ecological Corridor",
        ward: "Ward 2",
        areaAcres: 34.0,
        currentUsage: "Natural Riparian Buffer",
        recommendedUsage: "Eco Park & Non-Permanent Tourism Promenade",
        color: "#10b981"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4760, 19.8990],
            [74.4870, 19.9010],
            [74.4890, 19.8940],
            [74.4770, 19.8920],
            [74.4760, 19.8990]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "lu-agr-1",
      properties: {
        id: "PLOT-AGR-01",
        category: "Agricultural",
        name: "Samvatsar Agricultural Belt",
        ward: "Ward 6",
        areaAcres: 88.0,
        currentUsage: "Sugarcane & Onion Cultivation",
        recommendedUsage: "Protected Sugarcane Buffer Zone",
        color: "#84cc16"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4890, 19.9030],
            [74.5010, 19.9070],
            [74.5030, 19.8960],
            [74.4920, 19.8940],
            [74.4890, 19.9030]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "lu-gov-1",
      properties: {
        id: "PLOT-GOV-01",
        category: "Government",
        name: "Municipal Administrative & Civil Hospital Compound",
        ward: "Ward 1",
        areaAcres: 12.4,
        currentUsage: "Government Offices & Health Facility",
        recommendedUsage: "Smart Civic Command Center",
        color: "#8b5cf6"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4740, 19.8940],
            [74.4770, 19.8960],
            [74.4780, 19.8920],
            [74.4740, 19.8910],
            [74.4740, 19.8940]
          ]
        ]
      }
    }
  ]
};

export default LAND_USE_ZONING_GEOJSON;
