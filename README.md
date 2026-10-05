# Snow Bidding Tracker — GitHub Pages package

## What's in here
- `index.html` — the full dashboard (KPIs, status tracking, Contract Accepted map with zoom/pan, everything you've been using), wired for **live Smartsheet sync** on four fields. No build step.
- `lib/pdf-lib.min.js` and `templates/*.pdf` — the PDF engine and the contract templates (Owned, Managed, DSS owner contracts plus the three FDI vendor subcontracts: CubeSmart, Seasonal, Per Push). **Upload these folders with `index.html`** — the Create Contract buttons won't work without them.
- `worker.js` — the Cloudflare Worker that does the actual writing to Smartsheet (it holds the API token; the dashboard never does).
- `WORKER_SETUP.md` — the one-time, ~10 minute setup to turn the sync on.

## How to host the dashboard
1. Create a new repo on your GitHub account (e.g. `snow-bidding-tracker`), or reuse an existing one.
2. Add `index.html`, the `lib/` folder, and the `templates/` folder to the root of the repo (drag-and-drop the whole set on github.com works, or `git add`/`commit`/`push`).
3. Repo Settings → Pages → Source → deploy from the `main` branch, root folder. Save.
4. GitHub gives you a URL like `https://zkranich.github.io/snow-bidding-tracker/` within a minute or two.

## Turning on live Smartsheet sync
Follow `WORKER_SETUP.md` once. After that, editing **Customer Status, Vendor Status, Lost, or Region** in the dashboard writes straight to the real "26-27 Snow Bidding Sheet" within a second or two — no staging, no asking me to push a batch. Until you do that setup, `index.html` works exactly like before (edits just stay in your browser tab and are lost on refresh).

## Vendor subcontracts
Open a store's row and click **Create Vendor Subcontract**. It picks the template from the store's contract parameters (CS stores → CubeSmart, stores with a Vendor Seasonal amount → Seasonal, everything else → Per Push; the dropdown next to the button overrides it), fills it with the **vendor-side** numbers, drops the unused Amendment A page, and downloads the PDF. On a Seasonal contract the Notes box gets the 2"-4" push rate and the salt cost.

## What works immediately, as-is
Everything in the dashboard UI — filtering, sorting, the KPI tiles, the Contract Accepted map, and generating contract PDFs (they download straight through the browser on GitHub Pages) — runs in the browser off the data baked into the page, as long as `lib/` and `templates/` are uploaded alongside `index.html`.

## What still doesn't sync anywhere
Two things depend on Claude's Artifact platform (its `assets`/`db` capabilities) and just no-op on GitHub Pages instead of erroring, and the Worker above doesn't cover them either:
- **Vendor estimate uploads** and **owner contract uploads** — the "attach a file" buttons have nowhere to save the file on a plain host.
- The dashboard's *initial* data is still a snapshot baked into `index.html` at the time I built it, not a live pull — a change made directly in Smartsheet, or a brand-new row, won't show up here until I rebuild and you re-upload `index.html`. (The Worker already has a `GET /rows` endpoint ready for wiring this up live too — just say the word.)

Say the word if you want either of those closed up next.

## About the real Google Map
This `index.html` still uses the schematic map, not an embedded live Google Map. Once it's on a plain web host (not Claude's Artifact CSP), embedding a real Google Map becomes possible — either a keyless single-location embed, or a Google My Maps with all your colored pins if you want multiple custom markers on one real map. Let me know which you want and I'll wire it in.
