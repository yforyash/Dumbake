// services/geofenceService.js
// Service to check whether a given coordinate lies within the allowed service radius

const { centre, radiusMeters } = require('../config/geofence');
const { haversineDistance } = require('../utils/haversine');

/**
 * Returns true if the point (lat,lng) is inside the configured radius
 * @param {number} lat Latitude of point
 * @param {number} lng Longitude of point
 */
function isWithinServiceArea(lat, lng) {
  const distance = haversineDistance(lat, lng, centre.lat, centre.lng);
  return distance <= radiusMeters;
}

module.exports = {
  isWithinServiceArea,
  radiusMeters,
  centre,
};
