# 26-27 Snow Operations — GitHub Pages package

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

**Every edit now saves straight to Smartsheet** (see "Live saving" at the bottom). There is no Sync button and nothing is staged. The top-right indicator shows Saved / Saving… / Offline.

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

Each vendor card is tinted green when compliant (contract, W9, GL and WC all good) and red when not (vendors not yet on the list are red too).

Requires the latest worker.js (new endpoints /vendors, /vendor-update, /vendor-add, /vendor-attachments, /vendor-file, /vendor-attach). Re-deploy the Worker (paste worker.js into Cloudflare and Deploy), and make sure the Connect bar has the Worker URL and dashboard key.

## Overhead Map upload

Each site's detail panel (Bidding row and the Vendor Contracting popup) has an "Overhead Map" section under Vendors Interested. Upload an aerial photo or PDF; it attaches to that site's row in the 26-27 Snow Bidding Sheet in Smartsheet (named "Overhead Map - <file>"). Images show as thumbnails; click a thumbnail or file name to open a full-size viewer with Download and Open in new tab buttons (Esc or Close to exit). PDFs open in the same viewer. Needs the latest worker.js (new endpoints /attachments, /file, /file-content, /attach) and the Connect bar filled in.

## Draft email to an interested vendor

Each Vendors Interested row has a "Draft email" button after the phone (enabled once that row has an email). It downloads the blank vendor subcontract (the right template for the store: CubeSmart / Seasonal / Per Push) and the site's overhead map(s), then opens a pre-filled Gmail compose window addressed to the vendor. Subject is "ESTIMATE NEEDED: <address>"; the body is Zak's standard bid-request wording ("Thanks for taking my call earlier today...") and lists the property (customer brand - address), the term, and the contract parameters (the vendor-side rates; unpriced tiers show $_______). FDI pricing and margin are never included. A web page can't attach files to Gmail, so drag the two downloaded files into the draft before sending. Nothing is sent automatically.

## Map column on Bidding + per-vendor estimate uploads

Bidding table: a new "Map" column shows a thumbnail of the site's overhead map (a faint map icon when none is uploaded). Click it to open the full-size viewer (Download / Open in new tab) without expanding the row. Thumbnails come from the Smartsheet row's attachments, so the Worker's /rows now requests ?include=attachments: re-deploy worker.js.

Vendor estimates: the old single "Vendor Estimates" upload was replaced by an "Upload estimate" button at the end of each Vendors Interested row (vendor 1/2/3). Files attach to the site's Smartsheet row named "Estimate 1/2/3 - <file>" and show as links under that vendor's row; click to view/download.

## Vendor tracking per site (Emailed / Quote / Follow-up / Select)

Under each vendor in **Vendors Interested** there's now a tracking line:

- **Emailed** date — filled automatically when you click *Draft email*; you can also type/pick it by hand. Saves to the *Interested Vendor n Emailed* column on the Bidding sheet.
- **Quote $** — type what the vendor quoted. Saves to *Interested Vendor n Quote*. With two or more quotes, the lowest is highlighted green and a "lowest is X, others +$Y" line shows under the three vendors.
- **Follow-up chip** — amber when a vendor was emailed 3+ days ago and there's no Estimate file and no quote yet. The toolbar button **Vendor follow-up (n)** filters the Bidding list to those sites. (Sites that already have a 26/27 Vendor are skipped.)
- **Select vendor** — copies that vendor into *26/27 Vendor* and moves *Vendor Status* to **Send Vendor Contract** (only if it was empty / Need New Vendor / Quoting). Contract-parameter rates are still entered under Contract parameters.

## Compliance warning

