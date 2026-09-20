PHOTO FIX v5
The previous build only searched a small fixed list of Lebanese retailer APIs. Products such as ACTI JOINT / ACTI VISION were not in those APIs, so the endpoint returned no image at all.

v5 changes:
- Searches the web by exact product name on the Vercel server.
- Returns the chosen image through SAME-ORIGIN /api/product-image, so the customer's browser does not contact the external image host.
- Retries temporary failures up to 3 times instead of permanently marking the product as checked after one failure.
- Processes up to 24 visible missing products per page.
- Image proxy checks content type and caches successful images on Vercel.

Deploy the ENTIRE ZIP because /api/product-image.js is required.
