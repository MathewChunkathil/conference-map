import { WifiOff, MapPin, RefreshCw } from 'lucide-react';

export default function GpsErrorScreen({ error }) {
  return (
    <div className="gps-error-screen">
      <div className="gps-error-card">
        <div className="gps-error-icon">
          <WifiOff size={36} />
        </div>
        <h2 className="gps-error-title">Location Unavailable</h2>
        <p className="gps-error-message">{error}</p>

        <div className="gps-manual-tip">
          <MapPin size={16} />
          <p>
            You can still select your destination below and use the map for
            visual reference. Follow the building, floor, and room guidance to
            reach your venue.
          </p>
        </div>

        <button
          className="btn-retry"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    </div>
  );
}