*Select vendor* checks the vendor against the Vendor Tracking List first (*Draft email* does not — bid requests go to vendors who aren't onboarded yet). If they're missing the contract/W9, have expired or blank General Liability / Worker's Comp, or aren't on the list at all, you get a confirm box listing what's wrong and can cancel.

## Gmail drafts with attachments

*Draft email* now tries to create a real Gmail **draft** (never sends) with the blank subcontract and overhead map(s) already attached. That needs the one-time Google setup in `GMAIL_SETUP.md` and the three `GOOGLE_*` secrets on the Worker. Without them it falls back to the old behavior (downloads the files, opens a compose window with the text filled in).

## New Worker pieces (redeploy worker.js)

- six new fields in `FIELD_COLUMN_IDS` (iv1-3 Emailed / Quote)
- `POST /gmail-draft` (returns 501 `gmail-not-configured` until the Google secrets are set)

## Lock contract parameters

In **Contract parameters** there are two buttons: **Lock FDI prices** and **Lock vendor costs**. Lock your FDI prices when they're final, then keep working on the vendor side and lock that when you're done. Locked fields turn green-grey and can't be edited (typed, auto-calculated, or via the Base Monthly / Pushes boxes). Click a green lock to unlock (it asks first). Locks are remembered **in this browser only** (not in Smartsheet), per site.

## Signing the vendor subcontract

Clicking **Create Vendor Contract** now asks: *Sign this subcontract with your saved signature and today's date?* OK stamps your saved signature (My Signature button) and today's date on FDI's signature/date lines and names the file "... (signed).pdf". Cancel makes it unsigned with those left blank. If no signature is saved yet it tells you and lets you stop to save one first. The blank subcontract attached to vendor bid emails is never signed.

## Vendor bid sheet (select several properties → one spreadsheet for vendors)

Tick the checkboxes on any properties in the Bidding view (filter by PM first if you like), then click **Vendor bid sheet (.xlsx)** in the blue selection bar. You get one Excel file with a tab per customer type (Pfuetze, CubeSmart, Devon, Public Storage, National Storage, SROA). Each tab has a vendor block at the top (company / contact / date), then one row per property: store #, address, sq ft, and **blank yellow cells** for the vendor's price at each depth tier (the tiers match that customer's contract; Pfuetze also gets the Front Loader / Bobcat / Dump Truck / Hauling $/hr and salting columns, like your Pfuetze sheet) plus a Notes column.

It never includes your FDI prices — only blank cells. Send the same file to every vendor; each one fills in the yellow cells and sends it back. It's built right in the browser, so it works without the Worker.

## Add a store

Click **+ Add store** in the filter row. Fill in the store # (required) and anything else you know (customer/contact, address, SF, region, PM, customer status), then **Add store**. It creates a new row at the bottom of the 26-27 Snow Bidding Sheet and the site appears here right away (the table filters to it so you can see it). A store # that's already on the list is blocked.

- **Needs the updated `worker.js`** (new `/add-row` endpoint) pasted into Cloudflare. Until then the store is saved in this browser and the banner says so; it's created in Smartsheet automatically as soon as the Worker is reachable (retries every few seconds and on reload).
- **Other devices / people:** the live load now also pulls in any site that exists in Smartsheet with a Store Number this page doesn't have, so a store added here (or typed straight into Smartsheet) shows up everywhere within about a minute. Duplicate-store rows the cleanup dropped earlier stay dropped, and rows with no Store Number are skipped.
- Contract prices / vendor info for the new store are filled in the normal way afterwards (click the row).

## Service tab (storm dispatch) (running the snow operations)

Second tab next to **Bidding**. A site appears here once it reaches the stage picked in the **Sites** dropdown (default: Customer Status = *Contract Accepted* and Vendor Status = *Signed Contract* or *Compliance Received*; lost sites are hidden). The choice is remembered in this browser.

- **+ New storm** — name it, set the date, forecast and service, choose all shown sites or only the checked ones. It creates one **Requested** row per site in the Smartsheet sheet **26/27 Snow PBR Tracker** (one row per site per storm).
- **✉ Email vendors** — groups the sites still at *Requested* by their 26/27 Vendor and drafts one email per vendor listing their sites (a Gmail draft if the Worker's Google secrets are set up, otherwise a Gmail compose window). **Mark dispatched** flips that vendor's sites to *Dispatched* once you've sent it.
- **Status per site** — Requested → Dispatched → On Site → Completed (or Issue / Cancelled). Dispatched / On Site / Completed times stamp themselves. Also fill in service, actual snow, pushes, salt applications and notes per site. Tick several sites to set a status in bulk.
- **Top tiles** show the active storm's counts across all contracted sites; click one to filter.
- Changes are saved in this browser first and pushed to Smartsheet (it retries automatically). Needs the updated `worker.js` (new `/dispatch`, `/dispatch-add`, `/dispatch-update`).


## Tab layout

- **Bidding** — two sub-tabs: *Bidding* (the main site table) and *Vendor Contracting*.
- **Vendors** — vendor compliance (COI / W-9 / expirations) from the Vendor Tracking List.
- **Contracted Sites** — roster of every site that has reached the stage picked in the "Sites" selector (same setting the Service tab uses). Click a row to open it on the Bidding tab.
- **Service** — service dispatch: create a service for one store (or all shown/checked), request service per site; the service type (Plow / Salt / Plow + Salt) comes from the store's contract rates, email vendors, track status. Logged to the "26/27 Snow PBR Tracker" Smartsheet.
- **Projections** — revenue / margin projections (unchanged).

## Customer (DM) picker

Open any site on the Bidding tab: under **Customer (DM)** pick an existing DM from the list, or choose **+ Add new DM…** to enter a name and email. The site's Customer and Customer Email columns are updated in Smartsheet (queued if offline), the table and the Customers filter update right away, and picking an existing DM fills in their email. The DM email box can be edited on its own. Requires the updated `worker.js` (adds `customer` and `customerEmail` to `/update`).

## Contracted sites hide the bidding-stage tools

Once a site counts as contracted (it meets the stage picked in the Sites dropdown on the Contracted Sites / Service tabs), its expanded view on the Bidding tab hides the *Create owner contract* / *Create Vendor Subcontract* buttons (and the Vendor Contract Type dropdown), the *25/26 Vendor* line, and *Vendors interested*. They come back automatically if the site's status drops below that stage.

## Expand a contracted site + Service history

On the **Contracted Sites** tab, click any row to expand it in place (same panel as the Bidding tab, minus the bidding-stage tools). Under each contracted site there's a **Service history** line listing every service logged for it in the 26/27 Snow PBR Tracker (date, service, type, status, vendor, snow, pushes, salt, notes — newest first). Use **+ New service** on that line (or the Service tab) to add one; it lands at the top of that site's history immediately.

## New service: pick individual contract parameters

Choosing a single store in **New service** lists that store's contract parameters (each plow tier, Deicer, Salting office/gate, Seasonal) plus Haul / Stack and Other as checkboxes — tick as many as apply. The picks are saved to the new **Service Items** column of the 26/27 Snow PBR Tracker (column id `2241975098838916`, already added), and the **Service** column gets the matching Plow / Salt / Plow + Salt / Haul / Stack / Other summary. With several stores selected you can tick generic services or leave "Per each store's contract". Items show under the service on the Service tab, in Service history, and in the vendor email (amounts are never included). Requires the updated `worker.js`.

## Service history columns + project numbers

The dark-blue Service history bar shows: **Project #** | **Date** (MM/DD/YYYY) | **Service** (what was ticked) | **Vendor** | **FDI Amount** | **Vendor Cost** | **Work Order #**.

- FDI Amount / Vendor Cost are the combined totals of the contract parameters ticked when the service is created (blank for "per each store's contract", Haul / Stack and Other). Amounts and Work Order # are editable inline and write back to Smartsheet.
- **Project numbers** are `S` (snow) + `26` (season year) + a running number: S26000, S26001, S26002… One per service per store, assigned when the service is created (next number = highest existing + 1).
- New columns on the "26/27 Snow PBR Tracker" sheet: Service Items, FDI Amount, Vendor Cost, Work Order Number, Project Number. **Paste the updated worker.js into Cloudflare** so these save.

## Prefilled amounts in New service
In the New service dialog (single store) FDI Amount fills live from the ticked contract parameters (sum of their FDI rates); Vendor Cost fills from the store's vendor prices when stored, otherwise stays blank to type in. Work Order # can be entered up front. All three are editable in the dialog and later in Service history. For multi-store services, each store is prefilled from its own contract (a generic "Salt" uses the store's Deicer rate; "Per each store's contract" fills only when that contract has a single service).

Service history also has a **Notes** column (editable inline, saved to the existing Notes column on the dispatch sheet; the same note shows on the Service tab).

## On-site contact + gate code (Contracted sites)
Contract Start/End are hidden on contracted sites. In their place: **On-site contact** (GM/SM), **On-site phone** (GM/SM Cell, falling back to Store Phone), **On-site email** (Store Email) and **Gate code**, read from the Smartsheet **"Customer Information"** sheet (id 953322563391364), matched by Store Number. Read-only in the dashboard (edit in that sheet). Needs the updated worker.js (new GET /customer-info route).

## Push to billing (Service history -> Billing tab)
- Button at the end of each site's Service history. First click asks to confirm (shows Owner / Sub totals), second click pushes every service that has an amount and isn't already pushed.
- **Owner billing** gets the **FDI Amount only**; **Sub billing** gets the **Vendor Cost only**. A service with only one amount appears in just that list.
- Pushing stamps today's date in the new **Pushed to Billing** column on the "26/27 Snow PBR Tracker" sheet (so it can't be pushed twice and survives refresh); pushed rows' amounts are locked. **Undo** on the Billing tab clears it.
- New **Billing** tab: Owner billing / Sub billing lists (Project #, Store, Customer or Vendor, date, service, amount, work order #) with totals and **Download CSV**. No separate billing sheets yet — these lists are built from the dispatch log, ready to be wired to Accounts Receivable later.
- Needs the updated worker.js (new `pushedAt` column mapping).

Sub billing list also has an editable **Vendor Invoice #** (saved to the new "Vendor Invoice Number" column on the dispatch sheet; included in the Sub billing CSV). Needs the updated worker.js.

## Weather (48-hour snow / ice outlook) — inside the Service tab
The Weather panel sits at the top of the **Service** tab, collapsed by default; its header shows live High / Watch / Low counts, click it to expand the site list.
- Scans the **National Weather Service** (gridded snowfall + ice forecast, active winter alerts) and **Open-Meteo** (second-opinion model forecast) for each site, located by the ZIP in its address. Free, no keys, runs in the browser (nothing to deploy in the Worker).
- Looks at the next 48 hours only. Risk: **High** = Winter Storm/Blizzard/Ice Storm/other winter Warning, or snow at/above the chosen trigger (1–4", default 2"), or ice >= 0.10"; **Watch** = Watch/Advisory, or snow >= 0.5", or any measurable ice; **Low** = trace snow/ice or likely wintry precip; **Clear**. The higher of NWS and the model wins.
- Filters: contracted vs all active sites, region, PM, risk chips. Address links to the NWS point forecast. Sites with no ZIP in the address show "No data".
- Refreshes when you open the Service tab (if older than 30 min) or click Check weather. It does not alert when the dashboard is closed.
- Service history now shows the "Pushed to billing <date>" pill under each line's service date.

## Contracted Sites: customer filter + editable region
- New **Customer** dropdown next to PM/Region; the search box also matches customer, vendor, PM and region.
- The **Region** column is now a dropdown on each row. Changing it saves to the Region column on the Bidding sheet (same save path as the Bidding tab's detail panel); the cell turns amber while pending.

## Customer request page (request.html)
Lets a customer request a service at one of their sites without seeing the dashboard.
- On **Contracted Sites** click **Customer links**: it lists every customer that has accepted sites with their own private link (Copy / Open). Send each customer only their link.
- The customer picks a site (only their own accepted, not-lost sites), a service (Plow / Salt / Plow + Salt / Other), adds details, their name and phone/email, and submits.
- It adds a row to the **26/27 Snow PBR Tracker** with Status **Requested**, Storm "Customer Request <date time>", the site's PM, and a Notes line "[Customer request] name (contact): details". It shows up in the **Service** tab like any other request; assign the vendor and dispatch from there.
- Security: the link carries a signed token (made with the Worker's `PORTAL_SECRET`), so a customer can't get another customer's sites. The Worker's public routes can only list that customer's sites and add a Requested row; everything else still needs the dashboard key. A hidden honeypot field blocks simple bots.
- Setup: upload `request.html` next to `index.html`, paste the new `worker.js`, and add a second secret **`PORTAL_SECRET`** (any random string, Encrypt) in Cloudflare. Changing `PORTAL_SECRET` later invalidates every link.
- Nothing emails the PM yet; new requests appear in the Service tab (Requested).

## PM view (pm.html) — Bidding-only, per PM
A separate page for a PM (e.g. Bobby): **only the Bidding view**, **only the sites assigned to that PM**, and the only thing they can change is the **FDI contract parameters** (deicer, per-inch, tier rates, seasonal, etc.). Vendor rates/costs, statuses, billing, other PMs' sites are not sent to the page and the Worker refuses to write them.
- Get a PM's link from the dashboard: Contracted Sites -> **Private links** -> **PM links** -> Copy. The link is `pm.html?p=<PM name>&t=<token>`.
- Enforced in the Worker (`/pm/sites`, `/pm/update`): the token is signed with `PORTAL_SECRET`, the Worker re-checks on every save that the row's PM is that person, and only allows the FDI-side fields in `PM_EDITABLE_FIELDS`.
- It's a private link, not a username/password: anyone holding the link can use it, so send it only to that PM. Changing `PORTAL_SECRET` kills every PM and customer link. A new PM must be added to `PM_DIRECTORY` in `worker.js` (and the dashboard's PM list).
- Setup is the same as the customer page: upload `pm.html`, paste the new `worker.js`, and have `PORTAL_SECRET` set.
- Note: `index.html` (your full dashboard) still embeds the data snapshot and key, so don't give PMs that link; give them only `pm.html`.

## Vendors tab: signed-contract vendors only
The Vendors tab now lists only 26/27 vendors on sites where the customer contract is signed (Customer Status = Contract Accepted, not Lost). Vendors that appear only on bids, sent contracts or verbal acceptances are hidden, and each card's site count counts signed sites only.

## MyPlace (MP) contract
`templates/myplace.pdf` is MyPlace's own 2026 Snow Removal & Ice Management Bid Request (fillable). Any store whose number starts with **MP** now gets a **Create Owner Contract** button in the Bidding detail panel. It fills: facility (store #, address), property management contact (the site's DM/customer), season dates, vendor company (Farmer Development, LLC), the assigned PM as vendor contact/email, the per-application **salt rate from the Deicer parameter**, **Option B season total** from Seasonal (if set), and your saved signature + date. The depth-tier prices (MyPlace's tiers differ from ours) and exclusions stay blank in the PDF for you to type in; the PDF stays fillable.

## MyPlace depth tiers (MP stores)

MP-prefixed stores use five depth tiers as contract parameters, each with an FDI and a Vendor column in the Bidding sheet:
`MP 0-2"`, `MP 2-4.99"`, `MP 5-7.99"`, `MP 8-11.99"`, `MP 12"+` (plus the existing Deicer). They show on the Bidding row, are editable in the PM view (FDI side), and the **Create Owner Contract** button fills the "Snow plowing" row of the MyPlace bid request from the FDI tiers (walks/doors stay blank). `worker.js` changed (new column IDs) — re-paste it into Cloudflare.

### MyPlace season cost (Nov–Mar)

MP stores have a **Seasonal** field (existing Seasonal column) calculated as **(MP 2-4.99" + Deicer) × Pushes**, default **12 pushes + 12 salts**, for both FDI and Vendor sides. Change the Pushes box, Deicer, or the 2-4.99" rate and Seasonal recalculates. Monthly = Seasonal ÷ 5 (Nov–Mar). The Create Owner Contract button fills MyPlace Option B (price per month, 5 months, season total, billable period, "12 plow pushes and 12 salt applications"). No `worker.js` change beyond the MP tier IDs already added.
The MyPlace bid request also fills Loader / snow relocation at a fixed $500/hr.

### Map search

The Site map has a Search box: type a 26/27 vendor (pick from the list), store, customer or address to show only matching pins/sites; a vendor match shows "Vendor — N sites".

### Map tab

The site map is now its own **Map** tab (next to Contracted Sites). Clicking a pin or a site in the right-hand column opens that site's details in the column as the same editable form as a Bidding row (Customer/Vendor status, Lost, region, PM, DM, 26/27 vendor, contract dates + parameters, interested vendors, owner contracts, contract buttons) instead of a popup. Edits stage/sync exactly like edits on the Bidding tab. The Bidding "Site map" chip jumps to the tab.


## Live saving — no Sync button, no staging (current)

Every edit on every tab writes to the "26-27 Snow Bidding Sheet" the moment you make it, and shows up for everyone else within about 20 seconds.

- **What saves live:** Customer Status, Vendor Status, Lost (single and bulk), Region, PM, DM, 26/27 vendor, contract rates, contract dates, interested vendors (name/email/phone, emailed date, quote), **price locks**, add-a-store, and estimate / overhead-map / **owner-contract** uploads (attached to the row as `Estimate n - …`, `Overhead Map - …`, `Owner Contract - …`).
- **Save indicator** (top right, replaces the Sync button): *Saved*, *Saving…*, or *Offline · n waiting*. A red bar only appears if this browser isn't connected to the Worker or the dashboard key is rejected.
- **Offline retry queue:** each edit shows on screen instantly (optimistic). A small copy sits in this browser's localStorage until Smartsheet confirms it, then it's removed. If you're offline, the edit stays and sends automatically (every 8 s, when the connection returns, and at next load). No button. If Smartsheet/the Worker rejects an edit outright (HTTP 400), that edit is dropped and a console warning names the field.
- **Price locks** now live in two checkbox columns on the sheet (`FDI Locked` 10645392887684, `Vendor Locked` 4514245020258180), so a lock set by one person applies for everyone. Locks previously saved only in a browser (`fdiContractLocksV1`) are copied up to the sheet once on the next load, then removed.
- **Live refresh:** the page re-reads the sheet every 20 s while the tab is visible, and immediately when you come back to the tab/window. Only real changes redraw the screen; a refresh never rebuilds the table under a field you're typing in (it waits until you leave the field), an open site stays open, and a refresh that overlaps one of your own saves is discarded so it can't revert your edit.
- **Worker:** `/update` accepts every field the page edits (including `iv1/2/3Emailed`, `iv1/2/3Quote`, `fdiLocked`, `vendorLocked`; checkboxes are coerced to true/false; an unknown field returns a clear 400 naming it). `POST /add-row` creates a site (Store Number, Customer, Address, SF, Region, PM, Customer Status) and returns `{ ok, rowId }`.
- **You must paste the new `worker.js` into Cloudflare** (the previous version doesn't know `fdiLocked` / `vendorLocked` and older copies reject `iv*Emailed`). The Smartsheet token stays in the Worker only.
