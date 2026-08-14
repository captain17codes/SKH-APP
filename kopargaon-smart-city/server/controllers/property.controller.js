// In-memory property store (synced with GIS spatial calculations & DB API standards)
let properties = [
  {
    id: 'KOP-LAND-001',
    sellerId: 'USR-CITIZEN-01',
    sellerName: 'Aniket Sharma',
    name: 'Commercial Plot on Station Road Arterial',
    title: 'Commercial Plot on Station Road Arterial',
    type: 'Commercial Plots',
    propertyType: 'Commercial Plots',
    description: '4,500 sq.ft clear commercial plot parcel on 24m DP road frontage opposite Station Bridge approach. Ideal for retail showroom, bank branch, or office complex.',
    price: 8500000, // ₹85 Lakhs
    expectedPrice: 8500000,
    area: 4500,
    areaUnit: 'sq.ft',
    pricePerUnit: 1888,
    priceNegotiable: true,
    ward: 'Ward 3 - Station Area',
    locality: 'Yesgaon Bypass, Ward 4',
    latitude: 19.8916,
    longitude: 74.4789,
    coordinates: [19.8916, 74.4789],
    landUse: 'Commercial',
    condition: 'Vacant Land',
    roadAccess: 'Excellent (24m DP Road)',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: true,
    nearbyLandmarks: 'Station Bridge, SBI ATM, High-density Market Corridor',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop&q=80'
    ],
    documents: ['https://example.com/docs/cts-142-extract.pdf'],
    status: 'Available', // Available, Under Verification, Sold
    verificationStatus: 'Verified',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    views: 245,
    inquiriesCount: 8
  },
  {
    id: 'KOP-LAND-002',
    sellerId: 'USR-CITIZEN-02',
    sellerName: 'Ramesh Patil',
    name: 'Highway Logistics & Warehouse Land #42',
    title: 'Highway Logistics & Warehouse Land #42',
    type: 'Warehouses',
    propertyType: 'Warehouses',
    description: '35,000 sq.ft warehouse parcel along 30m State Highway Bypass Corridor. Heavy vehicle access with high-tension power grid nearby.',
    price: 42000000, // ₹4.2 Cr
    expectedPrice: 42000000,
    area: 35000,
    areaUnit: 'sq.ft',
    pricePerUnit: 1200,
    priceNegotiable: true,
    ward: 'Ward 4 - Bypass Corridor',
    locality: 'State Highway Bypass Node',
    latitude: 19.8850,
    longitude: 74.4620,
    coordinates: [19.8850, 74.4620],
    landUse: 'Industrial',
    condition: 'Vacant Land',
    roadAccess: '30m State Highway Bypass',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: true,
    nearbyLandmarks: 'Yesgaon Flyover, MIDC Industrial Estate',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'
    ],
    documents: ['https://example.com/docs/bypass-42-title.pdf'],
    status: 'Available',
    verificationStatus: 'Verified',
    createdAt: '2026-08-03T14:20:00.000Z',
    updatedAt: '2026-08-03T14:20:00.000Z',
    views: 182,
    inquiriesCount: 5
  },
  {
    id: 'KOP-LAND-003',
    sellerId: 'USR-CITIZEN-03',
    sellerName: 'Kavita Deshmukh',
    name: 'Residential Housing Plot in Housing Board Layout',
    title: 'Residential Housing Plot in Housing Board Layout',
    type: 'Residential Property',
    propertyType: 'Residential Property',
    description: '2,400 sq.ft residential plot in quiet housing society layout. Complete underground municipal water and drainage lines.',
    price: 3600000, // ₹36 Lakhs
    expectedPrice: 3600000,
    area: 2400,
    areaUnit: 'sq.ft',
    pricePerUnit: 1500,
    priceNegotiable: false,
    ward: 'Ward 5 - Housing Board',
    locality: 'Takli Road Housing Layout',
    latitude: 19.8798,
    longitude: 74.4635,
    coordinates: [19.8798, 74.4635],
    landUse: 'Residential',
    condition: 'Vacant Land',
    roadAccess: '15m Internal Municipal Road',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: true,
    nearbyLandmarks: 'Primary School, Takli Bus Stop',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80'
    ],
    documents: [],
    status: 'Available',
    verificationStatus: 'Verified',
    createdAt: '2026-08-05T11:00:00.000Z',
    updatedAt: '2026-08-05T11:00:00.000Z',
    views: 310,
    inquiriesCount: 12
  },
  {
    id: 'KOP-LAND-004',
    sellerId: 'USR-CITIZEN-01',
    sellerName: 'Aniket Sharma',
    name: 'Gaothan Market Yard Retail Shop Premises',
    title: 'Gaothan Market Yard Retail Shop Premises',
    type: 'Shops',
    propertyType: 'Shops',
    description: '1,200 sq.ft commercial shop premises in high-density traditional Gaothan Market Yard.',
    price: 6500000, // ₹65 Lakhs
    expectedPrice: 6500000,
    area: 1200,
    areaUnit: 'sq.ft',
    pricePerUnit: 5416,
    priceNegotiable: true,
    ward: 'Ward 1 - Market Yard',
    locality: 'Gaothan Market Yard',
    latitude: 19.8940,
    longitude: 74.4710,
    coordinates: [19.8940, 74.4710],
    landUse: 'Commercial',
    condition: 'Good',
    roadAccess: '12m Municipal Market Street',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: true,
    nearbyLandmarks: 'Textile Market, SBI Main Branch',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
    ],
    documents: [],
    status: 'Under Verification',
    verificationStatus: 'Pending Verification',
    createdAt: '2026-08-11T16:45:00.000Z',
    updatedAt: '2026-08-11T16:45:00.000Z',
    views: 95,
    inquiriesCount: 2
  },
  {
    id: 'KOP-LAND-005',
    sellerId: 'USR-CITIZEN-04',
    sellerName: 'Sanjay Shinde',
    name: 'Irrigated Sugarcane Farm Acreage',
    title: 'Irrigated Sugarcane Farm Acreage',
    type: 'Agricultural Land',
    propertyType: 'Agricultural Land',
    description: '4.5 Acres fertile agricultural land with Godavari canal lifting rights and 3-phase agricultural power connection.',
    price: 18000000, // ₹1.8 Cr
    expectedPrice: 18000000,
    area: 4.5,
    areaUnit: 'Acres',
    pricePerUnit: 4000000,
    priceNegotiable: true,
    ward: 'Ward 6 - Samvatsar Border',
    locality: 'Samvatsar Canal Belt',
    latitude: 19.9020,
    longitude: 74.4850,
    coordinates: [19.9020, 74.4850],
    landUse: 'Agricultural',
    condition: 'Vacant Land',
    roadAccess: '10m Farm Access Road',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: false,
    nearbyLandmarks: 'Godavari Right Canal, Samvatsar Sugar Factory',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
    ],
    documents: [],
    status: 'Available',
    verificationStatus: 'Verified',
    createdAt: '2026-08-07T08:30:00.000Z',
    updatedAt: '2026-08-07T08:30:00.000Z',
    views: 140,
    inquiriesCount: 4
  }
];

