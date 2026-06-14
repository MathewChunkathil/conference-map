import { useState, useEffect, useRef } from 'react';
import MapView from './components/MapView';
import VenueSelector from './components/VenueSelector';
import NavigationPanel from './components/NavigationPanel';
import ArrivalBanner from './components/ArrivalBanner';
import { useGeolocation } from './hooks/useGeolocation';
import { getDistanceMetres } from './utils/distance';
import venueData from './data/venues.json';
import { MapPin, Menu, X, Compass } from 'lucide-react';
import './App.css';

const ARRIVAL_THRESHOLD_METRES = 10;
const venues = venueData.venues.filter((v) => v.active);

export default function App() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true); // Open by default so users see the venue list
  const { position, error: gpsError, loading: gpsLoading } = useGeolocation();
  const arrivedRef = useRef(false);

  // Distance between user and selected venue
  const distance =
    position && selectedVenue
      ? getDistanceMetres(
          position.lat,
          position.lng,
          selectedVenue.latitude,
          selectedVenue.longitude
        )
      : null;

  // Auto-detect arrival
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
    setPanelOpen(false); // Close drawer on mobile after selection
  }

  function handleDismissArrival() {
    setArrived(false);
    arrivedRef.current = false;
    setSelectedVenue(null);
    setPanelOpen(true); // Re-open venue selector
  }

  function handleManualArrive() {
    arrivedRef.current = true;
    setArrived(true);
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
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? 'Close venue list' : 'Open venue list'}
          >
            {panelOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Map — always visible */}
      <main className="map-wrapper">
        {/* Map always renders; GPS state shown as overlay */}
        <MapView
          userPosition={position}
          destination={selectedVenue}
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
          hasGps={!!position && !gpsError}
          onManualArrive={handleManualArrive}
        />
      )}

      {/* Venue Selector Drawer */}
      <div className={`venue-drawer ${panelOpen ? 'venue-drawer--open' : ''}`}>
        <div className="venue-drawer-handle" onClick={() => setPanelOpen(false)} />
        <VenueSelector
          venues={venues}
          selectedVenue={selectedVenue}
          onSelect={handleSelectVenue}
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
    </div>
  );
}
