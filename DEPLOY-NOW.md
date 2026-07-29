# Guaranteed customer order fix

1. Replace the project files in GitHub with these files.
2. In Firebase Console open Firestore Database > Rules.
3. Paste the supplied firestore.rules and click Publish.
4. Wait for Vercel, then hard-refresh with Ctrl+F5.
5. Sign in as a customer and test pickup and delivery.

Checkout now creates the order using one secure Firestore write. Customer-side stock updates and the optional mail queue were removed from checkout because either could reject the full transaction. Orders use stockAdjusted:false so the admin can confirm stock during processing.
