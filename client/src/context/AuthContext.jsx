import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user } = await authService.me();
        setUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const switchRole = (newRole) => {
    setUser(prev => ({
      ...prev,
      role: newRole
    }));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
