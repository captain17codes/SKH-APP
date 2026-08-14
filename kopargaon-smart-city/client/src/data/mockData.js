// Kopargaon Geographical Center
export const KOPARGAON_CENTER = [19.8917, 74.4789];
export const DEFAULT_ZOOM = 14;

// Kopargaon Wards GeoJSON Mock Data
export const KOPARGAON_WARDS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "ward-1",
      properties: {
        id: "W1",
        name: "Ward 1 - Sangamner Naka & Station Hub",
        councillor: "Shri. Rajesh Deshmukh",
        population: 14200,
        areaKm2: 3.4,
        density: "4,176 / km²",
        type: "Commercial & Transit",
        completionRate: 78,
        activeProjects: 4,
        complaintsCount: 6,
        color: "#3b82f6"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4650, 19.8950],
            [74.4750, 19.8980],
            [74.4780, 19.8900],
            [74.4680, 19.8870],
            [74.4650, 19.8950]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "ward-2",
      properties: {
        id: "W2",
        name: "Ward 2 - Godavari Riverbank Front",
        councillor: "Smt. Sunita Patil",
        population: 11800,
        areaKm2: 2.8,
        density: "4,214 / km²",
        type: "Green Zone & Eco-Tourism",
        completionRate: 85,
        activeProjects: 3,
        complaintsCount: 4,
        color: "#10b981"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4750, 19.8980],
            [74.4880, 19.9020],
            [74.4910, 19.8930],
            [74.4780, 19.8900],
            [74.4750, 19.8980]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "ward-3",
      properties: {
        id: "W3",
        name: "Ward 3 - Laxmi Nagar & Tilak Road",
        councillor: "Shri. Amit Shinde",
        population: 18500,
        areaKm2: 2.1,
        density: "8,809 / km²",
        type: "High Density Residential",
        completionRate: 64,
        activeProjects: 5,
        complaintsCount: 12,
        color: "#f59e0b"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4680, 19.8870],
            [74.4780, 19.8900],
            [74.4760, 19.8800],
            [74.4640, 19.8780],
            [74.4680, 19.8870]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "ward-4",
      properties: {
        id: "W4",
        name: "Ward 4 - Yesgaon Bypass & Logistics Hub",
        councillor: "Shri. Vikram Kadam",
        population: 9400,
        areaKm2: 4.8,
        density: "1,958 / km²",
        type: "Industrial & Transport",
        completionRate: 90,
        activeProjects: 2,
        complaintsCount: 3,
        color: "#8b5cf6"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4780, 19.8900],
            [74.4910, 19.8930],
            [74.4950, 19.8810],
            [74.4760, 19.8800],
            [74.4780, 19.8900]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "ward-5",
      properties: {
        id: "W5",
        name: "Ward 5 - Takli Road & MIDC Zone",
        councillor: "Smt. Priyanka Pawar",
        population: 13100,
        areaKm2: 4.2,
        density: "3,119 / km²",
        type: "Manufacturing & Solar",
        completionRate: 72,
        activeProjects: 4,
        complaintsCount: 8,
        color: "#ec4899"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4550, 19.8850],
            [74.4680, 19.8870],
            [74.4640, 19.8780],
            [74.4520, 19.8740],
            [74.4550, 19.8850]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "ward-6",
      properties: {
        id: "W6",
        name: "Ward 6 - Samvatsar Border Agri Market",
        councillor: "Shri. Balasaheb More",
        population: 8900,
        areaKm2: 5.5,
        density: "1,618 / km²",
        type: "Agricultural & Wholesale",
        completionRate: 81,
        activeProjects: 3,
        complaintsCount: 5,
        color: "#06b6d4"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.4880, 19.9020],
            [74.5020, 19.9080],
            [74.5050, 19.8940],
            [74.4910, 19.8930],
            [74.4880, 19.9020]
          ]
        ]
      }
    }
  ]
};

