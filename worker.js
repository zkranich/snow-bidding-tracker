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
      // GET /rows — pulls the live sheet straight from Smartsheet. The
      // dashboard calls this on load to overlay saved values onto its
      // baked-in snapshot.
      if (url.pathname === '/rows' && request.method === 'GET') {
        const resp = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`, {
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

      return json({ error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500, headers);
    }
  },
};
