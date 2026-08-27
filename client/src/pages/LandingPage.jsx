import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans antialiased min-h-screen flex flex-col bg-[#f8f9ff] text-slate-800">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xl">
            <span className="material-symbols-outlined">location_city</span>
            <span>Kopargaon Smart City</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="border border-blue-900 text-blue-900 bg-transparent hover:bg-blue-50 transition-all duration-200 px-5 py-2 rounded-full text-sm font-medium"
            >
              Administrator Sign In
            </button>
            <button 
              onClick={() => navigate('/citizen/login')}
              className="bg-blue-900 text-white hover:bg-blue-950 transition-all duration-200 px-5 py-2 rounded-full text-sm font-medium"
            >
              Resident Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-grow">
        {/* ── HERO SECTION ── */}
        <section className="relative py-20 px-6 md:px-12 overflow-hidden border-b border-gray-200">
          <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuCsNG59tT3txEAeQUy6OhlzkuTqqD6uRBGJTpXiduF2J-WbNcT4Mya5pCNd9-ZzZCMWDuEmlQgr2sQQhAi7_kbKHCLHnyR37YRutZ_pVayHvPdUciUH0zV4HQizkhKpcW48li13uwsQrGSeCADI732xwdEJf2dfERCcsFnzWD33CIoUN1dIXb5bU29u_zVyRpTx4ju8dfjhLsh1Wbg0vsLEAwfvVfPos2h05l5c7cUH8K7hBYJdKXHNDIW4C6orljXR7yM')] bg-cover bg-center opacity-15 z-0" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Your Digital Gateway <br /> to a Smarter <br /> Kopargaon
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                A unified platform to report civic issues, track municipal project progress, and access essential smart city services seamlessly.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => navigate('/citizen/login')}
                  className="bg-blue-900 text-white hover:bg-blue-950 transition-all duration-200 px-6 py-3 rounded-full font-medium shadow-sm"
                >
                  Report an Issue
                </button>
                <button 
                  className="border border-blue-900 text-blue-900 hover:bg-blue-50 transition-all duration-200 px-6 py-3 rounded-full font-medium shadow-sm bg-white/50"
                >
                  View City Projects
                </button>
              </div>
            </div>
            
            <div className="relative rounded-3xl overflow-hidden bg-white/85 backdrop-blur-md border border-white/40 shadow-xl p-4 transform lg:translate-x-4">
              <img 
                alt="Smart Traffic Hub" 
                className="w-full h-auto rounded-2xl" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5PAtl8D1h5Ogyt3U07hIYFsAq1gY_IE4O9F5FDi2vcl6X8AWylZR1gZ2_MyDWjS6vWzwIiTcbvtmGjN56snqK2blP1U2OuxDZ9Da6XrarIRgqInZ-dLmSaSNoJU3jQrhCidX9ApsMIM5Vee0lcVBrBFSP0s7pH6bQZfJEkMqiDoLr6N1wGZFUgQ28ugLIRhB9uwszHkcSvZZ5wCYv-L18IHAGxmN1Pat_NSO_dxN1tM0YaajCSUfG5qKjq8EHmR1N9cI" 
              />
            </div>
          </div>
        </section>

        {/* ── STATISTICS SECTION ── */}
        <section className="py-12 bg-white border-b border-gray-100 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">3,200+</h3>
                <p className="text-sm text-gray-500 font-medium">Resolved Complaints</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-xl">engineering</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">48</h3>
                <p className="text-sm text-gray-500 font-medium">Active Projects</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-xl">map</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">6</h3>
                <p className="text-sm text-gray-500 font-medium">Wards Covered</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ACCOUNT CREATION SECTION ── */}
        <section className="py-20 px-6 bg-[#eff4ff]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h2>
              <p className="text-gray-600">Select your role to join the smart city initiative.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Resident Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-full transition-shadow hover:shadow-md cursor-pointer" onClick={() => navigate('/citizen/login')}>
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">person</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Resident Sign Up</h3>
                <p className="text-sm text-gray-500 mb-8 flex-grow">
                  Report issues, pay utility bills, and access local municipal services.
                </p>
                <button className="w-full border border-blue-900 text-blue-900 bg-transparent hover:bg-blue-50 transition-all duration-200 py-2.5 rounded-full text-sm font-medium">
                  Register as Resident
                </button>
              </div>

              {/* Business Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-full transition-shadow hover:shadow-md cursor-pointer" onClick={() => navigate('/business/login')}>
                <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">store</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Business Sign Up</h3>
                <p className="text-sm text-gray-500 mb-8 flex-grow">
                  Manage commercial licenses, property tax, and civic compliance.
                </p>
                <button className="w-full border border-blue-900 text-blue-900 bg-transparent hover:bg-blue-50 transition-all duration-200 py-2.5 rounded-full text-sm font-medium">
                  Register as Business
                </button>
              </div>

              {/* Administrator Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-full transition-shadow hover:shadow-md cursor-pointer" onClick={() => navigate('/login')}>
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Administrator Sign Up</h3>
                <p className="text-sm text-gray-500 mb-8 flex-grow">
                  For municipal officials to track projects and resolve citizen reports.
                </p>
                <button className="w-full border border-blue-900 text-blue-900 bg-transparent hover:bg-blue-50 transition-all duration-200 py-2.5 rounded-full text-sm font-medium">
                  Request Admin Access
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-lg mb-4">
              <span className="material-symbols-outlined">account_balance</span>
              <span>Kopargaon Municipal Council</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Committed to providing efficient, transparent, and accessible civic services to all residents.
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8 md:justify-items-end">
            <div>
              <h4 className="font-bold text-gray-900 text-sm tracking-wider uppercase mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">About Smart City</a></li>
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">Citizen Charter</a></li>
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm tracking-wider uppercase mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">Help Center</a></li>
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="text-sm text-gray-600 hover:text-blue-900 transition-colors" href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-4 md:mb-0">
            © 2024 Kopargaon Smart City. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-gray-600 transition-colors"><span className="material-symbols-outlined text-sm">language</span></button>
            <button className="hover:text-gray-600 transition-colors"><span className="material-symbols-outlined text-sm">mail</span></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
