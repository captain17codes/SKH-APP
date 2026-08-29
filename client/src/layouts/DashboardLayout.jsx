import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { useTranslation } from '../context/LanguageContext';

const DashboardLayout = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface font-body-md text-body-md flex flex-col antialiased">

      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ml-[260px] flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        {/* Top Navbar */}
        <Navbar onMobileMenuOpen={() => setMobileMenuOpen(true)} />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto flex flex-col gap-6">
          <Breadcrumbs />
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="border-t border-outline-variant dark:border-outline py-4 px-6 text-center text-xs text-on-surface-variant dark:text-inverse-on-surface">
          <p>{t('footerCopyright')}</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
