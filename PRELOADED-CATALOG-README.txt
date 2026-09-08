Nadine Parapharm preloaded catalog

Products bundled: 2236
Source: supplied Excel workbook (All Products sheet)
Behavior:
- Customer site can show this catalog immediately on a fresh/empty deployment.
- Admin site automatically seeds the bundled catalog into Supabase the first time the authorized admin opens it, only when the products collection is empty.
- A catalog seed marker prevents accidental re-seeding after the catalog has been initialized.
- Existing Supabase products remain the source of truth after initialization.
- Products without verified photos use the site's existing placeholder until a real image is added.
