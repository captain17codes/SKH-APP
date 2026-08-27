import React from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: 'dashboard' },
    { path: '/gis', label: t('gisSmartMap'), icon: 'map', badge: t('liveGis') },
    { path: '/projects', label: t('projects'), icon: 'engineering' },
    { path: '/scenarios', label: 'WHAT-IF Scenarios', icon: 'difference', badge: 'New' },
    { path: '/land-use', label: t('landUsePlanning'), icon: 'layers' },
    { path: '/complaints', label: t('citizenComplaints'), icon: 'forum', badge: `6 ${t('new')}` },
    { path: '/analytics', label: t('analytics'), icon: 'monitoring' },
    { path: '/ai-planner', label: t('aiUrbanPlanner'), icon: 'psychology', badge: t('ai20') },
    { path: '/documents', label: t('documents'), icon: 'description' },
    { path: '/settings', label: t('settings'), icon: 'settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="sidebar-overlay active lg:hidden"
          style={{ zIndex: 40 }}
        />
      )}

      <aside
        className={`bg-surface dark:bg-inverse-surface font-label-md text-label-md fixed left-0 top-0 h-full w-[260px] border-r border-outline-variant dark:border-outline flex flex-col py-6 px-4 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 mb-8 px-2">
          <div className="flex items-center gap-3">
            <img 
              alt="Kopargaon Seal" 
              className="w-10 h-10 object-contain rounded-md" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeJKJKEYB5sGO8Gu7veqqWWmM_I8w9BGoCyCS0yZwWWXlHRbRs6BGa_yztOEhB0H7XZAy0T28yOrafsgHE_SNAi7qOxbO1Byj5_6iYhsvAwKPz5BfjFlu5MGvIAKxJOiEidkYVPOs4-AwpcAQz4Oap2TguGCZRU4d0ray4AYG9uQDiZ1wci6k8G-1TCFxQADjIu2rKNxfcfV4sHOwo5yRHJMqaTdW1-B8XkMW7LzSG54NoSt_PLAzbjg"
            />
            <div>
              <h1 className="font-title-lg text-title-lg font-bold text-primary dark:text-primary-fixed-dim leading-tight">
                Kopargaon Smart City
              </h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant dark:text-on-surface-variant">
                Municipal Portal
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-primary lg:hidden transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-r-lg border-l-4 transition-all duration-200 ease-in-out nav-link ${
                    isActive
                      ? 'bg-surface-container-low text-primary border-primary font-bold dark:bg-primary-container dark:text-on-primary-container'
                      : 'border-transparent text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-lowest dark:hover:bg-surface-container-highest'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined nav-link" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-surface-container-highest dark:bg-surface-variant text-on-surface-variant dark:text-on-surface border border-outline-variant">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="mt-auto pt-4 border-t border-outline-variant dark:border-outline flex flex-col gap-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-lowest dark:hover:bg-surface-container-highest transition-all duration-200 ease-in-out">
            <span className="material-symbols-outlined">help</span>
            <span>Help Center</span>
          </button>
          <button 
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant dark:text-on-surface-variant hover:text-error hover:bg-error-container transition-all duration-200 ease-in-out"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
