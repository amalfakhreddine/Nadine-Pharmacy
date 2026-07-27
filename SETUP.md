# Nadine Pharmacy – Setup

## 1. Firebase Authentication
In Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password**.
- Enable **Google**.
- Apple is not used.

Add your Vercel domain under Authentication → Settings → Authorized domains.

## 2. Admin account
Authentication → Users → Add user. Use `nadinepharmacy@gmail.com` for the first admin, or update both `NADINE_ADMIN_EMAIL` in `firebase-config.js` and the fallback email in `firestore.rules`. After first login, add further authorised accounts from **Admin → Settings → Admin access emails**.

## 3. Firestore
Create Firestore in Production mode. Open Firestore → Rules, replace the rules with `firestore.rules`, and press **Publish**. These rules let any configured authorised admin manage the catalog, orders, settings and the shared admin profile, while signed-in customers can place orders and only decrement stock.

## 4. Deploy
Upload or commit all files together with these exact names:
- `index.html`
- `admin.html`
- `firebase-config.js`
- `firestore.rules`
- `vercel.json`

Vercel deploys the customer site at `/` and the admin dashboard at `/admin.html`.

## 5. Test before launch
1. Sign in with Google and email/password.
2. Test password reset and sign-out.
3. Place an order and confirm stock decreases.
4. Cancel the order in admin and confirm stock returns.
5. Check My Orders and admin order history.
6. Test phone, map, WhatsApp and policy links on mobile.

## Security note
Firebase web configuration is intentionally visible in browser code; security depends on Authentication and Firestore rules. For card payments or high-value orders, use a server/Cloud Function for authoritative totals and payment processing.


## 6. Multiple admins and shared profile
Create every administrator in Firebase Authentication first. In the admin dashboard, open **Settings → Admin access emails**, enter one email per line, and save. All listed admins can edit the same shared profile under **Admin Profile**.


## Customer profile and persistent sign-in fix
Customer login now explicitly uses Firebase local persistence, so refreshing or reopening the browser should keep the customer signed in. Customer profile data is saved to `profiles/{customerUid}` and also cached on the current device as a fallback. You must publish the included `firestore.rules` in Firebase Console for cloud profile saving to work.
