# Email notification setup — required once

The website now creates an email request for every successfully placed order and sends it only to **amalfakhreddinem@gmail.com**. The email contains a button that opens the exact order and receipt in `admin.html`.

## 1. Upload these files
Replace the project files in GitHub with this package and let Vercel deploy.

## 2. Publish the included Firestore rules
In Firebase Console: **Firestore Database → Rules**, replace the rules with `firestore.rules`, then press **Publish**.

## 3. Install Firebase Trigger Email
In Firebase Console open **Extensions**, search for **Trigger Email**, and install the official extension.

Use these values during installation:

- **Email documents collection:** `mail`
- **Default FROM address:** an address controlled by the pharmacy
- Configure the SMTP provider requested by the extension. Gmail can be used with an app password, but a transactional provider is usually more reliable.

Firebase may require the project to use the Blaze billing plan for extensions. The email provider can also charge according to its own plan.

## 4. Test
Place a new test order from the customer website. A message should arrive at **amalfakhreddinem@gmail.com**. Press **Open this order**. After admin sign-in, the exact order receipt opens automatically.

## Important
Do not put a Gmail password, app password, or email API key into `index.html`, `admin.html`, GitHub, or Vercel public files. Those credentials belong only in the Firebase extension's protected configuration.
