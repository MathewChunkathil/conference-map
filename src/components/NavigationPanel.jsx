import { useState } from 'react';
import { Building2, Layers, DoorOpen, Navigation, Locate, ArrowUpRight, Share2, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistance, formatFloor, getBearing, formatBearing } from '../utils/distance';
import { getWalkingTime } from '../utils/routing';

export default function NavigationPanel({ venue, distance, routeData, hasGps, userPosition, onManualArrive, delegateGender, buildingFacilities }) {
  const [expanded, setExpanded] = useState(false);
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

  // ── Bearing to destination ─────────────────────────────
  const bearing = userPosition
    ? getBearing(userPosition.lat, userPosition.lng, venue.latitude, venue.longitude)
    : null;
  const bearingInfo = formatBearing(bearing);

  // ── Building facilities lookup ─────────────────────────
  const facilities = buildingFacilities?.[venue.buildingCode] || null;
  const floorKey = venue.floor === 'Ground' ? 'Ground' : venue.floor;
  const washroomData = facilities?.washrooms?.[floorKey] || facilities?.washrooms?.['Ground'] || null;
  const washroomDir = washroomData
    ? (delegateGender === 'female' ? washroomData.female : washroomData.male)
    : null;

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

  return (
    <div className={`nav-panel ${expanded ? 'nav-panel--expanded' : ''}`}>
      {/* ── Compact summary bar — always visible ──────── */}
      <button
        className="nav-compact-bar"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse navigation panel' : 'Expand navigation panel'}
      >
        <div className="nav-compact-left">
          <Navigation size={14} className="nav-icon-spin" />
          <span className="nav-compact-venue">{venue.name}</span>
          <span className="nav-compact-sep">·</span>
          <span className="nav-compact-building">{venue.building}</span>
        </div>
        <div className="nav-compact-right">
          {hasGps && distance !== null ? (
            <>
              {bearing !== null && (
                <span className="nav-compact-bearing">
                  <span className="nav-compact-bearing-arrow">{bearingInfo.arrow}</span>
                </span>
              )}
              <span className="nav-compact-dist" style={{ color: distanceColor }}>
                {distanceLabel}
              </span>
              <span className="nav-compact-eta">
                <Clock size={11} />
                {walkingTime}
              </span>
            </>
          ) : (
            <span className="nav-compact-no-gps">No GPS</span>
          )}
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {/* Progress bar — always visible (thin) */}
      {hasGps && distance !== null && (
        <div className="nav-progress-bar nav-progress-bar--compact">
          <div
            className="nav-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* ── Expanded details ────────────────────────── */}
      {expanded && (
        <div className="nav-expanded-content">
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

          {/* Facility chips */}
          {facilities && (
            <div className="facility-chips">
              {washroomDir && (
                <div className="facility-chip">
                  <span className="facility-chip-icon">🚻</span>
                  <span className="facility-chip-label">Washroom:</span>
                  <span className="facility-chip-value">{washroomDir}</span>
                </div>
              )}
              {facilities.water && (
                <div className="facility-chip">
                  <span className="facility-chip-icon">💧</span>
                  <span className="facility-chip-label">Water:</span>
                  <span className="facility-chip-value">{facilities.water}</span>
                </div>
              )}
              {facilities.food && (
                <div className="facility-chip">
                  <span className="facility-chip-icon">🍽️</span>
                  <span className="facility-chip-label">Food:</span>
                  <span className="facility-chip-value">{facilities.food}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons — always visible */}
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
