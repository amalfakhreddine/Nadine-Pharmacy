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
Create the first pharmacy admin in Firebase Authentication using the exact email in `firebase-config.js` (`NADINE_ADMIN_EMAIL`). After first login, an authorised admin can add more admin emails under **Settings → Admin access emails**. Create each account in Firebase Authentication first. Do not store or publish passwords in this repository.

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

## Managing authorised admins
1. In Firebase Console, open **Authentication → Users** and create each admin account first.
2. Sign in to the admin dashboard with an already authorised account.
3. Open **Settings → Admin access emails**.
4. Enter one authorised email per line and save.
5. Any email in this list can sign in, manage the website, and edit the shared Admin Profile.

Keep at least one authorised email. Removing your current email signs you out. Publish the included `firestore.rules` before using this feature. The first login with the original admin email creates the secure `settings/adminAccess` document automatically.


## Customer and admin profiles
This version adds Firestore-backed customer profiles and one shared admin profile stored at `settings/adminProfile`. Every authorised admin can read and edit the shared pharmacy identity, phone number and job title. Publish the included Firestore rules.


## Customer profile and persistent sign-in fix
Customer login now explicitly uses Firebase local persistence, so refreshing or reopening the browser should keep the customer signed in. Customer profile data is saved to `profiles/{customerUid}` and also cached on the current device as a fallback. You must publish the included `firestore.rules` in Firebase Console for cloud profile saving to work.
## Customer profile cloud sync
Customer profile details are stored in Firestore at `profiles/{customer UID}`. They automatically load on every device where the customer signs into the same Firebase account. Publish the included `firestore.rules` for this to work.



## Service-link update
- Tripoli delivery card opens delivery details.
- Pickup card opens the pharmacy Google Maps location.
- Consultation and floating/footer WhatsApp links use +961 71 979 118.
- Pharmacist verification card filters the shop to prescription-required products.
- Opening hours are Monday–Saturday 8:30 AM–9:00 PM; Sunday closed.

## Prescription product filter
The customer shop category filters include a dedicated **Prescription required** option. It displays only products marked as prescription-required by the pharmacy and shows a pharmacist-verification notice.
