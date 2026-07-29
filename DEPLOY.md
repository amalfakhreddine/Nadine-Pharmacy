# Stable primary-admin fix

1. Upload all files to GitHub using these exact filenames.
2. In Firebase Console open Firestore Database → Rules.
3. Replace the current rules with `firestore.rules` from this folder and press Publish.
4. Wait for Vercel deployment, then open `/admin` and press Ctrl+F5.
5. Sign in using `nadinepharmacy@gmail.com` and its Firebase Authentication password.

The dashboard remains hidden until Firebase authenticates that exact account. Login uses LOCAL persistence, so refreshes and browser restarts remain signed in until Logout is pressed.
