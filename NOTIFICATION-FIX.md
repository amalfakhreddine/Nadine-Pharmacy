# Notification sound fix

This version adds a real WAV alarm file and uses browser audio playback rather than relying only on an AudioContext oscillator.

## Deployment
1. Upload all files to the GitHub repository, including `order-alert.wav` and `notification-sw.js`.
2. Wait for Vercel deployment.
3. Open `/admin` in Chrome or Edge.
4. Press **Enable computer alerts** once.
5. Allow notifications when the browser asks.
6. Keep the admin page open in a tab. The alarm repeats until the order alert is opened/dismissed.

## Important limitation
This is a live browser alert while the admin dashboard is open. Notifications while the browser is fully closed require Firebase Cloud Messaging plus a trusted backend/Cloud Function. Static Vercel HTML alone cannot securely send those background push notifications.
