import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Er. Rajan Patel',
    email: 'rajan.patel@kopargaon.gov.in',
    role: 'Administrator', // 'Administrator', 'GIS Planner', 'Municipal Officer', 'Citizen'
    department: 'Town Planning & GIS Governance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    token: 'mock-jwt-token-kopargaon-2026'
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = (role = 'Administrator', credentials = {}) => {
    let name = 'Er. Rajan Patel';
    let dept = 'Town Planning & GIS Governance';

    if (role === 'Citizen') {
      name = 'Aniket Sharma (Citizen)';
      dept = 'Citizen Services & Grievance Governance';
    } else if (role === 'Business') {
      name = 'Vikram Shah (Business Investor)';
      dept = 'Commercial & Site Intelligence Division';
    }

    setUser({
      name: credentials.name || name,
      email: credentials.email || `${role.toLowerCase().replace(' ', '.')}@kopargaon.gov.in`,
      role: role,
      department: dept,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      token: 'mock-jwt-token-kopargaon-2026'
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const switchRole = (newRole) => {
    setUser(prev => ({
      ...prev,
      role: newRole
    }));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
