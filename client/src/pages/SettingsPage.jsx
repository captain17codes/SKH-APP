import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Map, Moon, Sun, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const SETTINGS_TABS = ['Profile', 'Users & Roles', 'Notifications', 'Map Settings', 'Theme & UI'];

const SettingsPage = () => {
  const { user, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('Profile');
  const [profileName, setProfileName] = useState(user?.name || 'Er. Rajan Patel');
  const [email, setEmail] = useState(user?.email || 'rajan.patel@kopargaon.gov.in');
  const [defaultZoom, setDefaultZoom] = useState('14');
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Platform configurations saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <SettingsIcon className="w-5 h-5 text-slate-500 mr-2" />
            Platform & Governance Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure system preferences, role-based access matrix, spatial GIS defaults, and notifications.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold overflow-x-auto">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {activeTab === 'Profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <User className="w-4 h-4 text-blue-500 mr-2" />
                Officer Profile Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Department</label>
                <input
                  type="text"
                  readOnly
                  value={user?.department || 'Town Planning & GIS Governance'}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'Users & Roles' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Shield className="w-4 h-4 text-emerald-500 mr-2" />
                Role Access & Governance Control
              </h3>

              <div className="space-y-3 border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Active Role Persona</span>
                    <span className="text-[11px] text-slate-500">Currently operating as: <strong className="text-blue-600 dark:text-blue-400">{user?.role}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    {['Administrator', 'GIS Planner', 'Municipal Officer', 'Citizen'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => switchRole(r)}
                        className={`px-3 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          user?.role === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Map Settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Map className="w-4 h-4 text-cyan-500 mr-2" />
                Leaflet GIS Defaults & Coordinate Bounds
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Zoom Level</label>
                  <select
                    value={defaultZoom}
                    onChange={e => setDefaultZoom(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="12">12 (City Overview)</option>
                    <option value="14">14 (Ward Level - Default)</option>
                    <option value="16">16 (Parcel Level)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Map Tile Provider</label>
                  <input
                    type="text"
                    readOnly
                    value="OpenStreetMap (Standard Vector Tiles)"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Bell className="w-4 h-4 text-amber-500 mr-2" />
                Alert Subscriptions & Incident Escalation
              </h3>

              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={e => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Send instant email digest when critical citizen grievance is lodged</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'Theme & UI' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400 mr-2" /> : <Sun className="w-4 h-4 text-amber-500 mr-2" />}
                Theme Customization & Contrast
              </h3>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Current Theme Mode</span>
                  <span className="text-slate-500 text-[11px]">Currently active: <strong className="capitalize text-blue-500">{theme} Mode</strong></span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Toggle to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