// Spatial Feature Markers & Layers
export const GIS_LAYERS_DATA = {
  hospitals: [
    { id: 'h1', name: 'Kopargaon Sub-District Civil Hospital', lat: 19.8925, lng: 74.4795, beds: 150, type: 'Government Hospital', status: 'Operational', ward: 'Ward 1' },
    { id: 'h2', name: 'Sanjivani Multispecialty Medical Center', lat: 19.8890, lng: 74.4710, beds: 85, type: 'Private Super Speciality', status: 'Operational', ward: 'Ward 3' },
    { id: 'h3', name: 'Sai Baba Urban Care Clinic', lat: 19.8980, lng: 74.4830, beds: 40, type: 'Community Clinic', status: 'Upgrading', ward: 'Ward 2' }
  ],
  schools: [
    { id: 's1', name: 'K.J. Somaiya College of Arts & Commerce', lat: 19.8940, lng: 74.4730, type: 'Higher Education', students: 3500, ward: 'Ward 1' },
    { id: 's2', name: 'Sanjivani College of Engineering', lat: 19.8780, lng: 74.4620, type: 'Technical Institute', students: 4800, ward: 'Ward 5' },
    { id: 's3', name: 'Municipal Higher Secondary School No. 4', lat: 19.8860, lng: 74.4770, type: 'Government School', students: 1200, ward: 'Ward 3' }
  ],
  governmentLand: [
    { id: 'gl1', name: 'Kopargaon Municipal Council HQ Plot', lat: 19.8912, lng: 74.4778, areaAcres: 6.5, designation: 'Civic Administrative', status: 'Utilized' },
    { id: 'gl2', name: 'Old Grain Storage Land (Godavari Bank)', lat: 19.8995, lng: 74.4850, areaAcres: 14.2, designation: 'Proposed Eco Park', status: 'Vacant' },
    { id: 'gl3', name: 'Yesgaon Bypass Transport Hub Reserve', lat: 19.8830, lng: 74.4880, areaAcres: 22.0, designation: 'Logistics Park', status: 'Planning' }
  ],
  waterPipeline: [
    { id: 'wp1', name: 'Main Godavari Intake Pipeline', coords: [[19.9010, 74.4840], [19.8930, 74.4790], [19.8850, 74.4700]], diameter: '600 mm', status: 'Active' },
    { id: 'wp2', name: 'MIDC Takli Supply Corridor', coords: [[19.8850, 74.4700], [19.8790, 74.4610]], diameter: '450 mm', status: 'Active' }
  ],
  drainage: [
    { id: 'dr1', name: 'North Trunk Sewer Line', coords: [[19.8970, 74.4720], [19.8910, 74.4770], [19.8860, 74.4820]], status: 'Normal' },
    { id: 'dr2', name: 'Tilak Road Stormwater Channel', coords: [[19.8890, 74.4690], [19.8820, 74.4750]], status: 'Desilting Required' }
  ],
  floodRisk: [
    { id: 'fr1', name: 'Godavari River 100-Yr Flood Zone', bounds: [[19.8960, 74.4730], [19.9040, 74.4920]], riskLevel: 'High', description: 'Mandatory 100m buffer zone along riverbank' }
  ]
};

