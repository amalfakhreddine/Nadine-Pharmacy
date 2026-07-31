# Free order notifications — no Firebase Blaze plan

This version uses three notification methods:

1. **Admin page alert:** instant sound, toast and desktop notification while the admin page is open.
2. **Background push:** a free Vercel server function sends Firebase Cloud Messaging notifications when the page is closed.
3. **Email:** every new order is emailed to **nadinepharmacy6@gmail.com**.

## What you must add in Vercel

Open the Vercel project → **Settings → Environment Variables** and add:

- `FIREBASE_PROJECT_ID` = `nadine-parapharmacy`
- `FIREBASE_CLIENT_EMAIL` = the `client_email` from a Firebase service-account JSON file
- `FIREBASE_PRIVATE_KEY` = the complete `private_key` from that JSON file
- `GMAIL_USER` = `nadinepharmacy6@gmail.com`
- `GMAIL_APP_PASSWORD` = the 16-character Google App Password (not the normal Gmail password)
- `ORDER_EMAIL_TO` = `nadinepharmacy6@gmail.com`
- `ADMIN_URL` = the full deployed admin URL, for example `https://YOUR-SITE.vercel.app/admin.html`

## Get the Firebase service-account values

Firebase Console → Project settings → Service accounts → Generate new private key.
Open the downloaded JSON only to copy `client_email` and `private_key` into Vercel. Never upload or commit the JSON file.

## Get the Gmail app password

On the parapharmacy Google account, turn on 2-Step Verification, then create an App Password. Copy the 16-character value into `GMAIL_APP_PASSWORD` in Vercel. Do not put the normal Gmail password in the website.

## Publish

Upload this project to the same GitHub repository connected to Vercel, or deploy it through Vercel. Vercel will install the root `package.json` automatically and publish `/api/notify-order`.

After deployment:

1. Open `admin.html` and sign in.
2. Press **Enable background alerts** and allow notifications.
3. Press **Test notification**.
4. Place a test order from the customer website.
5. Confirm the email arrives at `nadinepharmacy6@gmail.com` and the admin device receives the push alert.

No `firebase deploy --only functions` command is needed for this version.
