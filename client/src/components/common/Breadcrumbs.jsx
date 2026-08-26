import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

import { useTranslation } from '../../context/LanguageContext';

const Breadcrumbs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap = {
    dashboard: t('dashboard'),
    gis: t('gisSmartMap'),
    projects: t('projects'),
    'land-use': t('landUsePlanning'),
    complaints: t('citizenComplaints'),
    analytics: t('analytics'),
    'ai-planner': t('aiUrbanPlanner'),
    documents: t('documents'),
    settings: t('settings'),
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        {t('portalHome')}
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[name] || (name.startsWith('PRJ') || name.startsWith('CMP') ? name : name.charAt(0).toUpperCase() + name.slice(1));

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