// Projects Mock Data
export const MOCK_PROJECTS = [
  {
    id: "PRJ-2026-001",
    name: "Godavari Riverfront Promenade & Flood Barrier",
    department: "Urban Development & Irrigation",
    ward: "Ward 2 - Riverbank",
    budget: 45000000, // INR 4.5 Cr
    spent: 32500000,
    progress: 72,
    startDate: "2025-04-15",
    endDate: "2026-11-30",
    status: "Ongoing",
    contractor: "Maharashtra Infrastructure Corp",
    engineer: "Er. Ramesh Kulkarni",
    description: "Construction of 2.4 km reinforced riverside embankment, solar walkways, amphitheater, and flood telemetry sensors.",
    coordinates: [19.8985, 74.4840],
    documentsCount: 6,
    photosCount: 8,
    timeline: [
      { date: "2025-04-15", title: "DPR Approved & Land Acquisition Cleared", status: "completed" },
      { date: "2025-08-10", title: "Retaining Wall & Piling Foundations Completed", status: "completed" },
      { date: "2026-01-20", title: "Solar Lighting & Paving Installation", status: "completed" },
      { date: "2026-06-15", title: "Riverbank Beautification & Landscaping", status: "in-progress" },
      { date: "2026-11-30", title: "Commissioning & Public Dedication", status: "pending" }
    ]
  },
  {
    id: "PRJ-2026-002",
    name: "Sangamner Naka Smart Traffic Signal & Flyover",
    department: "Public Works Department (PWD)",
    ward: "Ward 1 - Sangamner Naka",
    budget: 82000000, // INR 8.2 Cr
    spent: 78000000,
    progress: 95,
    startDate: "2024-11-01",
    endDate: "2026-09-15",
    status: "Ongoing",
    contractor: "Shree Ganesh Construction Ltd",
    engineer: "Er. Sunita Jadhav",
    description: "Grade-separated junction flyover with adaptive AI camera traffic signaling to reduce peak congestion on NH-160.",
    coordinates: [19.8935, 74.4740],
    documentsCount: 9,
    photosCount: 14,
    timeline: [
      { date: "2024-11-01", title: "Groundbreaking & Utility Shifting", status: "completed" },
      { date: "2025-05-20", title: "Pillar Girders & Span Launching", status: "completed" },
      { date: "2025-12-10", title: "Asphalt Laying & Safety Barrier Erecting", status: "completed" },
      { date: "2026-07-01", title: "Smart Signal Sensor Calibration", status: "in-progress" },
      { date: "2026-09-15", title: "Traffic Testing & Inauguration", status: "pending" }
    ]
  },
  {
    id: "PRJ-2026-003",
    name: "Underground 24x7 Water Grid & Smart Metering",
    department: "Water Supply & Sanitation",
    ward: "Ward 3 - Laxmi Nagar",
    budget: 36000000, // INR 3.6 Cr
    spent: 18000000,
    progress: 50,
    startDate: "2025-09-01",
    endDate: "2027-03-31",
    status: "Ongoing",
    contractor: "AquaTech Water Systems",
    engineer: "Er. Mahesh Patil",
    description: "Replacing 18 km aging cement water pipes with HDPE pressurized lines equipped with ultrasonic IoT meters.",
    coordinates: [19.8875, 74.4730],
    documentsCount: 4,
    photosCount: 6,
    timeline: [
      { date: "2025-09-01", title: "HDPE Pipeline Trenching Starts", status: "completed" },
      { date: "2026-02-15", title: "Zone A Distribution Network Live", status: "completed" },
      { date: "2026-09-00", title: "Household Smart Meter Installation", status: "in-progress" },
      { date: "2027-03-31", title: "SCADA Control Center Integration", status: "pending" }
    ]
  },
  {
    id: "PRJ-2026-004",
    name: "TAKLI MIDC 5MW Rooftop & Ground Solar Park",
    department: "Renewable Energy & Power",
    ward: "Ward 5 - MIDC Zone",
    budget: 54000000, // INR 5.4 Cr
    spent: 54000000,
    progress: 100,
    startDate: "2024-08-01",
    endDate: "2026-02-28",
    status: "Completed",
    contractor: "MahaSolar CleanGrid",
    engineer: "Er. Anand Varma",
    description: "Grid-connected 5 MegaWatt solar photovoltaic station powering public streetlights and municipal pump stations.",
    coordinates: [19.8790, 74.4610],
    documentsCount: 11,
    photosCount: 18,
    timeline: [
      { date: "2024-08-01", title: "Land Site Preparation", status: "completed" },
      { date: "2025-01-15", title: "Solar Panel Framing & Inverter Cabling", status: "completed" },
      { date: "2025-09-10", title: "Grid Interconnection Substation Setup", status: "completed" },
      { date: "2026-02-28", title: "Full Commercial Operations Commenced", status: "completed" }
    ]
  },
  {
    id: "PRJ-2026-005",
    name: "Yesgaon Multi-Modal Logistics & Cold Chain Yard",
    department: "Town Planning & Industry",
    ward: "Ward 4 - Yesgaon Bypass",
    budget: 95000000, // INR 9.5 Cr
    spent: 19000000,
    progress: 20,
    startDate: "2026-01-15",
    endDate: "2027-12-20",
    status: "Planning",
    contractor: "Apex Infra Projects",
    engineer: "Er. Vijay Tambe",
    description: "22-acre modern logistic hub featuring 10,000 MT temperature-controlled cold storage for agricultural produce.",
    coordinates: [19.8830, 74.4880],
    documentsCount: 5,
    photosCount: 3,
    timeline: [
      { date: "2026-01-15", title: "Zoning Clearance & Environment Audit", status: "completed" },
      { date: "2026-05-10", title: "Master Layout & Tender Finalization", status: "in-progress" },
      { date: "2026-11-01", title: "Earthwork & Boundary Enclosure", status: "pending" }
    ]
  },
  {
    id: "PRJ-2026-006",
    name: "Subhash Road Heritage Market Beautification",
    department: "Town Planning & Heritage",
    ward: "Ward 7 - Subhash Road",
    budget: 28000000, // INR 2.8 Cr
    spent: 24000000,
    progress: 88,
    startDate: "2025-03-01",
    endDate: "2026-09-30",
    status: "Ongoing",
    contractor: "Heritage Craft Builders",
    engineer: "Er. Sneha Borse",
    description: "Pedestrianization of central market street, underground utility cabling, unified shop facade signages, and cobblestone pathways.",
    coordinates: [19.8900, 74.4760],
    documentsCount: 7,
    photosCount: 12,
    timeline: [
      { date: "2025-03-01", title: "Underground Cable Ducting Completed", status: "completed" },
      { date: "2025-10-15", title: "Cobblestone Laying & Heritage Lamps", status: "completed" },
      { date: "2026-04-10", title: "Uniform Shop Front Facade Retrofit", status: "in-progress" }
    ]
  }
];

