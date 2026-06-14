/**
 * Haversine formula — returns distance between two lat/lng points in metres.
 * Returns null if any input coordinate is not a finite number.
 */
export function getDistanceMetres(lat1, lng1, lat2, lng2) {
  // Guard: reject non-finite inputs (NaN, null, undefined, Infinity)
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) ||
      !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return null;
  }

  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.min(1, Math.max(0,
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  ));

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Human-readable distance label.
 * < 1000m → "42 m"
 * >= 1000m → "1.2 km"
 * Non-finite input → "--"
 */
export function formatDistance(metres) {
  if (!Number.isFinite(metres)) {
    return '--';
  }
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }
  return `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Human-readable floor label.
 */
export function formatFloor(floor) {
  const floorStr = String(floor).toLowerCase();
  if (floorStr === 'ground' || floorStr === '0') return 'Ground Floor';
  if (floorStr === '1') return '1st Floor';
  if (floorStr === '2') return '2nd Floor';
  if (floorStr === '3') return '3rd Floor';
  return `${floor}th Floor`;
}
