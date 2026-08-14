import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, User, Shield, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import NotificationDrawer from './NotificationDrawer';
import GlobalSearchModal from './GlobalSearchModal';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ onMobileMenuOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, switchRole, logout } = useAuth();
  const { t } = useTranslation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const roles = ['Administrator', 'GIS Planner', 'Municipal Officer', 'Citizen'];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        {/* Left Section: Mobile Menu + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMobileMenuOpen}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('navTitle')}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('navSubtitle')}</p>
          </div>
        </div>

        {/* Center: Global Search Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-xs w-48 sm:w-64 transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="truncate">Search GIS, Projects...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Right Section: Controls */}
        <div className="flex items-center space-x-2">
          {/* Global Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
              />
              <span className="hidden md:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {user?.role}
                  </span>
                </div>

                {/* Role Quick Switcher */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Switch Role Demo
                  </span>
                  <div className="space-y-1">
                    {roles.map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setIsProfileOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                          user?.role === r
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{r}</span>
                        {user?.role === r && <Shield className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Drawers and Modals */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;
