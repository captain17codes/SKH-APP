import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Shield, UserCheck, Briefcase, Lock, ArrowRight, ArrowLeft, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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

  // Admin/Business state
  const [email, setEmail] = useState(() => {
    if (role === 'Administrator') return 'admin@kopargaon.gov';
    if (role === 'Business') return 'business@gmail.com';
    return '';
  });
  
  const [password, setPassword] = useState(() => {
    if (role === 'Administrator') return 'admin123';
    if (role === 'Business') return 'business';
    return '';
  });
  
  // Citizen OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

  const handleGoogleSuccess = async (credentialResponse, authRole) => {
    setLoading(true);
    try {
      const data = await authService.googleVerify(credentialResponse.credential, authRole);
      login(data.user, data.token);
      
      if (data.user.role === 'Business') {
        navigate('/business/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.adminLogin(email, password);
      login(data.user, data.token);

      if (data.user.role === 'Business') {
        navigate('/business/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error('Enter valid phone number');
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      toast.success('OTP Sent! (Check console if in DEV_MODE)');
      setOtpSent(true);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return toast.error('Enter valid OTP');
    setLoading(true);
    try {
      const data = await authService.verifyOtp(phone, otp, role);
      login(data.user);

      navigate('/citizen/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
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

        {/* ADMIN / BUSINESS LOGIN */}
        {['Administrator', 'Business'].includes(role) && (
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kopargaon.gov.in"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
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
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${theme.btnBg} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{loading ? 'Authenticating...' : 'Secure Login'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* BUSINESS LOGIN */}
        {role === 'Business' && (
          <div className="space-y-4">
            <p className="text-xs text-center text-slate-400 mb-4">Business Investors must authenticate via Google Workspace.</p>
            <div className="flex justify-center w-full">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={(res) => handleGoogleSuccess(res, 'Business')}
                  onError={() => toast.error('Google Login Failed')}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>
          </div>
        )}

        {/* CITIZEN LOGIN */}
        {role === 'Citizen' && (
          <div className="space-y-6">
            <div className="flex justify-center w-full">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={(res) => handleGoogleSuccess(res, 'Citizen')}
                  onError={() => toast.error('Google Login Failed')}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-slate-900 px-2 text-slate-500 uppercase tracking-wider font-bold">Or use mobile OTP</span>
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Mobile Number</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${theme.btnBg} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span>{loading ? 'Sending...' : 'Send OTP'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-slate-300">Enter OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-emerald-400 hover:underline">Change Number</button>
                  </div>
                  <div className="relative flex items-center">
                    <CheckCircle2 className="absolute left-3.5 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-950 border border-emerald-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${theme.btnBg} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Login'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        )}

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
