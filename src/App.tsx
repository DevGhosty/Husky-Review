import { Navigate, Route, Routes } from 'react-router-dom';
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
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/roadmap"
            element={
              <ProtectedRoute>
                <AppShell>
                  <RoadmapPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/resources"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ResourcesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/saved-reviews"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SavedReviewsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/privacy"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PrivacyPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileSettingsProvider>
    </ReviewProvider>
  );
}

export default App;
