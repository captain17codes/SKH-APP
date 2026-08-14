import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Shield, UserCheck, Briefcase, ArrowRight, 
  MapPin, Phone, Mail, Menu, X 
} from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useTranslation } from '../context/LanguageContext';

const LandingPage = () => {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans flex flex-col justify-between relative overflow-x-hidden">
      {/* HTML5 Video Background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {!videoError && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          >
            <source src="/videos/landing-background.mp4" type="video/mp4" />
          </video>
        )}
        {/* Dark Transparent Overlay */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
      </div>

      {/* Background Glow Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none z-0" />

      {/* HEADER */}
      <header className="relative z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 text-white shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">{t('brand')} SMART CITY</h1>
              <p className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">{t('portalSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Simple Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
              <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
              <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
              <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
            </nav>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 md:hidden"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3">
            <nav className="flex flex-col space-y-2 text-xs font-semibold text-slate-300">
              <a href="#about" onClick={() => setMobileNavOpen(false)} className="py-1">About</a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="py-1">How It Works</a>
              <a href="#contact" onClick={() => setMobileNavOpen(false)} className="py-1">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* MAIN SELECTION SECTION */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-center space-y-6 flex-1 flex flex-col justify-center">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Kopargaon Smart City
          </h1>
          <p className="text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
            Digital GIS & Urban Intelligence Platform
          </p>
          <div className="pt-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 inline-block backdrop-blur-xs">
              Choose your access
            </span>
          </div>
        </div>

        {/* 3 COMPACT ACCESS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 max-w-3xl mx-auto w-full">
          {/* ADMINISTRATOR CARD */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 hover:border-blue-500/50 transition-all flex flex-col items-center justify-between space-y-5 shadow-xl group">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">{t('adminPortal')}</h3>
            <Link
              to="/admin/login"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>{t('login')} →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* CITIZEN CARD */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-between space-y-5 shadow-xl group">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">{t('citizenPortal')}</h3>
            <Link
              to="/citizen/login"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>{t('login')} →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* BUSINESS CARD */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-between space-y-5 shadow-xl group">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-all">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">{t('businessPortal')}</h3>
            <Link
              to="/business/login"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>{t('login')} →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* MINIMAL FOOTER SECTIONS */}
      <section id="about" className="relative z-10 border-t border-slate-800/80 bg-slate-900/40 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <h3 className="text-sm font-bold text-white">About Kopargaon Smart City</h3>
          <p className="text-xs text-slate-400">
            Official GIS & Urban Planning Platform for Kopargaon Municipal Council.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 border-t border-slate-800/80 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <h3 className="text-sm font-bold text-white">How It Works</h3>
          <p className="text-xs text-slate-400">
            Select your role above, sign in with your credentials, and access your dedicated platform workspace.
          </p>
        </div>
      </section>

      <section id="contact" className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <h3 className="text-sm font-bold text-white">Kopargaon Municipal Helpdesk</h3>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /> <span>Tilak Road, Kopargaon, Maharashtra 423601</span></span>
            <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-emerald-400" /> <span>+91 (02423) 222-104</span></span>
            <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-cyan-400" /> <span>contact@kopargaon.gov.in</span></span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Kopargaon Municipal Council</p>
      </footer>
    </div>
  );
};

export default LandingPage;
