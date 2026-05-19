import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { MarketingShell } from './components/marketing-shell';
import { ReviewProvider } from './context/review-context';
import { ProfileSettingsProvider } from './context/profile-settings-context';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';
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
        <Route
          path="/"
          element={
            <MarketingShell>
              <MarketingPage />
            </MarketingShell>
          }
        />
        <Route
          path="/login"
          element={
            <MarketingShell>
              <LoginPage />
            </MarketingShell>
          }
        />
        <Route
          path="/app"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/app/roadmap"
          element={
            <AppShell>
              <RoadmapPage />
            </AppShell>
          }
        />
        <Route
          path="/app/resources"
          element={
            <AppShell>
              <ResourcesPage />
            </AppShell>
          }
        />
        <Route
          path="/app/saved-reviews"
          element={
            <AppShell>
              <SavedReviewsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/privacy"
          element={
            <AppShell>
              <PrivacyPage />
            </AppShell>
          }
        />
        <Route
          path="/app/profile"
          element={
            <AppShell>
              <ProfilePage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ProfileSettingsProvider>
    </ReviewProvider>
  );
}

export default App;
