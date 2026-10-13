// Snow Bidding Tracker <-> Smartsheet live sync
// Cloudflare Worker — deploy via dash.cloudflare.com (see WORKER_SETUP.md
// for the click-by-click steps). This is the whole backend: it holds the
// Smartsheet API token so the dashboard's JS never has to, and it's the
// only thing standing between the dashboard and a live write to your
// real "26-27 Snow Bidding Sheet".
//
// Two secrets must be set on this Worker (Settings -> Variables -> add,
// then click "Encrypt" on each):
//   SMARTSHEET_TOKEN   - a Smartsheet API access token (see WORKER_SETUP.md)
//   DASHBOARD_KEY      - any random string you make up; must match the
//                        DASHBOARD_KEY constant in index.html
// Optional (only for the "Draft email" button to create real Gmail drafts
// with attachments — see GMAIL_SETUP.md):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN

const SHEET_ID = '1101172935970692'; // 26-27 Snow Bidding Sheet
const VENDOR_SHEET_ID = '7261538764515204'; // "Vendor Tracking List" (1000 FM & CapX > Vendor Lists)

// Vendor Compliance tab: field name -> Vendor Tracking List column ID.
const VENDOR_FIELD_COLUMN_IDS = {
  vendor: 8462708432496516,   // Vendor (primary)
  phone: 299934107887492,     // Phone Numbers
  email: 4803533735257988,    // Email (contact list — send an email address)
  contact: 2551733921572740,  // Contact Name/s
  address: 7055333548943236,  // Address
  msa: 3440339479908228,      // Master Service Agreement/Subcontract (checkbox)
  w9: 1231675723147140,       // W9 (checkbox)
  glExpiry: 1807119502600068, // General Liability Expiry (date)
  wcExpiry: 2970665422376836, // Worker's Comp Expiry (date)
};

// Columns filled in when a new store is added from the dashboard (POST /add-row).
const ADD_ROW_COLUMN_IDS = {
  store: 7719764277628804,          // Store Number (primary)
  address: 2090264743415684,        // Address
  sf: 8845664184471428,             // SF
  customer: 4342064557100932,       // Customer
  customerEmail: 8178725658857348,  // Customer Email
  region: 260677394796420,          // Region (picklist)
  pm: 3410584874028932,             // PM (contact list — send the PM's email)
  customerStatus: 7113215152263044, // Customer Status (picklist)
};

// "26/27 Snow PBR Tracker" — the storm-dispatch log behind the dashboard's Contracted tab.
// One row per site per storm.
const DISPATCH_SHEET_ID = '5482051831811972';
const DISPATCH_COLS = {
  request: 8036663236005764,      // Request (primary: "<storm> | <store>")
  storm: 718313841528708,
  stormDate: 5221913468899204,    // date
  store: 2970113655213956,
  address: 7473713282584452,
  pm: 1844213748371332,
  vendor: 6347813375741828,
  status: 4096013562056580,       // picklist: Requested / Dispatched / On Site / Completed / Issue / Cancelled
  service: 8599613189427076,      // picklist: Plow / Salt / Plow + Salt / Haul / Stack / Other
  forecast: 436838864818052,
  actual: 4940438492188548,
  pushes: 2688638678503300,
  salt: 7192238305873796,
  requestedAt: 1562738771660676,
  dispatchedAt: 6066338399031172,
  onSiteAt: 3814538585345924,
  completedAt: 8318138212716420,
  issue: 999788818239364,
  notes: 5503388445609860,
};

