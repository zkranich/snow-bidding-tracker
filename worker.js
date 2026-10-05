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

const SHEET_ID = '1101172935970692'; // 26-27 Snow Bidding Sheet

// Field name (as sent by the dashboard) -> Smartsheet column ID.
// These four are the ones the dashboard currently syncs live.
const FIELD_COLUMN_IDS = {
  customerStatus: 7113215152263044, // Customer Status (picklist)
  vendorStatus: 1483715618049924,   // Vendor Status (picklist)
  lost: 5987315245420420,           // Lost (checkbox)
  region: 260677394796420,          // Region (picklist)
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
      // GET /rows — pulls the live sheet straight from Smartsheet. Not
      // wired into the dashboard yet (it still loads from the baked-in
      // snapshot) — this is here so a future "load live instead of a
      // snapshot" step doesn't need a second Worker deploy.
      if (url.pathname === '/rows' && request.method === 'GET') {
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`, {
          headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}` },
        });
        const data = await resp.json();
        return json(data, resp.ok ? 200 : 502, headers);
      }

      // POST /update  { rowId: number, field: 'customerStatus'|'vendorStatus'|'lost'|'region', value: string|boolean|null }
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

      return json({ error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500, headers);
    }
  },
};