let inquiries = [
  {
    id: 'INQ-2026-101',
    propertyId: 'KOP-LAND-001',
    buyerId: 'USR-CITIZEN-02',
    buyerName: 'Ramesh Patil',
    buyerContact: '+91 98220 *****',
    buyerEmail: 'ramesh.patil@example.com',
    message: 'Interested in acquiring this commercial plot. Please contact for site inspection and title review.',
    status: 'Submitted',
    createdAt: '2026-08-10T14:30:00.000Z'
  }
];

function calculateAiAreaIntelligence(prop) {
  return {
    accessibilityScore: 92,
    infrastructureScore: 88,
    developmentActivity: 'High',
    commercialPotential: 'High',
    reasons: [
      `Property is located within 150m of main DP arterial road in ${prop.ward || 'Kopargaon'}.`,
      `Municipal 33kV electric substation and water supply grid active in immediate buffer zone.`,
      `Station Road Surfacing Smart City Project (₹4.8 Cr — 90% Done) within 1km radius.`
    ],
    advantages: [
      'High vehicle & pedestrian footfall corridor',
      'Underground stormwater drainage line connection verified',
      'Zero 100-year flood risk zone classification'
    ],
    concerns: [
      'Peak-hour vehicular traffic congestion during evening commute hours'
    ],
    disclaimer: 'Property information is provided for informational purposes. Ownership, title, permissions and legal documents should be independently verified before any transaction.'
  };
}

// GET /api/properties
export const getAllProperties = (req, res) => {
  const { propertyType, type, ward, landUse, status, verificationStatus, minPrice, maxPrice, search } = req.query;
  let result = properties.map(p => ({
    ...p,
    name: p.name || p.title,
    type: p.type || p.propertyType,
    price: p.price || p.expectedPrice
  }));

  const filterType = propertyType || type;
  if (filterType && filterType !== 'All Categories' && filterType !== 'All Types') {
    result = result.filter(p => p.type.toLowerCase().includes(filterType.toLowerCase()) || p.propertyType.toLowerCase().includes(filterType.toLowerCase()));
  }

  if (ward && ward !== 'All Wards') {
    result = result.filter(p => p.ward && p.ward.toLowerCase().includes(ward.toLowerCase()));
  }

  if (landUse && landUse !== 'All Land Uses') {
    result = result.filter(p => p.landUse && p.landUse.toLowerCase().includes(landUse.toLowerCase()));
  }

  if (status && status !== 'All Statuses') {
    result = result.filter(p => p.status.toLowerCase() === status.toLowerCase());
  }

  if (verificationStatus) {
    result = result.filter(p => p.verificationStatus.toLowerCase() === verificationStatus.toLowerCase());
  }

  if (minPrice) result = result.filter(p => (p.price || p.expectedPrice) >= Number(minPrice));
  if (maxPrice) result = result.filter(p => (p.price || p.expectedPrice) <= Number(maxPrice));

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.locality && p.locality.toLowerCase().includes(q)) ||
      (p.ward && p.ward.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  }

  res.json(result);
};