// Citizen Complaints Mock Data
export const MOCK_COMPLAINTS = [
  {
    id: "CMP-2026-8901",
    title: "Severe Asphalt Potholes on Tilak Road Junction",
    category: "Road Damage",
    ward: "Ward 3 - Laxmi Nagar",
    location: "Near Laxmi Narayan Temple, Tilak Road",
    coordinates: [19.8882, 74.4741],
    reportedDate: "2026-08-02",
    status: "In Progress",
    priority: "High",
    reporterName: "Rajendra Joshi",
    reporterContact: "+91 98220 *****",
    description: "Large 2-foot wide pothole causing severe traffic slowdowns and two-wheeler accidents during monsoon rains.",
    assignedDept: "Public Works Department",
    upvotes: 42
  },
  {
    id: "CMP-2026-8902",
    title: "Drinking Water Pipeline Leakage & Low Pressure",
    category: "Water Leakage",
    ward: "Ward 1 - Sangamner Naka",
    location: "Station Road Lane 4",
    coordinates: [19.8942, 74.4755],
    reportedDate: "2026-08-04",
    status: "Pending",
    priority: "Medium",
    reporterName: "Sunita Gade",
    reporterContact: "+91 94231 *****",
    description: "Clean water leaking onto public road for 3 consecutive days. Surrounding households receiving low pressure.",
    assignedDept: "Water Supply Dept",
    upvotes: 19
  },
  {
    id: "CMP-2026-8903",
    title: "Uncollected Commercial Waste Near Samvatsar Gate",
    category: "Garbage",
    ward: "Ward 6 - Samvatsar Border",
    location: "Samvatsar Agri Market Entry",
    coordinates: [19.8995, 74.4940],
    reportedDate: "2026-08-06",
    status: "Resolved",
    priority: "High",
    reporterName: "Mahesh Thorat",
    reporterContact: "+91 97630 *****",
    description: "Vegetable waste pile accumulation causing bad odor and pest breeding.",
    assignedDept: "Solid Waste Management",
    upvotes: 35
  },
  {
    id: "CMP-2026-8904",
    title: "Non-Functional LED Streetlights on Bypass Road",
    category: "Street Light",
    ward: "Ward 4 - Yesgaon Bypass",
    location: "Yesgaon Flyover Approach Road",
    coordinates: [19.8845, 74.4862],
    reportedDate: "2026-08-01",
    status: "In Progress",
    priority: "Medium",
    reporterName: "Prakash Shinde",
    reporterContact: "+91 98902 *****",
    description: "Dark stretch of 800 meters leading to safety hazards for night commuters.",
    assignedDept: "Electrical Department",
    upvotes: 28
  },
  {
    id: "CMP-2026-8905",
    title: "Open Stormwater Drain Chamber Without Cover",
    category: "Drainage",
    ward: "Ward 5 - MIDC Zone",
    location: "Takli Road near School Gate",
    coordinates: [19.8798, 74.4635],
    reportedDate: "2026-08-05",
    status: "Pending",
    priority: "Critical",
    reporterName: "Kavita Salunke",
    reporterContact: "+91 91580 *****",
    description: "Concrete cover broken off drain box near primary school entrance. Immediate hazard for children.",
    assignedDept: "Drainage Maintenance",
    upvotes: 56
  },
  {
    id: "CMP-2026-8906",
    title: "Unauthorized Construction Encroaches Public Footpath",
    category: "Illegal Construction",
    ward: "Ward 7 - Subhash Road",
    location: "Subhash Road Market Plot 45",
    coordinates: [19.8905, 74.4768],
    reportedDate: "2026-07-28",
    status: "Under Review",
    priority: "Medium",
    reporterName: "Anil Wagh",
    reporterContact: "+91 94222 *****",
    description: "Commercial shop extension extending 6 feet onto municipal sidewalk blockading pedestrian movement.",
    assignedDept: "Anti-Encroachment Cell",
    upvotes: 14
  }
];

