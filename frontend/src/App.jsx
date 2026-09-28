import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider } from './context/FarmContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { WeatherPage } from './pages/WeatherPage';
import { ETAnalysisPage } from './pages/ETAnalysisPage';
import { SoilMonitoringPage } from './pages/SoilMonitoringPage';
import { IrrigationPage } from './pages/IrrigationPage';
import { CropManagementPage } from './pages/CropManagementPage';
import { FarmZonesPage } from './pages/FarmZonesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PredictionsPage } from './pages/PredictionsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <FarmProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="predictions" element={<PredictionsPage />} />
              <Route path="farms" element={<FarmsPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="et-analysis" element={<ETAnalysisPage />} />
              <Route path="soil" element={<SoilMonitoringPage />} />
              <Route path="irrigation" element={<IrrigationPage />} />
              <Route path="crops" element={<CropManagementPage />} />
              <Route path="zones" element={<FarmZonesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </FarmProvider>
    </AuthProvider>
  );
};

export default App;
