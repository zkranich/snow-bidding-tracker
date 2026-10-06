// Copy this file to config.js (same folder as index.html) and fill in your values.
// config.js is yours: replacing index.html with a newer version never touches it.
window.SNOW_CONFIG = {
  // Your Cloudflare Worker address (WORKER_SETUP.md), e.g. 'https://snow-bidding-sync.yourname.workers.dev'
  workerUrl: '',
  // The same random string you saved as DASHBOARD_KEY on that Worker
  dashboardKey: '',
  // Google Maps JavaScript API key (MAP_SETUP.md) for the real Google Map. Leave '' to keep the schematic map.
  // Prefilled with the same key the Parkinson portal uses. Add https://zkranich.github.io/* to its allowed websites in Google Cloud.
  googleMapsKey: 'AIzaSyBiW0zuaB27AFxKKBn69cnn8lPnC-B6CJA',
};