// Land Use Zoning & AI Analysis Plots
export const MOCK_LAND_PLOTS = [
  {
    id: "PLOT-KPG-01",
    name: "Godavari Riverside Buffer Zone Plot 12",
    ward: "Ward 2 - Riverbank",
    areaAcres: 14.5,
    currentUsage: "Vacant Govt Land",
    recommendedUsage: "Eco Tourism & Public Park",
    category: "Green Zone",
    roadConnectivity: 92, // %
    waterAvailability: 98, // %
    electricityScore: 85,
    aiSuitabilityScore: 94,
    coordinates: [19.8990, 74.4845],
    aiAnalysis: "Highly recommended for non-permanent eco-tourism park due to 100-yr flood buffer regulations. High soil moisture retention and scenic riverfront vista."
  },
  {
    id: "PLOT-KPG-02",
    name: "Sangamner Naka Commercial Extension",
    ward: "Ward 1 - Sangamner Naka",
    areaAcres: 8.2,
    currentUsage: "Unorganized Parking",
    recommendedUsage: "Multi-Level Smart Commercial Complex",
    category: "Commercial",
    roadConnectivity: 99,
    waterAvailability: 88,
    electricityScore: 95,
    aiSuitabilityScore: 91,
    coordinates: [19.8945, 74.4760],
    aiAnalysis: "Prime transit junction with high footfall. Ideal for multi-modal transport hub + retail complex with underground EV charging station."
  },
  {
    id: "PLOT-KPG-03",
    name: "Takli Road MIDC Plot 84",
    ward: "Ward 5 - MIDC Zone",
    areaAcres: 24.0,
    currentUsage: "Barren Agricultural",
    recommendedUsage: "Solar Assembly & Green Tech Park",
    category: "Industrial",
    roadConnectivity: 86,
    waterAvailability: 75,
    electricityScore: 98,
    aiSuitabilityScore: 89,
    coordinates: [19.8770, 74.4590],
    aiAnalysis: "Adjacent to 132kV substation with high solar irradiance (5.8 kWh/m²/day). Low agricultural yield value makes industrial conversion optimal."
  },
  {
    id: "PLOT-KPG-04",
    name: "Tilak Road Urban Renewal Pocket B",
    ward: "Ward 3 - Laxmi Nagar",
    areaAcres: 5.4,
    currentUsage: "Dilapidated Municipal Quarters",
    recommendedUsage: "High-Density Affordable Housing (PMAY)",
    category: "Residential",
    roadConnectivity: 90,
    waterAvailability: 92,
    electricityScore: 90,
    aiSuitabilityScore: 87,
    coordinates: [19.8860, 74.4715],
    aiAnalysis: "Surrounded by schools and medical centers. Zoning permits vertical residential development up to FSI 2.5."
  }
];

