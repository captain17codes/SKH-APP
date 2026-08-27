import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import NotificationDrawer from './NotificationDrawer';
import GlobalSearchModal from './GlobalSearchModal';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ onMobileMenuOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="bg-surface dark:bg-inverse-surface font-body-md text-body-md sticky top-0 z-30 border-b border-outline-variant dark:border-outline shadow-sm flex justify-between items-center px-4 md:px-6 h-16 w-full transition-colors duration-200">
        {/* Left Section: Mobile Menu + Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuOpen}
            className="p-2 rounded-lg text-on-surface-variant hover:text-primary dark:text-inverse-on-surface lg:hidden transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest dark:bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors w-48 md:w-64"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            <span className="truncate text-sm font-medium">Search GIS, Projects...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant bg-surface border border-outline-variant rounded shadow-sm">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Global Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface dark:ring-inverse-surface" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <span className="material-symbols-outlined text-secondary-fixed">light_mode</span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative ml-2 border-l pl-4 border-outline-variant dark:border-outline">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 cursor-pointer active:opacity-80"
            >
              <span className="hidden md:block font-label-md text-label-md text-on-surface dark:text-inverse-on-surface truncate max-w-[120px]">
                {user?.name || 'Profile'}
              </span>
              <img
                src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD3U6oNdFLttd2kOolIO6LdKb3t_KswIAtmCPNhUgjfqBF_r-L6-aJmf-Z8lTSL2jQwp-bHLJoERqsnM2Uu1fRKHzp1r6YjRkKnrHGRMB59cKRQmfHHF3mvRu1ZsRnaZUpI_TkhslvaPkuqMoAZaDUtY11MMxCIRwBhKJslm3cFCTkxEmg39XvwZ3eoajGX7bg8sn7mahbYLMydG32diU80fsXvVwOS4o30R6WPxT_aiiIaQBDTQ1ORJg"}
                alt={user?.name || "User Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-outline-variant"
              />
              <span className="material-symbols-outlined text-on-surface-variant text-sm hidden sm:block">
                expand_more
              </span>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-xl shadow-ambient-lvl2 py-2 z-50 fade-in">
                <div className="px-4 py-3 border-b border-outline-variant dark:border-outline">
                  <p className="font-label-md text-label-md font-bold text-on-surface dark:text-inverse-on-surface">{user?.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-2 font-label-sm text-[10px] uppercase font-bold text-primary-container bg-primary-fixed px-2 py-0.5 rounded">
                    {user?.role}
                  </span>
                </div>

                <div className="sm:hidden px-4 py-2 border-b border-outline-variant dark:border-outline">
                  <LanguageSwitcher />
                </div>

                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-label-md font-label-md text-error hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-2 mt-1"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
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
