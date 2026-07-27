# Nadine Pharmacy Website

## Files
- `index.html`: customer shop
- `admin.html`: private pharmacy dashboard
- `firebase-config.js`: Firebase project configuration
- `firestore.rules`: required Firestore security rules
- `vercel.json`: Vercel clean URLs

## Features
- Email/password and Google customer sign-in
- Customer password reset and sign-out
- Live products, categories, stock and orders through Firebase Firestore
- Automatic stock reduction when an order is placed
- Automatic stock restoration when the admin cancels an order
- Order tracking, expiry alerts and admin password change/reset
- Privacy, terms, delivery/returns and prescription notices
- Phone, map and WhatsApp contact links

## Admin access
Create the pharmacy admin in Firebase Authentication using the exact email in `firebase-config.js` (`NADINE_ADMIN_EMAIL`). Do not store or publish the password in this repository.

## Important
Publish the supplied `firestore.rules` after every rules change. The website is designed for order requests and cash/pickup workflows. For online card payments or stronger anti-tampering guarantees, add a trusted server or Firebase Cloud Function to calculate and create orders.


## Prescription ordering
Products can be marked as prescription-required in the admin product form. Customers must upload a clear prescription image at checkout when any such product is in the cart. The image is compressed and stored with the Firestore order so the admin can view and verify it. Deploy the included Firestore rules after uploading these files.

## Premium checkout update
This build adds:
- Free pharmacy pickup or Tripoli-only home delivery.
- Admin-controlled delivery charge and free-delivery threshold.
- Full delivery-driver details on every delivery order.
- Separate pickup statuses: New pickup, Preparing, Ready for pickup, Collected.
- Customer wishlist and recently viewed products.
- Smarter search fields and optional product badges.
- Prescription-required products and prescription image verification.
- Admin button to permanently delete test orders.

After uploading the files, sign in to the admin panel, open **Settings**, set the delivery charge, and save.

## Changing the admin email
1. In Firebase Console, open **Authentication → Users** and create the new admin account first.
2. Sign in to the current admin dashboard.
3. Open **Settings → Admin access email**.
4. Enter the new email and save. You will be signed out automatically.
5. Sign in using the new Firebase Authentication account.

Publish the included `firestore.rules` before using this feature. The first login with the original admin email creates the secure `settings/adminAccess` document automatically.


## Customer and admin profiles
This version adds Firestore-backed customer profiles (contact details, default Tripoli delivery address, preferences, account statistics and password reset) and an admin profile (identity, contact details, role and security summary). Publish the included Firestore rules.
