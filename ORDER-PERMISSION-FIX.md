# Customer order permission fix

The checkout creates delivery orders with status `New` and pickup orders with status `New pickup`. The previous Firestore rule only allowed `New`, so pickup orders were rejected with `Missing or insufficient permissions`.

## Required deployment
1. Replace the project files in GitHub with this package.
2. In Firebase Console, open Firestore Database → Rules.
3. Paste the included `firestore.rules` and click Publish.
4. Wait for Vercel to deploy, then hard-refresh with Ctrl+F5.
5. Test one delivery order and one pickup order while signed in as a customer.
