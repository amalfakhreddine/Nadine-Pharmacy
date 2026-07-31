# START HERE — REAL PUSH NOTIFICATIONS

This project now contains the missing `functions/` backend.

## Deploy once

1. Upgrade the Firebase project to Blaze.
2. Install Node.js 20 or newer.
3. Open a terminal in this project folder.
4. Run:

```bash
npm install -g firebase-tools
firebase login
firebase use nadine-parapharmacy
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions
```

5. Push the whole project to GitHub/Vercel.
6. On every admin device, open `/admin`, sign in with `nadinepharmacy@gmail.com`, press **Enable background alerts**, then **Test notification**.

## iPhone

Open the site in Safari, use Share → Add to Home Screen, open the installed icon, sign in, then enable alerts.

## Android

Open in Chrome, install/add to home screen, open it, sign in, then enable alerts.
