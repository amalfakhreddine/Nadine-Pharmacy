# Reviews system setup

1. Upload all files in this folder to the GitHub repository and wait for Vercel to redeploy.
2. Open Firebase Console → Firestore Database → Rules.
3. Replace the current rules with the included `firestore.rules` and click **Publish**.
4. Refresh the customer and admin pages with Ctrl + F5.

## Workflow
- A customer must sign in.
- The customer can review only a product contained in one of their **Delivered** or **Collected** orders.
- The review enters Firestore with status `pending`.
- Admin opens **Reviews**, sees the customer and order, then approves, hides/rejects, replies, or deletes it.
- Only approved reviews appear publicly.
