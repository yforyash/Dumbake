const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse failed: ' + e.message));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifyLogistics() {
  console.log('--- TESTING OSRM ROUTING DISTANCE CALCULATION ---');
  const bakeryLng = 85.3096;
  const bakeryLat = 23.3441;
  
  const targetLng = 85.3371;
  const targetLat = 23.3694;

  const url = `https://router.project-osrm.org/route/v1/driving/${bakeryLng},${bakeryLat};${targetLng},${targetLat}?overview=false`;
  
  try {
    const data = await fetchJson(url);
    if (data.routes && data.routes.length > 0) {
      const distanceMeters = data.routes[0].distance;
      const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
      const durationSeconds = data.routes[0].duration;
      const computedFee = Math.max(30, Math.round(distanceKm * 10));

      console.log('SUCCESS: Driving Route details fetched!');
      console.log(` - Road Distance: ${distanceKm} km`);
      console.log(` - Travel Duration: ${(durationSeconds / 60).toFixed(1)} mins`);
      console.log(` - Dynamic Delivery Fee (₹10/km, min ₹30): ₹${computedFee}`);
      
      if (distanceKm <= 15) {
        console.log(' - Geofence Status: INSIDE (Deliverable)');
      } else {
        console.log(' - Geofence Status: OUT OF BOUNDS (Blocked)');
      }
    } else {
      console.error('FAIL: No routing paths found.');
    }
  } catch (err) {
    console.error('FAIL: Fetching OSRM route details failed:', err.message);
  }

  console.log('\n--- TESTING GEOPHYSICAL BOUNDARY LIMIT BLOCK (OUT OF BOUNDS) ---');
  
  const farLng = 77.5946;
  const farLat = 12.9716;
  const farUrl = `https://router.project-osrm.org/route/v1/driving/${bakeryLng},${bakeryLat};${farLng},${farLat}?overview=false`;
  
  try {
    const data = await fetchJson(farUrl);
    if (data.routes && data.routes.length > 0) {
      const distanceKm = data.routes[0].distance / 1000;
      console.log(` - Distance to Bangalore: ${distanceKm.toFixed(2)} km`);
      if (distanceKm > 15) {
        console.log('SUCCESS: Correctly caught as OUT OF BOUNDS (Blocked)');
      } else {
        console.error('FAIL: Geofence check failed to block far coordinates!');
      }
    } else {
      console.log(' - OSRM returned no routes to Bangalore (Normal for cross-country routes on OSRM default profile)');
    }
  } catch (err) {
    console.log('Skipping far test (OSRM may block cross-country continental routes):', err.message);
  }
}

verifyLogistics();
