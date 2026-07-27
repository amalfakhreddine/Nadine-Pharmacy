# Nadine Pharmacy admin upgrade

This version stores products, categories and orders in Firebase Cloud Firestore.

## One required Firebase step
Open Firebase Console → Firestore Database → Rules. Replace the existing rules with the contents of `firestore.rules`, then click Publish.

## Deploy
Commit all files to the connected GitHub repository. Vercel will deploy automatically.

## Pharmacy workflow
The pharmacy only opens `/admin.html`. It can add, edit and delete products, change prices and stock, manage categories, process orders, review order history and change the admin password. Changes to products and categories appear live on the customer website on every device.

Images are compressed in the browser and limited to three per product to stay within Firestore document limits.