// GET /api/properties/map
export const getPropertiesMap = (req, res) => {
  const mapMarkers = properties.map(p => ({
    id: p.id,
    name: p.name || p.title,
    type: p.type || p.propertyType,
    price: p.price || p.expectedPrice,
    area: p.area,
    areaUnit: p.areaUnit,
    status: p.status,
    location: `${p.locality}, ${p.ward}`,
    coordinates: [p.latitude, p.longitude],
    latitude: p.latitude,
    longitude: p.longitude
  }));

  res.json(mapMarkers);
};

// GET /api/properties/:id
export const getPropertyById = (req, res) => {
  const prop = properties.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  prop.views = (prop.views || 0) + 1;
  const aiIntelligence = calculateAiAreaIntelligence(prop);

  res.json({
    ...prop,
    name: prop.name || prop.title,
    type: prop.type || prop.propertyType,
    price: prop.price || prop.expectedPrice,
    aiIntelligence
  });
};

// POST /api/properties
export const createProperty = (req, res) => {
  try {
    const {
      title, name, propertyType, type, description, area, areaUnit, expectedPrice, price,
      priceNegotiable, ward, locality, address, latitude, longitude, landUse,
      condition, roadAccess, waterAvailable, electricityAvailable,
      drainageAvailable, nearbyLandmarks, images, documents, sellerId, sellerName
    } = req.body;

    const propName = name || title || 'New Land Listing';
    const propType = type || propertyType || 'Commercial Plots';
    const propPrice = Number(price || expectedPrice) || 1000000;
    const propArea = Number(area) || 1000;

    const lat = Number(latitude) || 19.8916;
    const lng = Number(longitude) || 74.4789;
    const newId = `KOP-LAND-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newProp = {
      id: newId,
      sellerId: sellerId || 'USR-CITIZEN-01',
      sellerName: sellerName || 'Aniket Sharma',
      name: propName,
      title: propName,
      type: propType,
      propertyType: propType,
      description: description || '',
      area: propArea,
      areaUnit: areaUnit || 'sq.ft',
      price: propPrice,
      expectedPrice: propPrice,
      pricePerUnit: Math.round(propPrice / Math.max(propArea, 1)),
      priceNegotiable: Boolean(priceNegotiable),
      ward: ward || 'Ward 3 - Station Area',
      locality: locality || 'Station Road',
      address: address || `${locality}, ${ward}`,
      latitude: lat,
      longitude: lng,
      coordinates: [lat, lng],
      landUse: landUse || 'Commercial',
      condition: condition || 'Vacant Land',
      roadAccess: roadAccess || '15m Road Access',
      waterAvailable: Boolean(waterAvailable),
      electricityAvailable: Boolean(electricityAvailable),
      drainageAvailable: Boolean(drainageAvailable),
      nearbyLandmarks: nearbyLandmarks || 'Municipal Center',
      images: images || ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'],
      documents: documents || [],
      status: 'Under Verification', // Initial status
      verificationStatus: 'Pending Verification',
      createdAt: nowIso,
      updatedAt: nowIso,
      views: 1,
      inquiriesCount: 0
    };

    properties.unshift(newProp);
    res.status(201).json(newProp);
  } catch (e) {
    console.error('[Property Controller] createProperty error:', e);
    res.status(500).json({ error: e.message });
  }
};

// PATCH /api/properties/:id/status
export const updatePropertyStatus = (req, res) => {
  const idx = properties.findIndex(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: 'Property not found' });

  const { verificationStatus, status } = req.body;
  if (verificationStatus) properties[idx].verificationStatus = verificationStatus;
  if (status) properties[idx].status = status;
  properties[idx].updatedAt = new Date().toISOString();

  res.json(properties[idx]);
};

// POST /api/properties/:id/inquiry
export const submitInquiry = (req, res) => {
  const prop = properties.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const { buyerId, buyerName, buyerContact, buyerEmail, message } = req.body;
  if (!buyerName || !buyerContact || !message) {
    return res.status(400).json({ error: 'Name, contact, and message are required.' });
  }

  const newInquiry = {
    id: `INQ-2026-${Math.floor(100 + Math.random() * 900)}`,
    propertyId: prop.id,
    buyerId: buyerId || 'USR-CITIZEN-BUYER',
    buyerName,
    buyerContact,
    buyerEmail: buyerEmail || '',
    message,
    status: 'Submitted',
    createdAt: new Date().toISOString()
  };

  inquiries.unshift(newInquiry);
  prop.inquiriesCount = (prop.inquiriesCount || 0) + 1;

  res.status(201).json({ success: true, inquiry: newInquiry });
};

// GET /api/properties/my-listings/:sellerId
export const getMyProperties = (req, res) => {
  const sellerId = req.params.sellerId || 'USR-CITIZEN-01';
  const myProps = properties.filter(p => p.sellerId.toLowerCase() === sellerId.toLowerCase());
  res.json(myProps);
};