// Document Vault Mock Data
export const MOCK_DOCUMENTS = [
  {
    id: "DOC-2026-001",
    title: "Kopargaon Master Development Plan 2025-2045 (GIS Map)",
    category: "Development Plan",
    fileType: "PDF",
    size: "48.5 MB",
    author: "Town Planning Dept, Maharashtra State",
    date: "2025-01-10",
    downloads: 340,
    summary: "Comprehensive land use zoning, road hierarchy, and environmental reserve contours for Kopargaon urban limits."
  },
  {
    id: "DOC-2026-002",
    title: "Detailed Project Report (DPR) - Godavari Riverfront Promenade",
    category: "DPR",
    fileType: "PDF",
    size: "18.2 MB",
    author: "Hydraulic & Urban Infra Consultants",
    date: "2025-03-22",
    downloads: 185,
    summary: "Engineering designs, flood hydrology simulations, bill of quantities (BOQ), and environmental impact assessment."
  },
  {
    id: "DOC-2026-003",
    title: "Kopargaon Ward-wise Cadastral Land Survey 2026",
    category: "Land Survey",
    fileType: "ZIP / GeoJSON",
    size: "124.0 MB",
    author: "Survey of India & Municipal Survey Cell",
    date: "2026-02-14",
    downloads: 512,
    summary: "High-resolution drone LiDAR plot boundaries, elevation contours, and municipal tax assessment layers."
  },
  {
    id: "DOC-2026-004",
    title: "Smart Water Supply & 24x7 Metering Tender Document",
    category: "Project Tender",
    fileType: "PDF",
    size: "6.8 MB",
    author: "Kopargaon Municipal Tender Board",
    date: "2025-08-05",
    downloads: 98,
    summary: "Request for Proposal (RFP), technical specifications, and SLA terms for ultrasonic smart water meters."
  },
  {
    id: "DOC-2026-005",
    title: "City Environmental & Air Quality Audit Report Q2 2026",
    category: "Infrastructure Report",
    fileType: "PDF",
    size: "4.1 MB",
    author: "State Pollution Control Board",
    date: "2026-07-01",
    downloads: 120,
    summary: "PM2.5, PM10, Godavari water quality index (WQI), and noise level measurements across 6 monitoring stations."
  }
];

// AI Suggested Prompts & Responses
export const AI_SUGGESTED_PROMPTS = [
  "Find suitable hospital location in Ward 3",
  "Optimize road network to reduce Sangamner Naka traffic congestion",
  "Analyze unused land along Godavari River bank",
  "Suggest green zones and eco-parks for Kopargaon",
  "Prioritize development projects based on budget efficiency"
];

export const AI_MOCK_RESPONSES = {
  hospital: {
    title: "Optimal Healthcare Facility Placement Analysis",
    recommendation: "Ward 3 (Laxmi Nagar / Tilak Road Sector)",
    rationale: "Ward 3 exhibits the highest population density (8,809 / km²) with a 1.8 km gap to the nearest multispecialty emergency trauma unit.",
    suggestedCoordinates: "19.8870 N, 74.4720 E (Municipal Reserve Plot 14B)",
    estimatedCost: "INR 12.5 Cr",
    keyBenefits: [
      "Serves 18,500+ residents within a 5-minute ambulance response window",
      "Direct frontage to 24m wide DP road",
      "Existing water supply pipeline high-pressure junction"
    ]
  },
  traffic: {
    title: "Sangamner Naka Traffic Flow Optimization Strategy",
    recommendation: "Adaptive Signal Timing + Left-Turn Slip Lane Construction",
    rationale: "Peak hour traffic bottleneck caused by heavy freight vehicles exiting NH-160 toward Takli MIDC.",
    suggestedCoordinates: "19.8935 N, 74.4740 E",
    estimatedCost: "INR 1.8 Cr",
    keyBenefits: [
      "Reduces average vehicle delay by 34%",
      "Cuts carbon emissions at idling intersection by 18 Tons/year",
      "Separates agricultural tractor traffic from intercity buses"
    ]
  },
  default: {
    title: "Kopargaon AI Urban Intelligence System Report",
    recommendation: "Multi-Criteria Spatial Land Utilization Plan",
    rationale: "Analysis generated using Kopargaon spatial vector layers, ward demographic density, and flood risk buffers.",
    suggestedCoordinates: "19.8917 N, 74.4789 E",
    estimatedCost: "Project Specific",
    keyBenefits: [
      "Data-backed spatial decision making for municipal councilors",
      "Automated compliance check against Maharashtra Town Planning Act",
      "Real-time integration with citizen grievance hotspots"
    ]
  }
};
