# SoftPharm Connector — Step 1

This folder is the first real step toward automatic SoftPharm syncing.

## What this tool does

- Finds local SQL Server services and instances.
- Connects using Windows authentication.
- Lists databases.
- Lets you choose the database that belongs to SoftPharm.
- Reads table and column names only.
- Finds likely product, barcode, category, price, stock and expiry fields.
- Creates a report file.

## What it does NOT do

- It does not change SoftPharm.
- It does not delete or edit any data.
- It does not upload products yet.
- It does not collect SQL passwords.

## How to run it at the parapharmacy

1. Copy this `SoftPharm-Connector` folder to the computer or server where SoftPharm is installed.
2. Right-click `RUN-DISCOVERY.bat`.
3. Choose **Run as administrator** if Windows blocks access.
4. Select the database that looks related to SoftPharm.
5. Wait for the tool to finish.
6. Open the `report` folder.
7. Send the generated `.txt` report to the developers.

After the report is reviewed, the final connector can be built with:

- automatic category detection and mapping
- medicine exclusion
- barcode-based duplicate prevention
- new product creation
- price and stock updates
- product hiding when unavailable
- scheduled sync
- sync logs and error notifications

Do not post the report publicly. It contains database structure names, although it does not contain passwords.
