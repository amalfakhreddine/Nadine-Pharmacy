# FCM permission fix — publish this rule

The VAPID key is configured correctly. The error came from the Firestore rule for `adminPushTokens`.

## Required

1. Open Firebase Console.
2. Go to **Firestore Database → Rules**.
3. Replace the rules with the included `firestore.rules`.
4. Click **Publish**.
5. Wait about 30 seconds.
6. Open the admin website, press **Ctrl + F5**, sign in with `nadinepharmacy@gmail.com`, and press **Enable background alerts**.

Uploading the files to GitHub/Vercel alone does not publish Firestore rules.
