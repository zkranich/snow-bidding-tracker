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

## What this covers, and what it doesn't

Once this is wired up, **Customer Status, Vendor Status, Lost, and Region**
edits sync live, both ways removed from the manual loop. Everything else —
vendor name/contract notes, vendor estimate uploads, owner contract uploads —
was never wired to this Worker and still has nowhere to persist on a plain
host; the dashboard's banner will keep flagging those as needing manual
handling. If you want those live too, that's a further step (each needs its
own Smartsheet column or attachment API call) — just ask.

The dashboard also still loads its *initial* data from a snapshot baked into
`index.html`, not a live pull — so a brand new row added directly in
Smartsheet, or a change made in Smartsheet itself, won't show up here until
the page is rebuilt from a fresh export. The Worker's `GET /rows` endpoint
is already in place for that next step (live reads), it's just not wired
into the page yet.
