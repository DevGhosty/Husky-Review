import { Navigate, useLocation } from 'react-router-dom';

/** @deprecated Use /legal#privacy — kept for imports that may still reference PrivacyPage. */
export function PrivacyPage() {
  const location = useLocation();
  const target = location.pathname.startsWith('/app') ? '/app/legal#privacy' : '/legal#privacy';
  return <Navigate to={target} replace />;
}
