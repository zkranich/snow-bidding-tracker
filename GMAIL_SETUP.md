# Gmail drafts from the dashboard (one-time setup, ~15 min)

**What you get:** clicking **Draft email** on a vendor creates a real draft in your Gmail with the blank subcontract and the overhead map(s) already attached. It only ever creates a *draft* — it never sends anything.

**If you skip this:** the button still works. It downloads the files and opens a Gmail compose window with the text filled in, and you drag the files in yourself.

The Worker needs three secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

## 1. Google Cloud project

1. Go to https://console.cloud.google.com and sign in as zkranich@farmerdevelopment.com.
2. Top bar → project picker → **New project** → name it `FDI Snow Tracker` → Create.
3. **APIs & Services → Library** → search **Gmail API** → **Enable**.

## 2. OAuth consent screen

1. **APIs & Services → OAuth consent screen** (may be called *Google Auth Platform*).
2. **User type:** pick **Internal** if it's offered (you're on a Google Workspace domain). Internal is the best choice — the refresh token never expires.
   If only **External** is offered: fill it in, then on the Audience page click **Publish app** (set it to *In production*). Leave it in *Testing* and Google kills the token every 7 days.
3. App name `FDI Snow Tracker`, support email = yours. Save.
4. **Data access / Scopes → Add** → `https://www.googleapis.com/auth/gmail.compose` → Save.
   (compose = create drafts and send. The Worker only ever calls the drafts endpoint.)

## 3. OAuth client

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**. Name `Snow Worker`.
3. **Authorized redirect URIs → Add:** `https://developers.google.com/oauthplayground`
4. Create. Copy the **Client ID** and **Client secret**.

## 4. Get the refresh token (OAuth Playground)

1. Open https://developers.google.com/oauthplayground
2. Click the gear (top right) → tick **Use your own OAuth credentials** → paste the Client ID and Client secret.
3. Left side, in the "Input your own scopes" box paste `https://www.googleapis.com/auth/gmail.compose` → **Authorize APIs**.
4. Sign in, allow. (If you see "Google hasn't verified this app", click *Advanced → Go to FDI Snow Tracker*.)
5. Click **Exchange authorization code for tokens**. Copy the **Refresh token**.

## 5. Put the three secrets on the Worker

Cloudflare dashboard → Workers & Pages → your snow Worker → **Settings → Variables and Secrets → Add** (type **Secret**, then Deploy):

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the Client ID |
| `GOOGLE_CLIENT_SECRET` | the Client secret |
| `GOOGLE_REFRESH_TOKEN` | the refresh token |

Also paste the new `worker.js` (Edit code → Deploy) if you haven't since this version.

## 6. Test

Open the dashboard → any site with a vendor under **Vendors interested** → **Draft email**. A Gmail compose window should open on the draft with two attachments (blank subcontract + overhead map, if one is uploaded). If you see "Gmail not set up yet, used download instead", one of the secrets is missing or wrong.

## Troubleshooting

- **google-auth-failed / invalid_grant** — token expired or was revoked. Redo step 4 and replace `GOOGLE_REFRESH_TOKEN`. Most common cause: app left in *Testing* mode (step 2).
- **gmail-error 403** — Gmail API not enabled (step 1.3) or the scope wasn't added.
- Drafts land in whichever Gmail account you authorized in step 4.
