import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize: DB stores 'Admin' but frontend routes use 'Administrator'
  const normalizedRole = user.role === 'Admin' ? 'Administrator' : user.role;

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md">
          You do not have the required permissions ({allowedRoles.join(', ')}) to view this page.
          You are currently logged in as a {user.role}.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
