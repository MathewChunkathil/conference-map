import { useEffect, useCallback } from 'react';
import {
  CheckCircle2, Building2, Layers, DoorOpen, RotateCcw,
  Phone, ArrowDown, MapPin, Navigation2
} from 'lucide-react';
import { formatFloor } from '../utils/distance';

export default function ArrivalBanner({ venue, onDismiss, delegateGender, buildingFacilities }) {
  // Close on Escape key press — prevents keyboard trap
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
  }, [onDismiss]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const meta = venue.metadata || {};
  const hasEntrancePhoto = meta.entrancePhoto && meta.entrancePhoto.trim();
  const hasCorridorPhoto = meta.corridorPhoto && meta.corridorPhoto.trim();
  const hasInstructions = meta.indoorInstructions && meta.indoorInstructions.trim();
  const hasPhone = meta.coordinatorPhone && meta.coordinatorPhone.trim();

  // Building facilities lookup
  const facilities = buildingFacilities?.[venue.buildingCode] || null;
  const floorKey = venue.floor === 'Ground' ? 'Ground' : venue.floor;
  const washroomData = facilities?.washrooms?.[floorKey] || facilities?.washrooms?.['Ground'] || null;
  const washroomDir = washroomData
    ? (delegateGender === 'female' ? washroomData.female : washroomData.male)
    : null;

  return (
    <div
      className="arrival-overlay arrival-overlay--strip"
      role="dialog"
      aria-modal="true"
      aria-label="Arrival confirmation and indoor guide"
    >
      <div className="arrival-strip">
        {/* ── Success header ── */}
        <div className="arrival-strip-header">
          <div className="arrival-icon-ring">
            <CheckCircle2 size={44} className="arrival-check" />
          </div>
          <h2 className="arrival-title">You've Arrived!</h2>
          <p className="arrival-venue-name">{venue.name}</p>
        </div>

        {/* ── Scrollable indoor guide ── */}
        <div className="arrival-strip-scroll">

          {/* Venue details cards */}
          <div className="arrival-details">
            <div className="arrival-detail-row">
              <Building2 size={16} />
              <span>{venue.building}</span>
            </div>
            <div className="arrival-detail-row">
              <Layers size={16} />
              <span>{formatFloor(venue.floor)}</span>
            </div>
            <div className="arrival-detail-row">
              <DoorOpen size={16} />
              <span>Room {venue.room}</span>
            </div>
            {washroomDir && (
              <div className="arrival-detail-row">
                <span style={{ fontSize: 16, lineHeight: 1 }}>🚻</span>
                <span>Washroom: {washroomDir}</span>
              </div>
            )}
            {facilities?.water && (
              <div className="arrival-detail-row">
                <span style={{ fontSize: 16, lineHeight: 1 }}>💧</span>
                <span>{facilities.water}</span>
              </div>
            )}
            {facilities?.food && (
              <div className="arrival-detail-row">
                <span style={{ fontSize: 16, lineHeight: 1 }}>🍽️</span>
                <span>{facilities.food}</span>
              </div>
            )}
          </div>

          {/* ── Vertical Visual Strip — Indoor Handoff ── */}
          <div className="arrival-indoor-guide">
            <div className="arrival-guide-label">
              <Navigation2 size={14} />
              <span>Indoor Navigation Guide</span>
            </div>

            {/* Step 1: Entrance Photo */}
            {hasEntrancePhoto && (
              <div className="arrival-guide-step">
                <div className="arrival-guide-step-num">1</div>
                <div className="arrival-guide-step-content">
                  <div className="arrival-guide-step-label">Find This Entrance</div>
                  <div className="arrival-guide-photo">
                    <img
                      src={meta.entrancePhoto}
                      alt={`${venue.building} entrance`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="arrival-guide-photo-placeholder">
                      <MapPin size={24} />
                      <span>{venue.building} Entrance</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Indoor Instructions */}
            {hasInstructions && (
              <div className="arrival-guide-step">
                <div className="arrival-guide-step-num">{hasEntrancePhoto ? 2 : 1}</div>
                <div className="arrival-guide-step-content">
                  <div className="arrival-guide-step-label">Follow These Directions</div>
                  <div className="arrival-guide-instruction">
                    <ArrowDown size={18} className="arrival-guide-arrow" />
                    <p>{meta.indoorInstructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Corridor Photo */}
            {hasCorridorPhoto && (
              <div className="arrival-guide-step">
                <div className="arrival-guide-step-num">
                  {(hasEntrancePhoto ? 1 : 0) + (hasInstructions ? 1 : 0) + 1}
                </div>
                <div className="arrival-guide-step-content">
                  <div className="arrival-guide-step-label">Look for This Door</div>
                  <div className="arrival-guide-photo">
                    <img
                      src={meta.corridorPhoto}
                      alt={`Corridor to ${venue.room}`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="arrival-guide-photo-placeholder">
                      <DoorOpen size={24} />
                      <span>Room {venue.room}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SOS: Call Volunteer ── */}
          {hasPhone && (
            <a
              href={`tel:${meta.coordinatorPhone}`}
              className="arrival-sos-btn"
            >
              <Phone size={18} />
              <span>I'm Lost — Call Volunteer</span>
            </a>
          )}

          {/* ── Navigate to another venue ── */}
          <button className="btn-navigate-another" onClick={onDismiss}>
            <RotateCcw size={15} />
            Navigate to Another Venue
          </button>
        </div>
      </div>
    </div>
  );
}
