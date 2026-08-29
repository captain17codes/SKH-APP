import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquareWarning, Clock, MapPin, FolderKanban,
  AlertTriangle, Bot, Building2, Sun, Moon, LogOut, X, Menu, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import toast from 'react-hot-toast';

const CitizenDashboardLayout = () => {
  const { t } = useTranslation();
  const auth = useAuth() || {};
  const user = auth.user || { name: 'Rajesh Kumar', id: '9876-5432' };
  const logout = auth.logout || (() => {});

  const citizenNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/citizen/dashboard' },
    { id: 'report-problem', label: 'Report Problem', icon: 'warning', path: '/citizen/dashboard?view=report-problem' },
    { id: 'my-complaints', label: 'My Complaints', icon: 'schedule', path: '/citizen/dashboard?view=my-complaints' },
    { id: 'citizen-gis', label: 'GIS View', icon: 'map', path: '/citizen/gis' },
    { id: 'marketplace', label: 'Property Marketplace', icon: 'store', path: '/citizen/properties' },
    { id: 'sell-property', label: 'Sell Property', icon: 'add_business', path: '/citizen/properties/sell' },
    { id: 'my-listings', label: 'My Listings', icon: 'list_alt', path: '/citizen/properties/my-listings' },
    { id: 'projects-near-me', label: 'Projects Near Me', icon: 'account_tree', path: '/citizen/dashboard?view=projects-near-me' },
    { id: 'ai-assistant', label: 'AI Citizen Assistant', icon: 'smart_toy', path: '/citizen/dashboard?view=ai-assistant' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/citizen/settings' }
  ];

  const themeCtx = useTheme() || {};
  const theme = themeCtx.theme || 'dark';
  const toggleTheme = themeCtx.toggleTheme || (() => {});

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isNavActive = (item) => {
    if (item.path === location.pathname + location.search) return true;
    if (item.id === 'dashboard' && location.pathname === '/citizen/dashboard' && !location.search) return true;
    if (item.id === 'citizen-gis' && location.pathname.startsWith('/citizen/gis')) return true;
    if (item.id === 'marketplace' && location.pathname === '/citizen/properties') return true;
    if (item.id === 'settings' && location.pathname.startsWith('/citizen/settings')) return true;
    return false;
  };

  return (
    <div className="bg-background dark:bg-inverse-surface text-on-background dark:text-inverse-on-surface min-h-screen flex font-body-md">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-on-background/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR */}
      <nav
        className={`fixed left-0 top-0 h-screen w-[260px] flex flex-col py-6 bg-surface-container-lowest dark:bg-on-surface shadow-md border-r border-outline-variant dark:border-outline z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>account_balance</span>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">Citizen Portal</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Smart City Services</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-on-surface-variant p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ul className="flex-1 flex flex-col gap-1 w-full font-label-md text-label-md overflow-y-auto pr-4">
          {citizenNavItems.map((item) => {
            const active = isNavActive(item);
            return (
              <li key={item.id} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-r-lg ${
                    active
                      ? 'bg-primary-container dark:bg-primary-fixed-variant text-on-primary-container dark:text-on-primary-fixed-variant border-l-4 border-primary dark:border-primary-fixed opacity-90'
                      : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high border-l-4 border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-6 mt-auto">
          <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
            <img
              src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC88EA_67EUCmdk9L70Sl8XdwetPNnAyMrIFmw_OxraFJRi9I_DoFCFn392pYNI4AE9hg5ZR-cPvHP-LZMoYTYbpWVNE3Dsh20X8yzU3v8cTj8EjWuK646d_464DRQ1TlqnVUe2r4lMrPtXHyWuIgISwE_s2bvsWAw0bxaR_182CBBfGVEpIMMW19oEaxCJYNEQO4kWP4Qu7cmRqoQeh0jBhlwSLxdFhdyEhxoBC_xZAV5Mmjw4WTWEVQ'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-label-md text-label-md text-on-surface">{user?.name || 'Rajesh Kumar'}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">ID: {user?.id || '9876-5432'}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen">
        {/* TOP NAVBAR */}
        <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface-bright dark:bg-surface-dim border-b border-outline-variant dark:border-outline shadow-sm">
          <div className="md:hidden flex items-center gap-4">
            <span className="material-symbols-outlined text-primary cursor-pointer" onClick={() => setMobileMenuOpen(true)}>menu</span>
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary dark:text-primary-fixed">Citizen Portal</h1>
          </div>
          <div className="hidden md:block">
            {/* Optional Breadcrumb or search could go here */}
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <LanguageSwitcher />

            <div className="flex gap-4 text-on-surface-variant">
              <button onClick={toggleTheme} className="hover:text-primary dark:hover:text-primary-fixed transition-colors">
                <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <button className="relative hover:text-primary dark:hover:text-primary-fixed transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
              </button>
            </div>

            <div className="relative hidden md:block">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 outline-none"
              >
                <img
                  src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC88EA_67EUCmdk9L70Sl8XdwetPNnAyMrIFmw_OxraFJRi9I_DoFCFn392pYNI4AE9hg5ZR-cPvHP-LZMoYTYbpWVNE3Dsh20X8yzU3v8cTj8EjWuK646d_464DRQ1TlqnVUe2r4lMrPtXHyWuIgISwE_s2bvsWAw0bxaR_182CBBfGVEpIMMW19oEaxCJYNEQO4kWP4Qu7cmRqoQeh0jBhlwSLxdFhdyEhxoBC_xZAV5Mmjw4WTWEVQ'}
                  alt="User Profile"
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest dark:bg-surface border border-outline-variant rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/50">
                    <p className="text-xs font-bold text-on-surface">{user?.name || 'Rajesh Kumar'}</p>
                    <span className="text-[10px] text-primary font-semibold">Citizen</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-error hover:bg-error-container/20 flex items-center space-x-2"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '16px'}}>logout</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-[1rem] md:p-[2rem] bg-surface-bright">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboardLayout;
