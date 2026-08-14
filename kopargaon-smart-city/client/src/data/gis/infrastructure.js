// Kopargaon Infrastructure & Civic Asset GIS Features
export const INFRASTRUCTURE_GIS_DATA = {
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
    { id: 'gl1', name: 'Kopargaon Municipal Council HQ Plot', lat: 19.8912, lng: 74.4778, areaAcres: 6.5, designation: 'Civic Administrative', status: 'Utilized', ward: 'Ward 1' },
    { id: 'gl2', name: 'Old Grain Storage Land (Godavari Bank)', lat: 19.8995, lng: 74.4850, areaAcres: 14.2, designation: 'Proposed Eco Park', status: 'Vacant', ward: 'Ward 2' },
    { id: 'gl3', name: 'Yesgaon Bypass Transport Hub Reserve', lat: 19.8830, lng: 74.4880, areaAcres: 22.0, designation: 'Logistics Park', status: 'Planning', ward: 'Ward 4' }
  ],
  waterPipeline: [
    { id: 'wp1', name: 'Main Godavari Intake Pipeline', coords: [[19.9010, 74.4840], [19.8930, 74.4790], [19.8850, 74.4700]], diameter: '600 mm', status: 'Active', ward: 'Ward 2' },
    { id: 'wp2', name: 'MIDC Takli Supply Corridor', coords: [[19.8850, 74.4700], [19.8790, 74.4610]], diameter: '450 mm', status: 'Active', ward: 'Ward 5' }
  ],
  drainage: [
    { id: 'dr1', name: 'North Trunk Sewer Line', coords: [[19.8970, 74.4720], [19.8910, 74.4770], [19.8860, 74.4820]], status: 'Normal', ward: 'Ward 1' },
    { id: 'dr2', name: 'Tilak Road Stormwater Channel', coords: [[19.8890, 74.4690], [19.8820, 74.4750]], status: 'Desilting Required', ward: 'Ward 3' }
  ],
  electricity: [
    { id: 'el1', name: '132kV Kopargaon Main MSEDCL Substation', lat: 19.8810, lng: 74.4670, capacity: '132/33 kV', status: 'Operational', ward: 'Ward 5' },
    { id: 'el2', name: '33kV Sangamner Naka Distribution Feeder', lat: 19.8960, lng: 74.4760, capacity: '33/11 kV', status: 'Operational', ward: 'Ward 1' }
  ],
  floodRisk: [
    { id: 'fr1', name: 'Godavari River 100-Yr Flood Zone', bounds: [[19.8960, 74.4730], [19.9040, 74.4920]], riskLevel: 'High', description: 'Mandatory 100m buffer zone along riverbank', ward: 'Ward 2' }
  ]
};

export default INFRASTRUCTURE_GIS_DATA;
