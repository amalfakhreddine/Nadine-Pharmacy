# Firestore transaction ordering fix

The checkout transaction now completes every product read before performing any stock or order writes.

This fixes:

`Firestore transactions require all reads to execute before all writes.`

No Firestore rules change is required if the latest order-permission rules are already published.
