# Snow Bidding Tracker — GitHub Pages package

## What's in here
- `index.html` — the full dashboard (KPIs, status tracking, Contract Accepted map with zoom/pan, everything you've been using), wired for **live Smartsheet sync** on four fields. No build step.
- `config.example.js` — copy to `config.js` and fill in your Worker URL, key and Google Maps key. Your settings live there, so a new `index.html` never wipes them.
- `lib/pdf-lib.min.js` and `templates/*.pdf` — the PDF engine and the contract templates (Owned, Managed, DSS owner contracts plus the three FDI vendor subcontracts: CubeSmart, Seasonal, Per Push). **Upload these folders with `index.html`** — the Create Contract buttons won't work without them.
- `worker.js` — the Cloudflare Worker that does the actual writing to Smartsheet (it holds the API token; the dashboard never does).
- `WORKER_SETUP.md` — the one-time, ~10 minute setup to turn the sync on.

## How to host the dashboard
1. Create a new repo on your GitHub account (e.g. `snow-bidding-tracker`), or reuse an existing one.
2. Add `index.html`, the `lib/` folder, and the `templates/` folder to the root of the repo (drag-and-drop the whole set on github.com works, or `git add`/`commit`/`push`).
3. Repo Settings → Pages → Source → deploy from the `main` branch, root folder. Save.
4. GitHub gives you a URL like `https://zkranich.github.io/snow-bidding-tracker/` within a minute or two.

## Turning on live Smartsheet sync
Follow `WORKER_SETUP.md` once (and re-paste `worker.js` if you deployed it before). After that, editing statuses, region, **26/27 vendor, contract rates, or contract dates** writes straight to the real "26-27 Snow Bidding Sheet", and the page loads those values back from Smartsheet each time it opens. Until the Worker is set up, edits only live in your browser tab and are lost on refresh.

## Vendor subcontracts
Open a store's row and click **Create Vendor Subcontract**. It picks the template from the store's contract parameters (CS stores → CubeSmart, stores with a Vendor Seasonal amount → Seasonal, everything else → Per Push; the dropdown next to the button overrides it), fills it with the **vendor-side** numbers, drops the unused Amendment A page, and downloads the PDF. On a Seasonal contract the Notes box gets the 2"-4" push rate and the salt cost.

## What works immediately, as-is
Everything in the dashboard UI — filtering, sorting, the KPI tiles, the Contract Accepted map, and generating contract PDFs (they download straight through the browser on GitHub Pages) — runs in the browser off the data baked into the page, as long as `lib/` and `templates/` are uploaded alongside `index.html`.

## What still doesn't save
- **Vendor estimate uploads** and **owner contract uploads** — no file storage on a plain host.
- **Brand-new rows** added in Smartsheet. The page loads saved values for the rows it already has; new rows appear after `index.html` is rebuilt from a fresh pull.

## Google Map
See `MAP_SETUP.md` — add a Google Maps key and the Contract Accepted map becomes a real Google Map with one pin per store.


## Projections tab
A second tab next to Bidding. Season total (Dec-Mar) at the top, then December / January / February / March sections, then a store-by-store detail table. Pushes per month, the no-vendor-cost margin and seasonal installments are editable at the top of the tab and are remembered in your browser. Counts only Verbally Accepted + Contract Accepted stores; stores with no price entered show as "Needs pricing".

## Staying connected to Smartsheet (two-way sync)

- The page reads from and writes to Smartsheet through the Worker. Edits in the page save to Smartsheet right away; edits made in Smartsheet appear in the page on load, every 60 seconds, and when you switch back to the tab.
- If the page can't find a Worker URL it shows a red "NOT connected" bar at the top with a form: paste the Worker URL and dashboard key once and click Connect. They're remembered in that browser. (Or put them in config.js next to index.html — config.js wins if both exist.)

## Edits are always kept in the browser

Every edit is saved in this browser first (so a refresh never loses it), then sent to Smartsheet. If Smartsheet isn't reachable or the Worker isn't connected, a bar shows how many edits are waiting and a **Sync now** button re-sends them. An edit is only forgotten once Smartsheet confirms it. Browser storage is per browser/device: use Sync now before switching computers or clearing browser data.

## CubeSmart managed contract (2026 form)

`templates/managed.pdf` is the 2026 CubeSmart "Snowplowing Contract - Managed" (4 pages: contract, terms + signature, Exhibit A, Insurance Schedule). The source PDF had no form fields, so fields were added at each blank. Autofill fills service provider, term, tier fees (3-6" through 16-18"), per-inch, de-icer, and lists the store and address on Exhibit A. CubeSmart owned (store numbers starting with 0) still uses `templates/owned.pdf`.

## Vendor Contracting tab

Next to Bidding and Projections. A pipeline board of stores by vendor status (No status, Need New Vendor, Quoting/Waiting for Bids, Sent Contract, Signed Contract, Compliance Received). Each card shows the store, customer, address, 26/27 vendor, vendor cost, and customer status, with a status dropdown (saves to Smartsheet like the Bidding tab) and a "Vendor contract" button that generates that store's vendor subcontract. The Stores filter defaults to customer-accepted stores (Verbally Accepted + Contract Accepted).


Clicking a card on the Vendor Contracting tab opens the same site detail as the Bidding tab (contract parameters, region, vendor, dates, estimates, owner contracts, contract buttons) in a popup. Close with the Close button, Esc, or by clicking outside.

Vendors Interested: each site's detail panel has 3 rows (name, email, phone) under Vendor Estimates. They sync to 9 new Smartsheet columns (Interested Vendor 1/2/3 + Email/Phone). worker.js was updated to allow these fields, so re-deploy the Worker (paste the new worker.js into Cloudflare and Deploy) or these will not save to Smartsheet.

PM assignment: each site's detail panel has a PM dropdown (Zak, Bobby, Connor, Jacob) that writes to the sheet's existing PM column (sent as the PM's email). There's an "All PMs" filter on the Bidding and Vendor Contracting tabs, and Vendor Contracting cards show the PM. Re-deploy worker.js so the pm field is allowed.

Site map: the button is now "Site map". It has built-in Google Maps key fallback (config.js, then a key saved in the browser, then the default Parkinson-portal key), so the real Google Map shows even without config.js. Filters: customer-status scope, PM, vendor status. Pin popups show customer status, PM and 26/27 vendor. Add https://zkranich.github.io/* to the key's allowed websites in Google Cloud > Credentials, with Maps JavaScript API and Geocoding API enabled.

Map pin colors: skull = Lost; green = Signed Contract / Compliance Received; yellow = Send Vendor Contract / Sent Contract; red = customer Verbally/Contract Accepted and vendor Need New Vendor / Quoting-Waiting for Bids; grey = everything else (e.g. accepted, no vendor status yet). The map's "Show" filter has "All sites (including lost)" and "Lost sites only".

## Vendor Compliance tab

A new tab listing every 26/27 Vendor from the Bidding sheet (lost sites excluded), one card per vendor, matched by name to the Smartsheet "Vendor Tracking List". Each card has Address, Contact, Phone, Email, General Liability and Worker's Comp expiration dates (with expired / expiring-in-30-days chips), Contract/MSA and W9 on-file checkboxes, and Upload Contract / Upload COI / Upload W9 buttons. Edits save to the Vendor Tracking List; uploaded files attach to that vendor's row (named "Contract - ...", "COI - ...", "W9 - ...") and show as links on the card. Uploading a Contract or W9 also ticks the matching checkbox. Vendors not yet on the list show an "Add to the Vendor Tracking List" button. Filters: all / not compliant / expiring in 30 days / not on the list.

Requires the latest worker.js (new endpoints /vendors, /vendor-update, /vendor-add, /vendor-attachments, /vendor-file, /vendor-attach). Re-deploy the Worker (paste worker.js into Cloudflare and Deploy), and make sure the Connect bar has the Worker URL and dashboard key.
