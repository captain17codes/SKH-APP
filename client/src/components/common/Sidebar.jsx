import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  FolderKanban,
  Layers,
  MessageSquareWarning,
  BarChart3,
  Bot,
  FileText,
  Settings,
  Building2,
  GitCompare,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/gis', label: t('gisSmartMap'), icon: MapPin, badge: t('liveGis') },
    { path: '/projects', label: t('projects'), icon: FolderKanban },
    { path: '/scenarios', label: 'WHAT-IF Scenarios', icon: GitCompare, badge: 'New' },
    { path: '/land-use', label: t('landUsePlanning'), icon: Layers },
    { path: '/complaints', label: t('citizenComplaints'), icon: MessageSquareWarning, badge: `6 ${t('new')}` },
    { path: '/analytics', label: t('analytics'), icon: BarChart3 },
    { path: '/ai-planner', label: t('aiUrbanPlanner'), icon: Bot, badge: t('ai20') },
    { path: '/documents', label: t('documents'), icon: FileText },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide leading-none">{t('brand')}</h1>
              <span className="text-[10px] font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">{t('smartCityGis')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-9 h-9 rounded-full ring-2 ring-blue-500/40 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{t('municipalGisFooter')}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">v2.4 Live</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