// Field name (as sent by the dashboard) -> Smartsheet column ID.
// Every field the dashboard can edit and save to Smartsheet.
const FIELD_COLUMN_IDS = {
  customerStatus: 7113215152263044, // Customer Status (picklist)
  vendorStatus: 1483715618049924,   // Vendor Status (picklist)
  lost: 5987315245420420,           // Lost (checkbox)
  region: 260677394796420,          // Region (picklist)
  vendor2627: 7903831494791044,     // 26/27 Vendor (text)
  // Contract rates (FDI + vendor side), seasonal amounts, and contract dates.
  // Dashboard keys that share a Smartsheet column (e.g. fdi2_4 / pfuetze2_4) point at the same ID.
  deicer: 8242098027663236,
  fdi3_6: 2612598493450116,
  fdi6_9: 7116198120820612,
  fdi10_12: 1486698586607492,
  fdi13_15: 5990298213977988,
  fdi16_18: 3738498400292740,
  fdi2_399: 5045751998877572,
  fdi4_599: 2793952185192324,
  fdi6_799: 5495159074361220,
  perInchRate: 3243359260675972,
  vendorDeicer: 3719612883308420,
  vendorPerInchRate: 8223212510678916,
  vendorFdi2_399: 904863116201860,
  vendorFdi4_599: 5408462743572356,
  vendorFdi6_799: 3156662929887108,
  vendorFdi3_6: 7660262557257604,
  vendorFdi6_9: 2030763023044484,
  vendorFdi10_12: 6534362650414980,
  vendorFdi13_15: 4282562836729732,
  vendorFdi16_18: 8786162464100228,
  sroa3_49: 7784553625980804,
  sroa5_79: 2155054091767684,
  sroa8_119: 6658653719138180,
  sroa12plus: 4406853905452932,
  vendorSroa3_49: 8910453532823428,
  vendorSroa5_79: 114360510615428,
  vendorSroa8_119: 4617960137985924,
  vendorSroa12plus: 2366160324300676,
  fdi2_4: 4352286345957252,
  pfuetze2_4: 4352286345957252,
  fdi41_6: 8855885973327748,
  pfuetze4_6: 8855885973327748,
  pfuetze6_10: 270899183652740,
  pfuetze10plus: 4774498811023236,
  saltingOfficeGate: 2522698997337988,
  vendorFdi2_4: 7026298624708484,
  vendorPfuetze2_4: 7026298624708484,
  vendorFdi41_6: 1396799090495364,
  vendorPfuetze4_6: 1396799090495364,
  vendorPfuetze6_10: 5900398717865860,
  vendorPfuetze10plus: 3648598904180612,
  vendorSaltingOfficeGate: 8152198531551108,
  seasonal: 4024930901200772,
  vendorSeasonal: 1367910251270020,
  contractStart: 5828404848660356,
  contractEnd: 3576605034975108,
  pm: 3410584874028932,             // PM (contact list — dashboard sends the PM's email)
  // Vendors interested in the site (name / email / phone x3)
  iv1Name: 716833319325572,
  iv1Email: 5220432946696068,
  iv1Phone: 2968633133010820,
  iv2Name: 7472232760381316,
  iv2Email: 1842733226168196,
  iv2Phone: 6346332853538692,
  iv3Name: 4094533039853444,
  iv3Email: 8598132667223940,
  iv3Phone: 435358342614916,
  // When each vendor was emailed (date) and the quote they sent back (number)
  iv1Emailed: 4044247596306308,
  iv1Quote: 8547847223676804,
  iv2Emailed: 385072899067780,
  iv2Quote: 4888672526438276,
  iv3Emailed: 2636872712753028,
  iv3Quote: 7140472340123524,
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Dashboard-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// ---- MIME builder for /gmail-draft ----
function b64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function wrap76(b64) { return (b64.match(/.{1,76}/g) || []).join('\r\n'); }
function encHeader(str) { return /^[\x20-\x7e]*$/.test(str) ? str : `=?UTF-8?B?${b64Utf8(str)}?=`; }
function buildMime({ to, subject, body, attachments }) {
  const boundary = 'fdi_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const lines = [];
  if (to) lines.push(`To: ${String(to).replace(/[\r\n]/g, ' ')}`);
  lines.push(`Subject: ${encHeader(String(subject || '').replace(/[\r\n]/g, ' '))}`);
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push('');
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(wrap76(b64Utf8(String(body || ''))));
  for (const a of (attachments || [])) {
    const name = String(a.name || 'attachment').replace(/[\r\n"]/g, '_');
    const mime = String(a.mime || 'application/octet-stream').replace(/[\r\n]/g, '');
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${mime}; name="${encHeader(name)}"`);
    lines.push(`Content-Disposition: attachment; filename="${encHeader(name)}"`);
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(wrap76(String(a.data || '')));
  }
  lines.push(`--${boundary}--`);
  lines.push('');
  const mime = lines.join('\r\n');
  // Gmail wants base64url of the full RFC 2822 message
  return b64Utf8(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Shared-secret check. Worth knowing honestly: this key lives in
    // index.html's own JS source (it's a static page, anyone can view-source
    // it), so this is NOT real security — it just keeps random internet
    // scanners from writing to your sheet. Don't treat this Worker as safe
    // to expose anything more sensitive through.
    const key = request.headers.get('X-Dashboard-Key');
    if (!env.DASHBOARD_KEY || key !== env.DASHBOARD_KEY) {
      return json({ error: 'unauthorized' }, 401, headers);
    }
    if (!env.SMARTSHEET_TOKEN) {
      return json({ error: 'Worker is missing its SMARTSHEET_TOKEN secret' }, 500, headers);
    }

    const url = new URL(request.url);

    try {
      // GET /rows — pulls the live sheet straight from Smartsheet. The
      // dashboard calls this on load to overlay saved values onto its
      // baked-in snapshot.
      if (url.pathname === '/rows' && request.method === 'GET') {
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}?include=attachments`, {
          headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}` },
        });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // POST /update  { rowId: number, field: <any key of FIELD_COLUMN_IDS>, value: string|number|boolean|null }
      if (url.pathname === '/update' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }

        const { rowId, field, value } = body || {};
        const columnId = FIELD_COLUMN_IDS[field];
        if (!rowId || !columnId) {
          return json({ error: `rowId and a known field are required (got field=${field})` }, 400, headers);
        }

        const cellValue = value === null || value === undefined ? '' : value;
        const payload = [{ id: rowId, cells: [{ columnId, value: cellValue }] }];

        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.SMARTSHEET_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      // POST /add-row  { store, customer?, address?, sf?, region?, pm? (email), customerStatus?, customerEmail? }
      // Adds a new site to the bottom of the Bidding sheet and returns { ok, rowId }.
      if (url.pathname === '/add-row' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const store = String((body && body.store) || '').trim();
        if (!store) return json({ error: 'store (Store Number) is required' }, 400, headers);
        const cells = [{ columnId: ADD_ROW_COLUMN_IDS.store, value: store }];
        const put = (key, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') cells.push({ columnId: ADD_ROW_COLUMN_IDS[key], value: typeof v === 'number' ? v : String(v).trim() }); };
        put('customer', body.customer);
        put('address', body.address);
        put('customerEmail', body.customerEmail);
        put('region', body.region);
        put('pm', body.pm);
        put('customerStatus', body.customerStatus);
        if (body.sf !== undefined && body.sf !== null && String(body.sf).trim() !== '') {
          const n = Number(String(body.sf).replace(/[,\s]/g, ''));
          put('sf', Number.isNaN(n) ? String(body.sf) : n);
        }
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ toBottom: true, cells }]),
        });
        const data = await resp.json();
        const rowId = data && data.result && data.result[0] && data.result[0].id;
        if (resp.ok && data.resultCode === 0 && rowId) return json({ ok: true, rowId }, 200, headers);
        return json({ ok: false, error: (data && data.message) || 'Smartsheet rejected the new row', detail: data }, 502, headers);
      }

      // ---- Storm dispatch log (Contracted tab) ----
      // GET /dispatch — the whole log
      if (url.pathname === '/dispatch' && request.method === 'GET') {
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${DISPATCH_SHEET_ID}`, { headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}` } });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }
      // POST /dispatch-add  { items: [ { request, storm, stormDate, store, address, pm, vendor, status, service, forecast, ... } ] }
      // Adds one row per item (bottom of the log). Returns { ok, rowIds: [ ... same order ... ] }.
      if (url.pathname === '/dispatch-add' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const items = Array.isArray(body && body.items) ? body.items.slice(0, 400) : [];
        if (!items.length) return json({ error: 'items required' }, 400, headers);
        const rowsOut = items.map(it => {
          const cells = [];
          for (const [k, colId] of Object.entries(DISPATCH_COLS)) {
            const v = it[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') cells.push({ columnId: colId, value: typeof v === 'number' ? v : String(v).trim() });
          }
          return { toBottom: true, cells };
        });
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${DISPATCH_SHEET_ID}/rows`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(rowsOut),
        });
        const data = await resp.json();
        const rowIds = Array.isArray(data && data.result) ? data.result.map(x => x.id) : [];
        if (resp.ok && data.resultCode === 0 && rowIds.length === items.length) return json({ ok: true, rowIds }, 200, headers);
        return json({ ok: false, error: (data && data.message) || 'Smartsheet rejected the new rows', detail: data }, 502, headers);
      }
      // POST /dispatch-update  { rowId, field: <key of DISPATCH_COLS>, value }
      if (url.pathname === '/dispatch-update' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const { rowId, field, value } = body || {};
        const columnId = DISPATCH_COLS[field];
        if (!rowId || !columnId) return json({ error: `rowId and a known field are required (got field=${field})` }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${DISPATCH_SHEET_ID}/rows`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ id: rowId, cells: [{ columnId, value: value === null || value === undefined ? '' : value }] }]),
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      // ---- Vendor Compliance (Vendor Tracking List sheet) ----
      const ssHeaders = { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}` };

      // ---- Site attachments on the Bidding sheet (overhead map) ----
      // GET /attachments?rowId= — files attached to that site's row
      if (url.pathname === '/attachments' && request.method === 'GET') {
        const rowId = url.searchParams.get('rowId');
        if (!rowId) return json({ error: 'rowId required' }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows/${encodeURIComponent(rowId)}/attachments?includeAll=true`, { headers: ssHeaders });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // GET /file?attId= — a short-lived download link for one attachment ({ url, name })
      if (url.pathname === '/file' && request.method === 'GET') {
        const attId = url.searchParams.get('attId');
        if (!attId) return json({ error: 'attId required' }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/attachments/${encodeURIComponent(attId)}`, { headers: ssHeaders });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // GET /file-content?attId= — streams the attachment itself (so the page can show / download it)
      if (url.pathname === '/file-content' && request.method === 'GET') {
        const attId = url.searchParams.get('attId');
        if (!attId) return json({ error: 'attId required' }, 400, headers);
        const meta = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/attachments/${encodeURIComponent(attId)}`, { headers: ssHeaders });
        const info = await meta.json();
        if (!meta.ok || !info.url) return json({ error: 'attachment not found' }, 404, headers);
        const file = await fetch(info.url); // short-lived pre-signed link; no auth header
        if (!file.ok) return json({ error: 'could not fetch file' }, 502, headers);
        return new Response(file.body, {
          status: 200,
          headers: { ...headers, 'Content-Type': info.mimeType || file.headers.get('Content-Type') || 'application/octet-stream', 'Cache-Control': 'private, max-age=300' },
        });
      }

      // POST /attach?rowId=&name= — raw file body, attached to that site's row
      if (url.pathname === '/attach' && request.method === 'POST') {
        const rowId = url.searchParams.get('rowId');
        const name = (url.searchParams.get('name') || 'upload').replace(/[\r\n"]/g, '_');
        if (!rowId) return json({ error: 'rowId required' }, 400, headers);
        const buf = await request.arrayBuffer();
        if (!buf.byteLength) return json({ error: 'empty file' }, 400, headers);
        if (buf.byteLength > 25 * 1024 * 1024) return json({ error: 'file too large (25 MB max)' }, 413, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows/${encodeURIComponent(rowId)}/attachments`, {
          method: 'POST',
          headers: {
            ...ssHeaders,
            'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${name}"`,
            'Content-Length': String(buf.byteLength),
          },
          body: buf,
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      // ---- Gmail drafts (optional; needs the 3 GOOGLE_* secrets, see GMAIL_SETUP.md) ----
      // POST /gmail-draft  { to, subject, body, attachments: [{ name, mime, data(base64) }] }
      // Creates a DRAFT in Zak's Gmail (never sends) and returns { ok, id, messageId, url }.
      if (url.pathname === '/gmail-draft' && request.method === 'POST') {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
          return json({ error: 'gmail-not-configured' }, 501, headers);
        }
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const tok = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: env.GOOGLE_REFRESH_TOKEN,
            grant_type: 'refresh_token',
          }),
        });
        const tokData = await tok.json();
        if (!tok.ok || !tokData.access_token) {
          return json({ error: 'google-auth-failed', detail: tokData.error_description || tokData.error || '' }, 502, headers);
        }
        const raw = buildMime(body || {});
        const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokData.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: { raw } }),
        });
        const data = await resp.json();
        if (!resp.ok) return json({ error: 'gmail-error', detail: (data.error && data.error.message) || '' }, 502, headers);
        const messageId = data.message && data.message.id;
        return json({
          ok: true,
          id: data.id,
          messageId,
          url: `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`,
        }, 200, headers);
      }

      // GET /vendors — the whole Vendor Tracking List
      if (url.pathname === '/vendors' && request.method === 'GET') {
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}`, { headers: ssHeaders });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // POST /vendor-update { rowId, field, value }
      if (url.pathname === '/vendor-update' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const { rowId, field, value } = body || {};
        const columnId = VENDOR_FIELD_COLUMN_IDS[field];
        if (!rowId || !columnId) return json({ error: `rowId and a known vendor field are required (got field=${field})` }, 400, headers);
        const cellValue = value === null || value === undefined ? '' : value;
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}/rows`, {
          method: 'PUT',
          headers: { ...ssHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ id: rowId, cells: [{ columnId, value: cellValue }] }]),
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      // POST /vendor-add { vendor } — adds a new row (name only) at the bottom of the Vendor Tracking List
      if (url.pathname === '/vendor-add' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'body must be JSON' }, 400, headers); }
        const name = String((body && body.vendor) || '').trim();
        if (!name) return json({ error: 'vendor name required' }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}/rows`, {
          method: 'POST',
          headers: { ...ssHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ toBottom: true, cells: [{ columnId: VENDOR_FIELD_COLUMN_IDS.vendor, value: name }] }]),
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      // GET /vendor-attachments?rowId= — files attached to that vendor's row
      if (url.pathname === '/vendor-attachments' && request.method === 'GET') {
        const rowId = url.searchParams.get('rowId');
        if (!rowId) return json({ error: 'rowId required' }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}/rows/${encodeURIComponent(rowId)}/attachments?includeAll=true`, { headers: ssHeaders });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // GET /vendor-file?attId= — a short-lived download link for one attachment ({ url, name })
      if (url.pathname === '/vendor-file' && request.method === 'GET') {
        const attId = url.searchParams.get('attId');
        if (!attId) return json({ error: 'attId required' }, 400, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}/attachments/${encodeURIComponent(attId)}`, { headers: ssHeaders });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // POST /vendor-attach?rowId=&name= — raw file body, attached to that vendor's row
      if (url.pathname === '/vendor-attach' && request.method === 'POST') {
        const rowId = url.searchParams.get('rowId');
        const name = (url.searchParams.get('name') || 'upload').replace(/[\r\n"]/g, '_');
        if (!rowId) return json({ error: 'rowId required' }, 400, headers);
        const buf = await request.arrayBuffer();
        if (!buf.byteLength) return json({ error: 'empty file' }, 400, headers);
        if (buf.byteLength > 25 * 1024 * 1024) return json({ error: 'file too large (25 MB max)' }, 413, headers);
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${VENDOR_SHEET_ID}/rows/${encodeURIComponent(rowId)}/attachments`, {
          method: 'POST',
          headers: {
            ...ssHeaders,
            'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${name}"`,
            'Content-Length': String(buf.byteLength),
          },
          body: buf,
        });
        const data = await resp.json();
        return json(data, resp.ok && data.resultCode === 0 ? 200 : 502, headers);
      }

      return json({ error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500, headers);
    }
  },
};
