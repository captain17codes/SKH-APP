import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, MapPin, BarChart3, Layers, Briefcase,
  FileCheck, Bot, Building2, Sun, Moon, LogOut, X, Menu, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import toast from 'react-hot-toast';

const BusinessDashboardLayout = () => {
  const { t } = useTranslation();
  const auth = useAuth() || {};
  const user = auth.user || { name: 'Vikram Shah', id: 'USR-BUS-01' };
  const logout = auth.logout || (() => {});

  const businessNavItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/business/dashboard' },
    { id: 'site-intelligence', label: t('aiSiteIntelligence'), icon: Sparkles, path: '/business/dashboard?view=site-intelligence' },
    { id: 'business-gis', label: t('businessGis'), icon: MapPin, badge: 'Live GIS', path: '/business/gis' },
    { id: 'area-intelligence', label: t('areaIntelligence'), icon: BarChart3, path: '/business/dashboard?view=area-intelligence' },
    { id: 'properties-land', label: t('landProperty'), icon: Layers, path: '/business/properties' },
    { id: 'market-intelligence', label: t('marketCompetitorIntel'), icon: BarChart3, path: '/business/market-intelligence' },
    { id: 'upcoming-dev', label: t('upcomingDevelopment'), icon: Building2, path: '/business/upcoming-development' },
    { id: 'ai-assistant', label: t('aiBusinessAssistant'), icon: Bot, badge: 'AI Advisor', path: '/business/dashboard?view=ai-assistant' }
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
    if (item.id === 'properties-land') {
      return location.pathname.startsWith('/business/properties');
    }
    if (item.id === 'market-intelligence') {
      return location.pathname.startsWith('/business/market-intelligence');
    }
    if (item.id === 'upcoming-dev') {
      return location.pathname.startsWith('/business/upcoming-development');
    }
    if (item.id === 'business-gis') {
      return location.pathname.startsWith('/business/gis');
    }
    if (item.id === 'dashboard') {
      return location.pathname === '/business/dashboard' && !location.search;
    }
    if (item.path.includes('view=')) {
      const viewParam = item.path.split('view=')[1];
      return location.pathname === '/business/dashboard' && location.search.includes(viewParam);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* SINGLE BUSINESS DASHBOARD SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/business/dashboard" className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-md shadow-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide leading-none">KOPARGAON</h1>
              <span className="text-[10px] font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase">Business Portal</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info Card */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-9 h-9 rounded-full ring-2 ring-cyan-500/40 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Vikram Shah'}</p>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mt-0.5">
                Commercial Investor
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {businessNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3 text-left pr-2">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="leading-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Kopargaon Business GIS</span>
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">v2.4 Live</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Kopargaon Commercial & Investment Portal</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">AI Location Intelligence, Land GIS & Commercial Opportunities</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Global Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                />
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user?.name || 'Vikram Shah'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name || 'Vikram Shah'}</p>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Business Investor</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 box-border">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
          <p>© 2026 Kopargaon Municipal Council — Commercial & Investment Intelligence Portal</p>
        </footer>
      </div>
    </div>
  );
};

export default BusinessDashboardLayout;
