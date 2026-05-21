import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from './components/app-shell';
import { MarketingShell } from './components/marketing-shell';
import { ProtectedRoute } from './components/protected-route';
import { ReviewProvider } from './context/review-context';
import { ProfileSettingsProvider } from './context/profile-settings-context';
import { DashboardPage } from './pages/dashboard-page';
import { MarketingPage } from './pages/marketing-page';
import { ProfilePage } from './pages/profile-page';
import { PrivacyPage } from './pages/privacy-page';
import { ResourcesPage } from './pages/resources-page';
import { RoadmapPage } from './pages/roadmap-page';
import { SavedReviewsPage } from './pages/saved-reviews-page';

function App() {
  const appRoute = (page: ReactNode) => (
    <AppShell>
      <ProtectedRoute>{page}</ProtectedRoute>
    </AppShell>
  );

  return (
    <ReviewProvider>
      <ProfileSettingsProvider>
        <Routes>
          {/* Public marketing routes */}
          <Route
            path="/"
            element={
              <MarketingShell>
                <MarketingPage />
              </MarketingShell>
            }
          />
          <Route
            path="/privacy"
            element={
              <MarketingShell>
                <PrivacyPage />
              </MarketingShell>
            }
          />
          <Route
            path="/resources"
            element={
              <MarketingShell>
                <ResourcesPage />
              </MarketingShell>
            }
          />

          {/* Protected app routes */}
          <Route
            path="/app"
            element={appRoute(<DashboardPage />)}
          />
          <Route
            path="/app/roadmap"
            element={appRoute(<RoadmapPage />)}
          />
          <Route
            path="/app/resources"
            element={appRoute(<ResourcesPage />)}
          />
          <Route
            path="/app/saved-reviews"
            element={appRoute(<SavedReviewsPage />)}
          />
          <Route
            path="/app/profile"
            element={appRoute(<ProfilePage />)}
          />
          <Route
            path="/app/privacy"
            element={appRoute(<PrivacyPage />)}
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileSettingsProvider>
    </ReviewProvider>
  );
}

export default App;
