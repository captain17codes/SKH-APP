import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RegisterPage = ({ defaultRole = 'Citizen' }) => {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    toast.success('Registration successful! Please login.');
    if (defaultRole === 'Citizen') {
      navigate('/citizen/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Resident Registration</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Create your account to access Kopargaon Smart City services.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-4xl">account_balance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
          {/* Left Column: Info & Preview */}
          <div className="p-6 md:p-8 bg-surface-container-low border-b lg:border-b-0 lg:border-r border-outline-variant/30 flex flex-col gap-6">
            {/* Terms Box */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <h2 className="font-title-lg text-title-lg text-on-surface">Terms of Use</h2>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                <p>Welcome to the Kopargaon Smart City Municipal Portal. By registering for an account, you agree to comply with and be bound by the following terms and conditions of use.</p>
                <p>1. <strong>Accuracy of Information:</strong> You must provide accurate and complete information during registration. False information may lead to account suspension.</p>
                <p>2. <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
                <p>3. <strong>Service Usage:</strong> The portal is for accessing municipal services, paying taxes, and registering grievances. Misuse of the platform is strictly prohibited.</p>
                <p>4. <strong>Data Privacy:</strong> Your data will be handled in accordance with our Privacy Policy. We collect only necessary data for civic administration.</p>
              </div>
            </div>

            {/* Ward Preview Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-sm flex-grow flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                <h2 className="font-title-lg text-title-lg text-on-surface">Ward Preview</h2>
              </div>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-outline-variant mb-4">
                <div className="bg-cover bg-center w-full h-full absolute inset-0" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEvwSnxqbqyCvfqDwUUX8VYGs-MiEsLpT2nlRcYARmZs_2amWptYfdeU9WLc85eTy9C9Hj0PuImVaTM_DfdlfUhrkdkpMIVuR7US7lImcNXcd8_vRXROPzSbkC7ibSgVxKclGn12XfHCZw9soaNct3_Fodx_C-dtASn9CDg00636Svpm1l1a8Y0sPDh2VXC6YW3f822Cup9VclZhRZKYeUxQ7H8VFgH_Bnqn1cBXatpcjaLXGQ5LVR5g')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent flex items-end p-4">
                  <div className="bg-surface-container-lowest/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-outline-variant/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <span className="font-label-md text-label-md text-on-surface">Pending Address Selection</span>
                  </div>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Select your address on the right to preview your designated municipal ward and representative details.
              </p>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleRegister} className="flex flex-col h-full">
              <div className="space-y-6 flex-grow">
                {/* Full Name */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="fullName">Full Name</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow" id="fullName" placeholder="e.g. Ramesh Kumar" type="text" required />
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="email">Email Address</label>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow" id="email" placeholder="ramesh@example.com" type="email" required />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="phone">Phone Number</label>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow" id="phone" placeholder="+91 98765 43210" type="tel" required />
                  </div>
                </div>

                {/* Address / Location Button */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Residential Address</label>
                  <button className="w-full flex items-center justify-between bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg px-4 py-3 transition-colors text-left group cursor-pointer" type="button">
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Choose your address on map</span>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>pin_drop</span>
                  </button>
                </div>

                {/* Passwords Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="password">Password</label>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow" id="password" placeholder="••••••••" type="password" required />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="confirmPassword">Confirm Password</label>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-shadow" id="confirmPassword" placeholder="••••••••" type="password" required />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-col gap-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start mt-1">
                    <input className="peer sr-only" type="checkbox" required />
                    <div className="w-5 h-5 border-2 border-outline rounded bg-surface-container-lowest peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary text-sm opacity-0 peer-checked:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-tight">
                    I agree to the <Link className="text-primary hover:underline" to="#">Terms of Service</Link> and acknowledge the <Link className="text-primary hover:underline" to="#">Privacy Policy</Link>.
                  </span>
                </label>

                <button className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer" type="submit">
                  <span>Register</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <div className="text-center">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Already have an account?</span>
                  <Link className="font-label-md text-label-md text-primary hover:underline ml-1" to={defaultRole === 'Citizen' ? '/citizen/login' : '/login'}>Log In</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
