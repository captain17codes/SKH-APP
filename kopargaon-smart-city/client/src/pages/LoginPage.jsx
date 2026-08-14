import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Shield, UserCheck, Briefcase, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import toast from 'react-hot-toast';

const LoginPage = ({ defaultRole }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleFromPath = () => {
    if (defaultRole) return defaultRole;
    if (location.pathname.includes('/citizen')) return 'Citizen';
    if (location.pathname.includes('/business')) return 'Business';
    return 'Administrator';
  };

  const role = getRoleFromPath();

  const getDefaultEmail = (roleName) => {
    if (roleName === 'Administrator') return 'admin@kopargaon.gov.in';
    if (roleName === 'Citizen') return 'citizen.sharma@kopargaon.gov.in';
    if (roleName === 'Business') return 'investor.shah@kopargaon.gov.in';
    return 'user@kopargaon.gov.in';
  };

  const [email, setEmail] = useState(() => getDefaultEmail(role));
  const [password, setPassword] = useState('••••••••••••');

  useEffect(() => {
    setEmail(getDefaultEmail(role));
  }, [role]);

  const handleLogin = (e) => {
    e.preventDefault();
    login(role, { email });
    toast.success(`Authenticated as ${role}`);
    
    if (role === 'Administrator') {
      navigate('/dashboard');
    } else if (role === 'Citizen') {
      navigate('/citizen/dashboard');
    } else if (role === 'Business') {
      navigate('/business/dashboard');
    }
  };

  const getRoleIcon = () => {
    if (role === 'Business') return <Briefcase className="w-8 h-8 text-cyan-400" />;
    if (role === 'Citizen') return <UserCheck className="w-8 h-8 text-emerald-400" />;
    return <Shield className="w-8 h-8 text-blue-400" />;
  };

  const getRoleTheme = () => {
    if (role === 'Business') {
      return {
        badgeBg: 'bg-cyan-500/10 border-cyan-500/20',
        btnBg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-600/30',
        focusRing: 'focus:ring-cyan-500'
      };
    }
    if (role === 'Citizen') {
      return {
        badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
        btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
        focusRing: 'focus:ring-emerald-500'
      };
    }
    return {
      badgeBg: 'bg-blue-500/10 border-blue-500/20',
      btnBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30',
      focusRing: 'focus:ring-blue-500'
    };
  };

  const theme = getRoleTheme();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-600 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Role Header */}
        <div className="text-center space-y-3">
          <div className={`p-4 rounded-2xl border w-fit mx-auto ${theme.badgeBg}`}>
            {getRoleIcon()}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">{role} {t('login')}</h2>
            <p className="text-xs text-slate-400">{t('brand')} Smart City Platform</p>
          </div>
        </div>

        {/* Dedicated Login Form - NO Role Selector */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${theme.focusRing}`}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${theme.focusRing}`}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${theme.btnBg}`}
          >
            <span>{role} Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center pt-4 border-t border-slate-800">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
