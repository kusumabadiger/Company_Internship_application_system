import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ApplyPage } from './pages/ApplyPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackPage } from './pages/TrackPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDetailView } from './pages/AdminDetailView';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
          <Navbar />
          <main className="grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/apply" element={<ApplyPage />} />
              <Route path="/application-confirmation" element={<ConfirmationPage />} />
              <Route path="/track" element={<TrackPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Administrator Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/applications" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/applications/:applicationId" element={<AdminDetailView />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
