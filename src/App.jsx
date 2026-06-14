import { useState, useEffect, useRef, useMemo } from 'react';
import MapView from './components/MapView';
import VenueSelector from './components/VenueSelector';
import NavigationPanel from './components/NavigationPanel';
import ArrivalBanner from './components/ArrivalBanner';
import CampusInfoModal from './components/CampusInfoModal';
import { useGeolocation } from './hooks/useGeolocation';
import { getDistanceMetres } from './utils/distance';
import { computeRoute, getRemainingDistance } from './utils/routing';
import venueData from './data/venues.json';
import { MapPin, Menu, X, Compass, HelpCircle } from 'lucide-react';
import './App.css';

const ARRIVAL_THRESHOLD_METRES = 20;
const venues = venueData.venues.filter((v) => v.active);

export default function App() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const { position, error: gpsError, loading: gpsLoading } = useGeolocation();
  const arrivedRef = useRef(false);

  // ── Onboarding: delegate name ──────────────────────────
  const [delegateName, setDelegateName] = useState(() =>
    localStorage.getItem('delegateName') || ''
  );
  const [showOnboarding, setShowOnboarding] = useState(() =>
    !localStorage.getItem('delegateName')
  );
  const [nameInput, setNameInput] = useState('');

  function handleSaveName(e) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem('delegateName', name);
    setDelegateName(name);
    setShowOnboarding(false);
  }

  // ── Deep link parsing on mount ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // ?target=S02 → auto-select that venue (takes priority over meetLat/meetLng)
    const targetCode = params.get('target');
    if (targetCode) {
      const found = venues.find(
        (v) => v.venueCode === targetCode || v.venueCode === targetCode.toUpperCase()
      );
      if (found) {
        handleSelectVenue(found);
        return; // Don't process meetLat/meetLng if target was found
      }
    }

    // ?meetLat=X&meetLng=Y → create temporary meeting point
    const meetLat = parseFloat(params.get('meetLat'));
    const meetLng = parseFloat(params.get('meetLng'));
    if (Number.isFinite(meetLat) && Number.isFinite(meetLng)) {
      const meetingPoint = {
        id: 'meet',
        venueCode: 'MEET',
        type: 'meeting',
        name: 'Meeting Point',
        building: 'Custom Location',
        buildingCode: 'MT',
        floor: 'Ground',
        room: 'Shared Pin',
        latitude: meetLat,
        longitude: meetLng,
        nearestNode: null, // will snap dynamically
        description: '',
        active: true,
        metadata: {
          entrancePhoto: '',
          indoorInstructions: 'Head to the shared pin location.',
          corridorPhoto: '',
          coordinatorPhone: '',
        },
      };
      handleSelectVenue(meetingPoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Compute graph-based route ──────────────────────────
  const routeData = useMemo(() => {
    if (!position || !selectedVenue) return null;

    const destNode = selectedVenue.nearestNode;
    if (!destNode) {
      // For meeting points or venues without nearestNode, use direct line
      return null;
    }

    return computeRoute(position.lat, position.lng, destNode);
  }, [position, selectedVenue]);

  // ── Distance: prefer graph-based, fallback to Haversine ──
  const distance = useMemo(() => {
    if (!position || !selectedVenue) return null;

    // If we have a route with a path, use graph-based remaining distance
    if (routeData?.path?.length > 0) {
      return getRemainingDistance(position.lat, position.lng, routeData.path);
    }

    // Fallback: direct Haversine
    return getDistanceMetres(
      position.lat, position.lng,
      selectedVenue.latitude, selectedVenue.longitude
    );
  }, [position, selectedVenue, routeData]);

  // ── Auto-detect arrival ────────────────────────────────
  useEffect(() => {
    if (
      distance !== null &&
      distance <= ARRIVAL_THRESHOLD_METRES &&
      selectedVenue &&
      !arrivedRef.current
    ) {
      arrivedRef.current = true;
      setArrived(true);
    }
  }, [distance, selectedVenue]);

  function handleSelectVenue(venue) {
    setSelectedVenue(venue);
    setArrived(false);
    arrivedRef.current = false;
    setPanelOpen(false);
  }

  function handleDismissArrival() {
    setArrived(false);
    arrivedRef.current = false;
    setSelectedVenue(null);
    setPanelOpen(true);
  }

  function handleManualArrive() {
    arrivedRef.current = true;
    setArrived(true);
  }

  // ── Onboarding screen ─────────────────────────────────
  if (showOnboarding) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-card">
          <div className="onboarding-icon-ring">
            <Compass size={40} className="onboarding-icon" />
          </div>
          <h1 className="onboarding-title">Welcome to Campus Nav</h1>
          <p className="onboarding-subtitle">
            Your personal guide to the conference campus.
          </p>
          <form onSubmit={handleSaveName} className="onboarding-form">
            <input
              className="onboarding-input"
              type="text"
              placeholder="Enter your name…"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              aria-label="Your name"
            />
            <button
              className="onboarding-btn"
              type="submit"
              disabled={!nameInput.trim()}
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <Compass size={22} className="brand-icon" />
          <div>
            <div className="brand-name">Campus Nav</div>
            <div className="brand-sub">{venueData.eventName}</div>
          </div>
        </div>

        <div className="header-actions">
          {gpsLoading && (
            <div className="gps-loading-dot" title="Acquiring GPS..." />
          )}
          {position && !gpsLoading && (
            <div className="gps-active-dot" title="GPS Active" />
          )}
          {gpsError && !gpsLoading && (
            <div className="gps-error-dot" title="GPS Unavailable" />
          )}

          <button
            className="btn-menu"
            onClick={() => setShowHelp(true)}
            aria-label="Campus info and help"
          >
            <HelpCircle size={20} />
          </button>

          <button
            className="btn-menu"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? 'Close venue list' : 'Open venue list'}
          >
            {panelOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Map — always visible */}
      <main className="map-wrapper">
        <MapView
          userPosition={position}
          destination={selectedVenue}
          routeCoordinates={routeData?.coordinates || null}
        />

        {/* GPS acquiring overlay — non-blocking, just a small chip */}
        {gpsLoading && (
          <div className="gps-acquiring-chip">
            <div className="map-loading-spinner gps-chip-spinner" />
            <span>Acquiring GPS…</span>
          </div>
        )}

        {/* Floating "select venue" prompt when nothing selected */}
        {!selectedVenue && !panelOpen && (
          <div className="map-prompt">
            <MapPin size={16} />
            <span>Tap <strong>☰</strong> to select your destination</span>
          </div>
        )}

        {/* GPS error toast (non-blocking) */}
        {gpsError && !gpsLoading && (
          <div className="gps-toast">
            <span>⚠ GPS unavailable — map reference mode</span>
          </div>
        )}
      </main>

      {/* Bottom Navigation Panel — shown when navigating */}
      {selectedVenue && !arrived && !panelOpen && (
        <NavigationPanel
          venue={selectedVenue}
          distance={distance}
          routeData={routeData}
          hasGps={!!position && !gpsError}
          userPosition={position}
          onManualArrive={handleManualArrive}
        />
      )}

      {/* Venue Selector Drawer */}
      <div className={`venue-drawer ${panelOpen ? 'venue-drawer--open' : ''}`}>
        <button
          className="venue-drawer-handle"
          onClick={() => setPanelOpen(false)}
          aria-label="Collapse venue drawer"
          aria-expanded={panelOpen}
        />
        <VenueSelector
          venues={venues}
          selectedVenue={selectedVenue}
          onSelect={handleSelectVenue}
          delegateName={delegateName}
        />
      </div>

      {/* Drawer backdrop */}
      {panelOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* Arrival overlay */}
      {arrived && selectedVenue && (
        <ArrivalBanner venue={selectedVenue} onDismiss={handleDismissArrival} />
      )}

      {/* Campus Info / Help modal */}
      {showHelp && (
        <CampusInfoModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
