import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImageAnalysisPage } from './pages/ImageAnalysisPage'
import { VideoAnalysisPage } from './pages/VideoAnalysisPage'
import { AudioAnalysisPage } from './pages/AudioAnalysisPage'
import { DocumentAnalysisPage } from './pages/DocumentAnalysisPage'
import { ResultsPage } from './pages/ResultsPage'
import { CorrelationPage } from './pages/CorrelationPage'
import { HistoryPage } from './pages/HistoryPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page (No sidebar layout) */}
        <Route path="/" element={<LandingPage />} />

        {/* Forensic Workspace Pages (Inside AppLayout) */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/analyze/image"
          element={
            <AppLayout>
              <ImageAnalysisPage />
            </AppLayout>
          }
        />
        <Route
          path="/analyze/video"
          element={
            <AppLayout>
              <VideoAnalysisPage />
            </AppLayout>
          }
        />
        <Route
          path="/analyze/audio"
          element={
            <AppLayout>
              <AudioAnalysisPage />
            </AppLayout>
          }
        />
        <Route
          path="/analyze/document"
          element={
            <AppLayout>
              <DocumentAnalysisPage />
            </AppLayout>
          }
        />
        <Route
          path="/results/:id"
          element={
            <AppLayout>
              <ResultsPage />
            </AppLayout>
          }
        />
        <Route
          path="/correlation"
          element={
            <AppLayout>
              <CorrelationPage />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          }
        />
        <Route
          path="/about"
          element={
            <AppLayout>
              <AboutPage />
            </AppLayout>
          }
        />
        <Route
          path="/help"
          element={
            <AppLayout>
              <ContactPage />
            </AppLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
