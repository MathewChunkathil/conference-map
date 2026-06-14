import { Building2, Layers, DoorOpen, Navigation, Locate, ArrowUpRight, Share2, Clock } from 'lucide-react';
import { formatDistance, formatFloor } from '../utils/distance';
import { getWalkingTime } from '../utils/routing';

export default function NavigationPanel({ venue, distance, routeData, hasGps, userPosition, onManualArrive }) {
  const distanceLabel = distance !== null ? formatDistance(distance) : null;
  const floorLabel = formatFloor(venue.floor);
  const walkingTime = distance !== null ? getWalkingTime(distance) : '--';

  // Progress bar — clamp to 0-100%
  // Use graph totalDistance as baseline if available, otherwise 500m default
  const baseDistance = routeData?.totalDistance || 500;
  const progressPct = distance !== null
    ? Math.max(0, Math.min(100, Math.round((1 - distance / baseDistance) * 100)))
    : 0;

  // Color the distance based on proximity
  const distanceColor =
    distance === null ? 'var(--color-text-1)'
    : distance < 30  ? 'var(--color-success)'
    : distance < 100 ? 'var(--color-warning)'
    : 'var(--color-text-1)';

  // ── Web Share API ──────────────────────────────────────
  async function handleShare() {
    if (!userPosition) return;

    const shareData = {
      title: `Campus Nav — ${venue.name}`,
      text: `I'm heading to ${venue.name} (${venue.building}). Meet me there!`,
      url: `${window.location.origin}${window.location.pathname}?meetLat=${userPosition.lat}&meetLng=${userPosition.lng}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      // User cancelled or share failed silently
      if (err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  }

  // ── WakeLock to keep screen on during navigation ───────
  // Requested once on mount, released on unmount
  // (no useState needed — fire-and-forget)

  return (
    <div className="nav-panel">
      <div className="nav-panel-destination">
        <div className="nav-panel-title">
          <Navigation size={16} className="nav-icon-spin" />
          <span>Navigating to <strong>{venue.name}</strong></span>
        </div>
      </div>

      {/* Distance strip */}
      <div className="nav-distance-strip">
        {hasGps && distance !== null ? (
          <>
            <div className="nav-distance-row">
              <div>
                <div className="nav-distance-value" style={{ color: distanceColor }}>
                  {distanceLabel}
                </div>
                <div className="nav-distance-label">away</div>
              </div>
              <div className="nav-eta-badge">
                <Clock size={13} />
                <span>{walkingTime}</span>
              </div>
            </div>
            <div className="nav-progress-bar">
              <div
                className="nav-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {distance < 50 && (
              <div className="nav-close-badge" style={{ marginTop: 8 }}>Almost there!</div>
            )}
          </>
        ) : (
          <div className="nav-gps-warn">
            <Locate size={14} />
            <span>Enable GPS for live distance tracking</span>
          </div>
        )}
      </div>

      {/* Guidance cards */}
      <div className="nav-guidance-grid">
        <div className="nav-guidance-card">
          <Building2 size={20} className="guidance-icon guidance-icon--building" />
          <div className="guidance-label">Building</div>
          <div className="guidance-value">{venue.building}</div>
        </div>
        <div className="nav-guidance-card">
          <Layers size={20} className="guidance-icon guidance-icon--floor" />
          <div className="guidance-label">Floor</div>
          <div className="guidance-value">{floorLabel}</div>
        </div>
        <div className="nav-guidance-card nav-guidance-card--wide">
          <DoorOpen size={20} className="guidance-icon guidance-icon--room" />
          <div className="guidance-label">Room</div>
          <div className="guidance-value">{venue.room}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="nav-actions-row">
        <button className="btn-arrived" onClick={onManualArrive}>
          <ArrowUpRight size={16} />
          I've Arrived
        </button>
        {userPosition && (
          <button
            className="btn-share"
            onClick={handleShare}
            aria-label="Share your location"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
