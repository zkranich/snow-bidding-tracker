# Real Google Map — setup (about 5 minutes)

The Contract Accepted map becomes a real Google Map with one pin per store,
as classic teardrop pins with the store number on each one (same look as the Parkinson portal), colored by Vendor Status (red / yellow / green / grey). Layout matches the Parkinson portal: wide map on the left, store list on the right. Click a pin or a store in the list to zoom in and see the store, customer, address, vendor status and an "Open in Google Maps" link.
Until a key is added, the old schematic map keeps working.

## 1. Get a Google Maps API key
1. Go to https://console.cloud.google.com and create (or pick) a project.
   Billing must be turned on for the project; Google's monthly free credit
   covers this dashboard's usage many times over.
2. **APIs & Services -> Library**, enable both:
   - **Maps JavaScript API**
   - **Geocoding API**
3. **APIs & Services -> Credentials -> Create credentials -> API key**.

## 2. Lock the key down (important)
The key sits in a public web page, so restrict it:
- **Application restrictions:** Websites, add `https://zkranich.github.io/*`
- **API restrictions:** Restrict key -> Maps JavaScript API and Geocoding API only.

## 3. Put it in the dashboard
Copy `config.example.js` to `config.js` (same folder as `index.html`), paste the
key into `googleMapsKey: ''`, and upload `config.js` to GitHub. Replacing
`index.html` later never touches `config.js`.

**Shortcut:** your Parkinson Enterprises portal already uses a Google Maps key.
You can reuse the same key — just make sure its website restriction includes
`https://zkranich.github.io/*` (that covers every portal and this dashboard)
and that both Maps JavaScript API and Geocoding API are enabled on it.

## Notes
- First time the map opens it looks up each store's address (a few seconds for
  ~60 stores); results are cached in your browser, so later opens are instant.
- A store whose address Google can't find is skipped and named in the line
  above the list; it still appears in the list below the map.
- If the key is wrong or the APIs aren't enabled, the page says so and falls
  back to the schematic map.
