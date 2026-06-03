/**
 * Auth0 Post-Login Action: Google-only + @uw.edu + Supabase role claim.
 * Deploy with: npm run auth0:setup (requires Auth0 CLI login or Management API credentials).
 */
exports.onExecutePostLogin = async (event, api) => {
  const claimNamespace = (event.secrets.CLAIM_NAMESPACE || 'https://husky-review.app/claims').replace(/\/+$/, '');

  if (event.connection.strategy !== 'google-oauth2') {
    api.access.deny('google_required', 'Use Google sign-in to access Husky-Review.');
    return;
  }

  const email = (event.user.email || '').toLowerCase();
  if (!email.endsWith('@uw.edu')) {
    api.access.deny('uw_email_required', 'Use a @uw.edu Google account to access Husky-Review.');
    return;
  }

  api.idToken.setCustomClaim('role', 'authenticated');
  api.idToken.setCustomClaim(`${claimNamespace}/email`, email);
  api.idToken.setCustomClaim(`${claimNamespace}/role`, 'authenticated');
  api.accessToken.setCustomClaim(`${claimNamespace}/email`, email);
  api.accessToken.setCustomClaim(`${claimNamespace}/role`, 'authenticated');
};
