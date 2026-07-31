NADINE PARAPHARMACY — ORDER DISPLAY FIX

What was fixed:
- The admin now listens to the complete Firestore orders collection without orderBy.
- Orders are sorted safely in the browser, so one old/malformed timestamp cannot stop all orders from loading.
- Firebase read errors are now shown clearly.
- New orders also store a server timestamp for future reliability.

DEPLOYMENT:
1. Upload/replace every file in this folder in the GitHub repository.
2. Wait for Vercel to finish deploying.
3. In Firebase Console, open Firestore Database > Rules.
4. Paste the contents of firestore.rules and click Publish.
5. On both the customer and admin pages, press Ctrl+F5.
6. Sign in to admin using nadinepharmacy@gmail.com and place a fresh test order from a customer account.

Important: A successful customer confirmation means Firestore accepted the order. If admin then displays a permission error, the Firestore rules were not published or the admin is signed into a different email.
