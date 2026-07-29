# Firebase Cloud Messaging + Cloud Function setup

The code is included, but Firebase requires these one-time project steps.

1. Upgrade the Firebase project to the **Blaze** plan. Cloud Functions deployment requires billing.
2. Firebase Console → Project settings → Cloud Messaging → Web Push certificates → **Generate key pair**.
3. Copy the **public** key and replace `PASTE_YOUR_PUBLIC_VAPID_KEY_HERE` in `firebase-config.js`. Never place a private key in the website.
4. Install Node.js 20 and Firebase CLI, then from this project folder run:

```bash
npm install -g firebase-tools
firebase login
cd functions
npm install
cd ..
firebase use nadine-pharmacy
firebase deploy --only firestore:rules,functions
```

5. Push all website files to GitHub/Vercel.
6. Open the official HTTPS `/admin` page, sign in as the pharmacy admin, press **Enable background alerts**, and choose **Allow**. Repeat once on every phone/computer that should receive orders.
7. Place a customer test order while the admin tab is closed.

## Important platform behavior

FCM delivers background web push even when the admin tab is closed, provided the browser profile remains installed/available and browser/OS notifications are allowed. Browsers and operating systems control notification sound; a website cannot force a custom loud sound while fully closed. When the admin page is open, the included repeating `order-alert.wav` alarm plays.
