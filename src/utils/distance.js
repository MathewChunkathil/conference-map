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

/**
 * Compute initial bearing (forward azimuth) from point 1 to point 2.
 * Returns degrees 0-360 (0 = North, 90 = East, 180 = South, 270 = West).
 * Returns null if any input is not finite.
 */
export function getBearing(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) ||
      !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Convert a bearing (0-360°) to a human-readable compass direction with arrow.
 * Returns object { label, arrow } e.g. { label: "North-East", arrow: "↗" }
 */
export function formatBearing(bearing) {
  if (bearing === null || !Number.isFinite(bearing)) {
    return { label: '--', arrow: '' };
  }

  const directions = [
    { label: 'North',       arrow: '↑' },
    { label: 'North-East',  arrow: '↗' },
    { label: 'East',        arrow: '→' },
    { label: 'South-East',  arrow: '↘' },
    { label: 'South',       arrow: '↓' },
    { label: 'South-West',  arrow: '↙' },
    { label: 'West',        arrow: '←' },
    { label: 'North-West',  arrow: '↖' },
  ];

  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

