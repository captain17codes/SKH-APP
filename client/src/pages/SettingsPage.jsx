import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const SETTINGS_TABS = [
  { id: 'Profile', icon: 'person' },
  { id: 'Users & Roles', icon: 'group' },
  { id: 'Notifications', icon: 'notifications_active' },
  { id: 'Map Settings', icon: 'map' },
  { id: 'Theme & UI', icon: 'palette' }
];

const SettingsPage = () => {
  const { user, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('Profile');
  const [profileName, setProfileName] = useState(user?.name || 'Rajesh Kumar');
  const [email, setEmail] = useState(user?.email || 'rajesh.admin@kopargaon.gov.in');
  const [department, setDepartment] = useState('Central Administration');
  const [phone, setPhone] = useState('+91 98765 43210');
  
  const [defaultZoom, setDefaultZoom] = useState('14');
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Platform configurations saved successfully!');
  };

  return (
    <div className="w-full">
      <div className="max-w-container-max-width mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-display-md font-display-md text-on-background mb-2">Platform Settings</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Manage your account, administrative roles, and system preferences.</p>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-surface rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-outline-variant overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-outline-variant overflow-x-auto bg-surface-bright">
            {SETTINGS_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center text-label-md font-label-md whitespace-nowrap transition-colors flex justify-center items-center cursor-pointer ${
                    isActive 
                      ? 'text-primary border-b-2 border-primary font-bold hover:bg-surface-container-low' 
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined align-middle mr-2 text-[18px]">{tab.icon}</span>
                  {tab.id}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="p-6 md:p-8">
            {activeTab === 'Profile' && (
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Avatar Column */}
                  <div className="col-span-1 flex flex-col items-center border-r border-outline-variant/50 pr-0 md:pr-8">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-high mb-4 shadow-sm relative group cursor-pointer">
                      <img 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhD9Cd25FDjzFv573--waE4Qs9D6rvNS1iucsqW0O7mnt_3iu1zBoLg6yGO6_eF58AhB5SvHX20ryAmQdADne9Lr-FoRaIBV1UUVVYjm_AR4IgI9Kwo6Gow0xmDxhW6XdZqg9m85Rp5NPZL-Jx0SHjMIdHGPkCZgPPr1l0yklq76sGfPdCXddQY2RLuq5fhobAk2GRafP9cI40Q04pXxMg4ri5j0vjZgZTJ9U047LK473mG6GTEU2SHw"
                        alt="Profile"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white">photo_camera</span>
                      </div>
                    </div>
                    <h3 className="text-title-lg font-title-lg mb-1 text-center">{profileName}</h3>
                    <div className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm font-label-sm font-bold flex items-center mb-6">
                      <span className="material-symbols-outlined text-[14px] mr-1">verified_user</span> Administrator
                    </div>
                    <button type="button" className="w-full py-2 bg-surface-container-low text-primary border border-outline-variant rounded-lg text-label-md font-label-md hover:bg-surface-container transition-colors cursor-pointer">
                      Change Photo
                    </button>
                  </div>
                  
                  {/* Form Column */}
                  <div className="col-span-1 md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-title-lg font-title-lg mb-4 text-primary border-b border-outline-variant/50 pb-2">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Full Name</label>
                          <input 
                            className="w-full border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-bright text-body-md text-on-surface outline-none" 
                            type="text" 
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email Address</label>
                          <input 
                            className="w-full border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-bright text-body-md text-on-surface outline-none" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Department</label>
                          <select 
                            className="w-full border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-bright text-body-md text-on-surface outline-none cursor-pointer"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                          >
                            <option value="Urban Planning">Urban Planning</option>
                            <option value="Public Works">Public Works</option>
                            <option value="Central Administration">Central Administration</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Phone Number</label>
                          <input 
                            className="w-full border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-bright text-body-md text-on-surface outline-none" 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-8">
                      <button type="submit" className="bg-primary text-on-primary px-6 py-2 rounded-lg text-label-md font-label-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'Users & Roles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-title-lg font-title-lg text-primary">User Management</h4>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">Manage platform access and role assignments.</p>
                  </div>
                  <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] mr-2">person_add</span> Invite User
                  </button>
                </div>
                
                <div className="mb-6 space-y-3 border border-outline-variant rounded-lg p-4 bg-surface-container-low">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-on-surface block">Active Role Persona</span>
                      <span className="text-body-sm text-on-surface-variant">Currently operating as: <strong className="text-primary">{user?.role}</strong></span>
                    </div>

                    <div className="flex gap-2">
                      {['Administrator', 'GIS Planner', 'Municipal Officer', 'Citizen'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => switchRole(r)}
                          className={`px-3 py-1 rounded text-label-sm font-label-sm border transition-colors cursor-pointer ${
                            user?.role === r
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-outline-variant rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-bright text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant/50">
                      <tr>
                        <th className="py-3 px-4 font-semibold">User</th>
                        <th className="py-3 px-4 font-semibold">Department</th>
                        <th className="py-3 px-4 font-semibold">Role</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md font-body-md text-on-surface">
                      <tr className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">A</div>
                          <div>
                            <p className="font-medium text-on-surface">Anita Desai</p>
                            <p className="text-body-sm text-on-surface-variant">anita.d@kopargaon.gov</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">Urban Planning</td>
                        <td className="py-3 px-4"><span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-label-sm font-label-sm border border-outline-variant/50">Editor</span></td>
                        <td className="py-3 px-4"><span className="bg-secondary-container/30 text-secondary px-2 py-1 rounded-full text-label-sm font-label-sm">Active</span></td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
                        </td>
                      </tr>
                      <tr className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">V</div>
                          <div>
                            <p className="font-medium text-on-surface">Vikram Singh</p>
                            <p className="text-body-sm text-on-surface-variant">v.singh@kopargaon.gov</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">Public Works</td>
                        <td className="py-3 px-4"><span className="bg-primary-container/20 text-primary px-2 py-1 rounded text-label-sm font-label-sm border border-primary/20">Administrator</span></td>
                        <td className="py-3 px-4"><span className="bg-secondary-container/30 text-secondary px-2 py-1 rounded-full text-label-sm font-label-sm">Active</span></td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">M</div>
                          <div>
                            <p className="font-medium text-on-surface">Meera Patel</p>
                            <p className="text-body-sm text-on-surface-variant">m.patel@kopargaon.gov</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">Sanitation</td>
                        <td className="py-3 px-4"><span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-label-sm font-label-sm border border-outline-variant/50">Viewer</span></td>
                        <td className="py-3 px-4"><span className="bg-error-container text-error px-2 py-1 rounded-full text-label-sm font-label-sm">Inactive</span></td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Theme & UI' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-title-lg font-title-lg text-primary">Appearance</h4>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">Customize the visual presentation of the admin console.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                  {/* Light Mode Card */}
                  <div 
                    onClick={() => { if(theme !== 'light') toggleTheme() }} 
                    className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'light' ? 'border-primary' : 'border-transparent hover:border-outline-variant'}`}
                  >
                    <div className="bg-white rounded-lg h-40 border border-slate-200 p-4 flex flex-col shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
                        <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                      </div>
                      <div className="flex-1 flex gap-4">
                        <div className="w-1/4 h-full bg-slate-100 rounded"></div>
                        <div className="w-3/4 h-full bg-slate-50 rounded border border-slate-200"></div>
                      </div>
                      {theme === 'light' && (
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                          <span className="bg-primary text-white px-3 py-1 rounded-full text-label-sm flex items-center">
                            <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span> Active
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center py-3">
                      <p className={`font-label-md text-label-md ${theme === 'light' ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>Light Mode (Civic Standard)</p>
                    </div>
                  </div>
                  
                  {/* Dark Mode Card */}
                  <div 
                    onClick={() => { if(theme !== 'dark') toggleTheme() }} 
                    className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'dark' ? 'border-primary' : 'border-transparent hover:border-outline-variant'}`}
                  >
                    <div className="bg-slate-900 rounded-lg h-40 border border-slate-800 p-4 flex flex-col shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-1/3 h-4 bg-slate-700 rounded"></div>
                        <div className="w-8 h-8 bg-blue-900 rounded-full"></div>
                      </div>
                      <div className="flex-1 flex gap-4">
                        <div className="w-1/4 h-full bg-slate-800 rounded"></div>
                        <div className="w-3/4 h-full bg-slate-800/50 rounded border border-slate-700"></div>
                      </div>
                      {theme === 'dark' && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <span className="bg-primary text-white px-3 py-1 rounded-full text-label-sm flex items-center">
                            <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span> Active
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center py-3">
                      <p className={`font-label-md text-label-md ${theme === 'dark' ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>Dark Mode (Low Light)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="text-center py-12 text-on-surface-variant h-64 flex items-center justify-center">
                <div>
                  <span className="material-symbols-outlined text-[48px] opacity-50 mb-4 block">notifications</span>
                  <p>Notification settings coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'Map Settings' && (
              <div className="text-center py-12 text-on-surface-variant h-64 flex items-center justify-center">
                <div>
                  <span className="material-symbols-outlined text-[48px] opacity-50 mb-4 block">map</span>
                  <p>GIS Map configurations coming soon.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
