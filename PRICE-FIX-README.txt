PRICE AND PRODUCT NAME FIX

Upload the contents of this folder into your existing GitHub repository,
replacing the matching files and including catalog-recovery.js.
After Vercel finishes deploying, refresh the shop and admin pages.
No product deletion, reimport, or SQL setup is required for this fix.

Cause: category and description repairs used a replacement bulk upsert with
only the changed fields. This could erase the rest of a product document.
Those repairs now request a merge with the existing document.

Missing names and prices are recovered at read time using the bundled catalog,
matched by product ID or an unambiguous exact normalized name. All 2,236 bundled
prices were checked against nadineparapharm_products_image_ready(1).xlsx and
agree within rounding to cents. Valid live prices, stock and visibility are kept.
Unknown products with no recoverable price show Price unavailable and cannot be
added to the customer cart. Existing cart entries are refreshed from the catalog.

This ZIP updates application code. No live database or deployment was changed
while preparing it. Recovery does not reconstruct any lost custom fields or
previous custom prices that are absent from the supplied catalog.

Checks: all bundled products recovered from simulated damaged records, valid
live price/zero price/stock/visibility preserved, merge adapters tested with a
mock database, and inline JavaScript syntax checked. Live checkout was not tested.
