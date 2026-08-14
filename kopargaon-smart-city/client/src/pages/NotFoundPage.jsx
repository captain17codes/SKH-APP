import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Home, Building2 } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="p-4 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Building2 className="w-12 h-12" />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">404 Page Not Found</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Kopargaon GIS Resource Unavailable</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The requested page, project specification, or spatial coordinate route does not exist or has been relocated.
        </p>
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>

        <Link
          to="/dashboard"
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
