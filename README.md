# Nadine Parapharm — Supabase-only build

This build uses:
- Supabase for authentication, database, row-level security, and realtime.
- Vercel for hosting/serverless email notification endpoint.
- GitHub for source control.

## Required Vercel environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-side only; never put this key in HTML)
- GMAIL_USER
- GMAIL_APP_PASSWORD
- ORDER_EMAIL_TO (optional)

The browser uses the Supabase publishable key in `supabase-data.js`.

## Before deleting the old backend
1. Verify admin login and Google login.
2. Verify customer login.
3. Verify products/categories appear on both admin and storefront.
4. Place a test order and verify it appears in Admin.
5. Verify reviews/settings/customer profiles you need are present.
6. Export/archive old data if you want a backup.
7. Only then delete/disable the old project.

See `SAFE-OLD-BACKEND-CLEANUP.txt` for the deletion checklist.
