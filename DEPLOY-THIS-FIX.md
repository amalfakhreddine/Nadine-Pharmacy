# Authentication and Firestore permission fix

This build fixes the mismatch between the admin website and Firestore rules.

## Required steps

1. Replace the project files in GitHub with this folder.
2. In Firebase Console, open **Firestore Database → Rules**.
3. Replace the rules with the included `firestore.rules`.
4. Click **Publish**. This step is mandatory.
5. Wait for Vercel to finish deploying.
6. Open `/admin`, press **Ctrl + F5**, and sign in with `nadinepharmacy@gmail.com`.

The primary pharmacy account still requires its correct Firebase password. Other administrators must exist in Firebase Authentication and be listed in `settings/adminAccess`.
