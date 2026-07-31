# Secure admin login fix

- The dashboard is hidden by default and cannot appear until Firebase confirms a signed-in, authorised admin.
- Authentication persistence uses SESSION: refreshes stay signed in, but closing the browser session requires signing in again.
- Unauthorised accounts are signed out immediately.
- The main parapharmacy email remains authorised only after successful Firebase password authentication.
