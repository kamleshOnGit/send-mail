// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
// 1. Copy this file twice:
//      cp environment.template.ts environment.ts          (local dev)
//      cp environment.template.ts environment.prod.ts     (production)
//
// 2. Replace REPLACE_WITH_YOUR_CLIENT_ID in both copies with your
//    Google OAuth 2.0 Client ID from:
//    https://console.cloud.google.com → APIs & Services → Credentials
//
// 3. Never commit environment.ts or environment.prod.ts — they are in .gitignore
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
  production: false,
  googleClientId: '462804174068-i6mo9v0eg6aq2sja08f4q8a2g6admi2d.apps.googleusercontent.com',
};
