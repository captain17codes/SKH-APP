// In-memory mock database for users since no real DB is configured
// Schema: id, name, email (nullable), phone (nullable, unique when present), google_id (nullable, unique when present), role ('citizen' | 'business' | 'admin'), phone_verified (boolean), created_at

export const users = [
  // Pre-seeded Admin User
  {
    id: 'USR-ADMIN-01',
    name: 'Er. Rajan Patel',
    email: 'admin@kopargaon.gov.in',
    password: 'admin', // Simple plain text for mock demo purpose
    phone: null,
    google_id: null,
    role: 'Administrator',
    phone_verified: true,
    created_at: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    department: 'Town Planning & GIS Governance'
  },
  // Pre-seeded Business User
  {
    id: 'USR-BUS-01',
    name: 'Vikram Shah',
    email: 'business@gmail.com',
    password: 'business',
    phone: null,
    google_id: null,
    role: 'Business',
    phone_verified: true,
    created_at: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    department: 'Commercial & Site Intelligence Division'
  }
];

export const userModel = {
  findUserById: (id) => users.find((u) => u.id === id),
  findUserByEmail: (email) => users.find((u) => u.email === email),
  findUserByPhone: (phone) => users.find((u) => u.phone === phone),
  findUserByGoogleId: (googleId) => users.find((u) => u.google_id === googleId),
  
  createUser: (userData) => {
    const newUser = {
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: userData.name || 'Unknown User',
      email: userData.email || null,
      phone: userData.phone || null,
      google_id: userData.google_id || null,
      role: userData.role || 'Citizen',
      phone_verified: userData.phone_verified || false,
      created_at: new Date().toISOString(),
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    };
    users.push(newUser);
    return newUser;
  }
};
