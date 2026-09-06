# Falcon Feather POS — Complete V4

Professional React + Vite + Supabase POS for Falcon Feather Book House & Communication.

## Included in this version

- Supabase email/password registration and login
- Protected POS pages and working logout
- Product catalogue and fully editable product side drawer
- Barcode generation/display/scanning
- Inventory and stock receiving
- Stock alerts
- Sales history
- Click any sale to open the original bill
- Reprint any historical bill in A4 format
- Automatic A4 print dialog immediately after checkout
- Epson / Canon / HP / any OS-installed printer support through the browser print dialog
- Monthly Profit & Loss report
- Yearly Profit & Loss report
- View report breakdown inside the app
- Download P&L as PDF
- Download P&L as CSV
- Account Settings page
- Edit full name, email and phone number
- Upload and display a profile picture
- Vercel SPA configuration

## Install

```bash
npm install
npm run dev
```

Production test:

```bash
npm run build
```

## Supabase environment variables

`.env` is ignored by Git. Configure these locally and in Vercel:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Never use a Supabase `service_role` key in this frontend.

## Profile pictures — one-time Supabase setup

Run:

`supabase_avatar_setup.sql`

in:

Supabase → SQL Editor

This creates a public `avatars` bucket and policies allowing each authenticated user to upload only inside their own folder.

Then the user can click their profile at the bottom-left of the sidebar → Account Settings → Change Photo.

## Profit & Loss calculation

The report uses:

Profit / Loss = Sales Revenue − Cost of Goods Sold

Cost of Goods Sold is calculated from each sold item's quantity × the linked product `cost_price`.

For accurate reports, keep every product's cost price correct.

## Sales / receipts

Sales History now loads sale items with the product name and barcode.

Click a row to:
- View the full bill
- Print it again

The receipt print layout is A4.

## Checkout printing

On the payment dialog there is an option:

`Automatically open A4 print dialog after payment`

It is ON by default.

After successful checkout:
1. The sale is saved in Supabase.
2. Stock is updated using the existing `checkout_sale` RPC.
3. An A4 invoice is generated.
4. The browser print dialog opens.
5. Select Epson or any printer installed on the computer.

Web browsers cannot silently select a physical printer without user permission, so the normal system print dialog is used. This is the portable approach for Epson and other printers.

## Required existing database

This version expects the existing Falcon Feather database:
- categories
- products
- sales
- sale_items
- stock_movements
- inventory_alerts

Existing RPC functions:
- add_stock(...)
- checkout_sale(...)

`products.cost_price` is required for profit/loss reporting.

## Vercel

`vercel.json` is included.

Vercel settings:
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Install: `npm install`

Set your Supabase URL and public key in Vercel Environment Variables.

For Supabase email confirmation, set:
- Authentication → URL Configuration → Site URL = your Vercel URL
- Redirect URL = `https://YOUR-VERCEL-DOMAIN/**`
