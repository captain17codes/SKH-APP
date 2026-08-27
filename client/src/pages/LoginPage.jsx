import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

  return (
    <div className="min-h-screen h-full font-body-md text-on-surface bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Background Map */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBvla6YJRY3I2WTBArEuMoEZupGAGbyWAEoDMW84kFApUyor0D_66joxJFtAr6WyaWIiE3vTVE_X2mONMVROTZoP2tVcCHlixUvsQUfkirSwnX8d7KzPKb6mA1YNsDau17rGKF4EtJK1prjRDic85uvnxHjTqTvu1EFIpfC9JZ_Wwxt5KqVe2IiOzaeiW90OZiw-3juCe8RNWi8chSCgS7a43OL27aQfVUazVR0wWcbHPbuFa6uRdE3-w')" }}></div>
      <div className="absolute inset-0 z-0 bg-surface/60 backdrop-blur-[2px]"></div>
      
      {/* Decorative Pin */}
      <div className="absolute z-0 flex flex-col items-center justify-center opacity-30 transform -translate-y-12">
        <span className="material-symbols-outlined text-[120px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
      </div>

      {/* Center Card */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[32px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              {role === 'Business' ? 'domain' : role === 'Citizen' ? 'person' : 'admin_panel_settings'}
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary">{t('brand')} Smart City</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{role} Console</p>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-surface-container-highest rounded-lg p-1 gap-1">
          <button 
            onClick={() => navigate('/citizen/login')}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-label-sm text-label-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${role === 'Citizen' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            Citizen
          </button>
          <button 
            onClick={() => navigate('/business/login')}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-label-sm text-label-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${role === 'Business' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            Business
          </button>
          <button 
            onClick={() => navigate('/login')}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-label-sm text-label-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${role === 'Administrator' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            Admin
          </button>
        </div>

        {/* ADMIN / BUSINESS LOGIN */}
        {['Administrator', 'Business'].includes(role) && (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                <input 
                  id="email" 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kopargaon.gov" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/50 outline-none transition-all font-body-md text-body-md placeholder:text-outline text-on-surface"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input 
                  id="password" 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/50 outline-none transition-all font-body-md text-body-md placeholder:text-outline text-on-surface"
                />
              </div>
            </div>
            
            {role === 'Business' && (
              <div className="mt-2 text-center text-xs text-on-surface-variant">
                Or sign in with Google Workspace:
                <div className="flex justify-center w-full mt-2">
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

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3.5 bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined text-[20px]">login</span>}
            </button>
          </form>
        )}

        {/* CITIZEN LOGIN */}
        {role === 'Citizen' && (
          <div className="flex flex-col gap-5">
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
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-surface-container-lowest px-2 text-outline uppercase tracking-wider font-bold">Or use mobile OTP</span>
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface">Mobile Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">phone_iphone</span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/50 outline-none transition-all font-body-md text-body-md placeholder:text-outline text-on-surface"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                  {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-sm text-label-sm text-on-surface">Enter OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-primary hover:underline">Change Number</button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">password</span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/50 outline-none transition-all font-body-md text-body-md placeholder:text-outline text-on-surface"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                  {!loading && <span className="material-symbols-outlined text-[20px]">login</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Links */}
        <div className="flex flex-col gap-4 mt-2 pt-6 border-t border-outline-variant/50 text-center">
          <Link to="/" className="font-body-sm text-body-sm text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
