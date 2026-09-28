# AutoBill — Vehicle Showroom Billing (Demo)

A billing and inventory dashboard for a vehicle showroom — customers, stock, GST invoices and a sales report, all in the browser.

## Overview
AutoBill recreates the *kind* of software used to run day-to-day billing at a vehicle dealership: adding stock, registering customers, raising a GST invoice for a sale, and reviewing sales over time. It's built as an original demo for this portfolio — it uses fictional vehicle models and does not contain any code or data from a real employer's system.

## Live Demo
🔗 Add the link here once this repo is deployed on GitHub Pages
(Settings → Pages → Deploy from branch → main → / (root))

## Features
- **Dashboard** — quick stats (stock count, customers, invoices, revenue) + recent invoices
- **New Invoice** — pick a customer, add one or more vehicles, auto-calculates GST and grand total, prints/saves as PDF
- **Stock** — add/remove vehicles with price, GST% and quantity; stock reduces automatically as invoices are raised
- **Customers** — simple customer book, or add one on the fly while billing
- **Sales Report** — filter invoices by date range, see total revenue, reprint any past invoice

## Tech Stack
- HTML5, CSS3, vanilla JavaScript — no framework, no build step
- Data stored in the browser (`localStorage`) — no backend server
- Printing uses the browser's own **Print → Save as PDF**, so no PDF library is needed

## How It Works — Code Walkthrough
- **Data model** (`app.js`): three arrays — `stock`, `customers`, `invoices` — kept in `localStorage` as JSON. A small `nextId()` helper makes unique IDs without a database.
- **Tabs**: one `<section>` per tab in `index.html`; a single click listener on `.tab-btn` shows the matching section and hides the rest — no routing library needed for a single page like this.
- **Invoice building**: while you're adding vehicles, the line items live in an in-memory array `currentLines` (not saved yet). Each line stores the vehicle's price and GST% *at the time it was added*, so later stock/price edits don't change an invoice that's already in progress.
- **GST calculation**: for each line, `lineTotal = price × qty`, `gstAmount = lineTotal × gst / 100`. These are summed across lines, a flat discount is subtracted, and the result is the grand total — the same pattern used in most real invoicing software, simplified to a single GST% per vehicle for this demo (a production version would split CGST/SGST/IGST based on the buyer's state).
- **Generating an invoice**: `btn-generate-invoice` validates a customer and at least one line are present, computes totals, pushes a new invoice object into the `invoices` array, **decrements stock quantities**, saves everything to `localStorage`, and calls `printInvoice()`.
- **Printing**: `printInvoice()` fills a hidden `#print-invoice` div with a clean, black-on-white invoice layout, adds a `printing-invoice` class to `<body>`, and calls `window.print()`. A `@media print` rule in `style.css` hides everything *except* that div while printing, so the browser's print dialog only ever shows the invoice — the person can "Save as PDF" from there.
- **Sales Report**: filters the `invoices` array by date string comparison (`YYYY-MM-DD` sorts correctly as text) and sums the `total` field of whatever matches.

## Run Locally
Just open `index.html` in any modern browser — no server or build step required.

## Notes
- This is an original demo project built for portfolio purposes.
- It recreates the *type* of billing software built at a vehicle dealership job, using fictional vehicle names and sample data — no confidential company code, data or design is used here.
- GST handling is simplified for a demo (single %, no CGST/SGST/IGST split, no HSN codes).
