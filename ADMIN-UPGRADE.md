# Nadine Parapharmacy complete upgrade

This version uses Firebase Authentication and Cloud Firestore for customers, products, categories, stock and orders.

## Included upgrades
- Google and email sign-in only; Apple removed
- Customer and admin password reset
- Customer account menu and sign-out
- Transactional order placement using current Firestore prices and stock
- Automatic inventory decrease and cancellation restock
- Multiple authorised admin emails
- Shared admin profile editable by every authorised admin
- Updated Firestore rules
- Privacy, terms, delivery/returns and prescription policies
- WhatsApp contact button
- Updated documentation

## Required Firebase step
Publish the included `firestore.rules` in Firebase Console → Firestore Database → Rules.

## Deploy
Commit every file to the connected GitHub repository. Vercel will redeploy automatically.
