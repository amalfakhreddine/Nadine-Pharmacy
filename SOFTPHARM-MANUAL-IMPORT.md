# SoftPharm manual product import

1. In SoftPharm, export the product/stock list to Excel/PDF or CSV.
2. Open the website Admin panel and choose **Import from SoftPharm**.
3. Upload the exported file.
4. Search and tick only the skincare, supplements, vitamins, baby care, cosmetics, or other products you are allowed to sell online.
5. Choose a fallback website category if the file has no matching category.
6. Press **Import selected products**.

Existing products are matched by barcode first and then by product name. Their website images and descriptions are preserved; price and stock are updated. No automatic connection or background sync is used.


## PDF imports
The admin SoftPharm importer also accepts `.pdf` files. PDF exports must contain selectable table text (not only a scanned image). The importer reads common English and French SoftPharm-style headings, then shows the same product preview and selection controls before anything is imported.
