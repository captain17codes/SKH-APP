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

  // Normalize role matching (Admin <-> Administrator)
  const userRole = user.role || '';
  const normalizedUserRole = userRole === 'Admin' ? 'Administrator' : userRole;

  const hasPermission = !allowedRoles || allowedRoles.some(role => {
    const normalizedAllowed = role === 'Admin' ? 'Administrator' : role;
    return userRole === role || normalizedUserRole === normalizedAllowed;
  });

  if (!hasPermission) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Glassmorphism Card */}
        <div className="relative z-10 max-w-lg w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-10 rounded-3xl shadow-2xl shadow-rose-900/20 text-center flex flex-col items-center transform transition-all animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-rose-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-rose-500 to-rose-700 p-4 rounded-2xl shadow-lg border border-rose-400/30">
              <ShieldAlert className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Access Restricted
          </h1>
          
          <p className="text-slate-400 mb-8 leading-relaxed">
            You don't have the necessary clearance to view this module. 
            This area requires <span className="font-semibold text-slate-300">{allowedRoles.join(' or ')}</span> privileges, 
            but you are currently signed in as <span className="font-semibold text-rose-400">{user.role}</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row w-full gap-4 mt-2">
            <button 
              onClick={() => {
                if (userRole === 'Citizen') window.location.href = '/citizen/dashboard';
                else if (userRole === 'Business') window.location.href = '/business/dashboard';
                else window.location.href = '/dashboard';
              }}
              className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Return to Dashboard
            </button>
            <button 
              onClick={() => {
                // Ensure auth context is available for logout, or use hard redirect
                window.location.href = '/login';
                localStorage.removeItem('kopargaon-auth-token');
              }}
              className="flex-1 py-3 px-4 bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-slate-500 text-sm font-bold rounded-xl transition-all"
            >
              Sign in to another account
            </button>
          </div>
        </div>

        {/* Footer text */}
        <div className="absolute bottom-8 text-slate-600 text-xs tracking-widest uppercase font-semibold">
          Kopargaon Smart City • Secure Gateway
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
