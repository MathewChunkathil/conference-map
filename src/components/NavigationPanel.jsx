import { Building2, Layers, DoorOpen, Navigation, Locate, ArrowUpRight } from 'lucide-react';
import { formatDistance, formatFloor } from '../utils/distance';

export default function NavigationPanel({ venue, distance, hasGps, onManualArrive }) {
  const distanceLabel = distance !== null ? formatDistance(distance) : null;
  const floorLabel = formatFloor(venue.floor);

  // Progress bar — clamp to 0-100%, treat 500m as "starting distance" for visual
  const progressPct = distance !== null
    ? Math.max(0, Math.min(100, Math.round((1 - distance / 500) * 100)))
    : 0;

  // Color the distance based on proximity
  const distanceColor =
    distance === null ? 'var(--color-text-1)'
    : distance < 30  ? 'var(--color-success)'
    : distance < 100 ? 'var(--color-warning)'
    : 'var(--color-text-1)';

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
              {distance < 50 && (
                <div className="nav-close-badge">Almost there!</div>
              )}
            </div>
            <div className="nav-progress-bar">
              <div
                className="nav-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
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

      {/* Manual arrive button */}
      <button className="btn-arrived" onClick={onManualArrive}>
        <ArrowUpRight size={16} />
        I've Arrived
      </button>
    </div>
  );
}
