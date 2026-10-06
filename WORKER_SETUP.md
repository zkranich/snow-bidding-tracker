# Live Smartsheet sync — setup

This is the one-time setup to make Customer Status, Vendor Status, Lost, and
Region edits in `index.html` write straight to Smartsheet the instant you
make them — no staging, no asking Claude to push a batch. About 10 minutes,
all free (Cloudflare's free tier covers this easily).

## 1. Get a Smartsheet API token

1. In Smartsheet, click your profile photo (top right) → **Apps & Integrations**.
2. Under **API Access**, click **Generate new access token**.
3. Name it something like `snow-bidding-sync`, copy the token it gives you.
   You won't be able to see it again after you leave the page — if you lose
   it, just generate a new one.

## 2. Create the Cloudflare Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign in (or
   create a free account).
2. In the left sidebar: **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name, e.g. `snow-bidding-sync`. Click **Deploy** (it deploys a
   placeholder — that's fine, you're about to replace it).
4. Click **Edit code**. Delete everything in the editor and paste in the
   full contents of `worker.js` from this folder. Click **Save and deploy**.

## 3. Set the two secrets

Still on the Worker: **Settings** → **Variables and Secrets** → **Add**.

- `SMARTSHEET_TOKEN` — paste the token from step 1. Toggle **Encrypt**.
- `DASHBOARD_KEY` — make up any random string (a password generator's output
  is fine, e.g. `a8f3-k2m9-x7q1-...`). Toggle **Encrypt**. This isn't shared
  with anyone — you'll paste the same string into `index.html` in step 4.

Save.

## 4. Point the dashboard at the Worker

1. Copy your Worker's URL — it's shown at the top of the Worker's page,
   looks like `https://snow-bidding-sync.<your-subdomain>.workers.dev`.
2. Open `index.html` in a text editor and find these two lines near the top
   of the `<script>` block:

   ```js
   const SMARTSHEET_WORKER_URL = '';
   const DASHBOARD_KEY = '';
   ```

3. Fill them in:

   ```js
   const SMARTSHEET_WORKER_URL = 'https://snow-bidding-sync.<your-subdomain>.workers.dev';
   const DASHBOARD_KEY = 'the same random string from step 3';
   ```

4. Save, and push/upload the updated `index.html` to your GitHub Pages repo.

## 5. Test it

Open the live GitHub Pages URL, change one row's Customer Status, and check
Smartsheet — the cell should update within a second or two. If it doesn't:
open the browser's dev console (F12) on the dashboard page and look for a
warning starting with "Smartsheet sync failed" or "Smartsheet sync error" —
it'll say what went wrong (usually a typo'd URL or a key mismatch between
the two files).

## What this covers

Once the Worker is deployed with the current `worker.js`, these save straight
to the matching Smartsheet column the moment you change them, and the page
reads them back from Smartsheet every time it loads (so a refresh, or opening
it on another computer, shows what you saved — look for "LIVE" next to the
snapshot time at the top):

- Customer Status, Vendor Status, Lost, Region
- 26/27 Vendor
- All contract rates, FDI and vendor side (deicer, push tiers, per inch,
  seasonal, SROA, Pfuetze tiers, salting)
- Contract Start and Contract End

**Important:** if you set up the Worker earlier, paste the new `worker.js`
over the old one (Edit code -> replace everything -> Save and deploy). The
old Worker only knows the first four fields.

Still not saved anywhere on a plain web host: vendor estimate uploads and
owner contract uploads (no file storage here), and brand-new rows added in
Smartsheet — those only appear after `index.html` is rebuilt from a fresh pull.
