NADINE PARAPHARMACY — FULL SHEET IMPORT

Catalog source: xxxx(1).xlsx
Products included: 2,236
- Names and prices are taken from the spreadsheet.
- Products are assigned to storefront categories automatically by product name/type.
- Each product has a same-origin /api/product-photo image URL.
- The Vercel server searches the exact product name + product packshot and proxies the image, so customers in Lebanon do not connect directly to the external image host.
- On first admin login after deployment, the database product catalog is synchronized to this spreadsheet build and the category list is saved.

Deploy the ENTIRE ZIP, including /api, preloaded-products.js, index.html and admin.html.
