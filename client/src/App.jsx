import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './layouts/DashboardLayout';
import CitizenDashboardLayout from './layouts/CitizenDashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CitizenLoginPage from './pages/CitizenLoginPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import CitizenGisPage from './pages/CitizenGisPage';

import BusinessLoginPage from './pages/BusinessLoginPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import BusinessGisPage from './pages/BusinessGisPage';
import BusinessPropertiesPage from './pages/BusinessPropertiesPage';
import BusinessMarketIntelligencePage from './pages/BusinessMarketIntelligencePage';
import BusinessUpcomingDevelopmentPage from './pages/BusinessUpcomingDevelopmentPage';
import BusinessDashboardLayout from './layouts/BusinessDashboardLayout';

import DashboardPage from './pages/DashboardPage';
import GisPage from './pages/GisPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import LandUsePage from './pages/LandUsePage';
import ComplaintsPage from './pages/ComplaintsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AiPlannerPage from './pages/AiPlannerPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
          <Routes>
            {/* Public Entry Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage defaultRole="Administrator" />} />
            <Route path="/admin/login" element={<LoginPage defaultRole="Administrator" />} />
            <Route path="/administrator/login" element={<LoginPage defaultRole="Administrator" />} />

            {/* Citizen Entry & Dashboard Routes (Single Citizen Sidebar Layout) */}
            <Route path="/citizen/login" element={<CitizenLoginPage />} />
            <Route element={<CitizenDashboardLayout />}>
              <Route path="/citizen/dashboard" element={<CitizenDashboardPage />} />
              <Route path="/citizen/gis" element={<CitizenGisPage />} />
              {/* Citizen Land & Property removed — redirect old URLs to dashboard */}
              <Route path="/citizen/properties" element={<Navigate replace to="/citizen/dashboard" />} />
              <Route path="/citizen/properties/*" element={<Navigate replace to="/citizen/dashboard" />} />
            </Route>

            {/* Business Routes (Single Business Sidebar Layout) */}
            <Route path="/business/login" element={<BusinessLoginPage />} />
            <Route element={<BusinessDashboardLayout />}>
              <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
              <Route path="/business/gis" element={<BusinessGisPage />} />
              <Route path="/business/properties" element={<BusinessPropertiesPage />} />
              <Route path="/business/market-intelligence" element={<BusinessMarketIntelligencePage />} />
              <Route path="/business/upcoming-development" element={<BusinessUpcomingDevelopmentPage />} />
            </Route>

            {/* Authenticated Administrator Dashboard Layout (Untouched) */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/administrator/dashboard" element={<DashboardPage />} />
              <Route path="/gis" element={<GisPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/land-use" element={<LandUsePage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/ai-planner" element={<AiPlannerPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
