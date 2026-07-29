# Nadine Parapharm — Manager-ready upgrade

## Included
- Live dashboard greeting, daily KPIs and charts
- Clearer new-order cards and real-time in-app/browser alerts
- Brand, generic ingredient and barcode product fields
- Camera barcode detection where the browser supports BarcodeDetector
- Analytics, best sellers and sales reports
- Excel exports for orders, inventory and customers
- Customer directory
- Inventory audit history
- Wishlist, recently viewed, related products and customer reviews
- Search suggestions and search by product, brand, generic name or barcode

## Required deployment steps
1. Replace the files in GitHub and wait for Vercel to redeploy.
2. Publish `firestore.rules` in Firebase Console → Firestore → Rules.
3. Hard-refresh the admin and customer websites with Ctrl+F5.
4. Browser notifications require the admin to click **Enable alerts** and allow notifications. They work best while the browser is running.

## Important about email
Automatic email delivery is not possible from static HTML alone. It still requires Firebase Trigger Email with working SMTP or a server-side function. The in-dashboard alert, sound and browser notification work without exposing email credentials.
