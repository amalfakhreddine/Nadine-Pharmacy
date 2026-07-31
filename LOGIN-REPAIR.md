# Admin login repair

This repair keeps the parapharmacy's primary Firebase admin account permanently recognized:

- nadinepharmacy@gmail.com

It also restores the centered login layout and preserves Firebase LOCAL session persistence after refresh.

Deployment:
1. Replace the existing project files with this folder's contents.
2. Let Vercel deploy.
3. On the admin page, press Ctrl+F5 once.
4. Sign in once. Later refreshes should keep the session.

No Firestore rules update is required for this repair.
