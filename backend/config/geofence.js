// config/geofence.js
// Geofencing configuration for DumBake – service radius around Ranchi bakery

module.exports = {
  // Latitude & Longitude of primary bakery location (to be confirmed by user)
  centre: {
    lat: process.env.GEOFENCE_LATITUDE ? parseFloat(process.env.GEOFENCE_LATITUDE) : 23.3445, // example Ranchi lat
    lng: process.env.GEOFENCE_LONGITUDE ? parseFloat(process.env.GEOFENCE_LONGITUDE) : 85.3096, // example Ranchi lng
  },
  radiusMeters: 12 * 1000, // 12 km service radius
};
