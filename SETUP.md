# Nadine Pharmacy – Firebase setup

This version stores orders in Cloud Firestore, so orders made on any phone appear live in the admin dashboard on every device.

## 1. Create Firebase project
1. Open Firebase Console and create a project.
2. Add a **Web app**.
3. Copy the Firebase config into `firebase-config.js`.

## 2. Enable sign-in
Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password**.
- Enable **Google** if desired.
- Apple requires an Apple Developer configuration; leave it disabled until configured.

## 3. Create admin account
Authentication → Users → Add user.
Use the pharmacy owner's email and a strong password.
Put the exact same email in `firebase-config.js` as `NADINE_ADMIN_EMAIL`.

## 4. Create Firestore
Firestore Database → Create database → Production mode.
Open `firestore.rules`, replace `admin@example.com` with the same admin email, then paste/publish the rules in Firebase Console → Firestore → Rules.

## 5. Deploy to Vercel
Upload all files in this folder together. Do not upload only `index.html`.
- Customer: `/`
- Admin: `/admin.html`

## Important
The website will show a Firebase configuration warning until `firebase-config.js` is filled in. Never use open/public Firestore rules for customer orders.
