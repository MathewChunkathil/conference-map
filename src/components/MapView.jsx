import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default icon paths broken by Vite bundling ───────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom destination pin (indigo/primary color) - uses inline SVG, no CDN dependency
const destinationIcon = new L.DivIcon({
  className: '',
  html: `
    <div class="dest-pin">
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#6366f1"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

// User location dot — pulsing blue circle
const userIcon = new L.DivIcon({
  className: '',
  html: `<div class="user-location-dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Recenter map when user or destination changes
function MapController({ userPosition, destination }) {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!initialFitDone.current) {
      if (userPosition && destination) {
        const bounds = L.latLngBounds(
          [userPosition.lat, userPosition.lng],
          [destination.latitude, destination.longitude]
        );
        map.fitBounds(bounds, { padding: [60, 60] });
        initialFitDone.current = true;
      } else if (destination && !userPosition) {
        map.setView([destination.latitude, destination.longitude], 17);
        initialFitDone.current = true;
      }
    }
  }, [userPosition, destination, map]);

  // Reset when destination changes so it recenters
  useEffect(() => {
    initialFitDone.current = false;
  }, [destination?.id]);

  return null;
}

export default function MapView({ userPosition, destination }) {
  const defaultCenter = destination
    ? [destination.latitude, destination.longitude]
    : [9.5097, 76.5505]; // Campus approximate center

  const polylinePositions =
    userPosition && destination
      ? [
          [userPosition.lat, userPosition.lng],
          [destination.latitude, destination.longitude],
        ]
      : null;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={17}
      className="map-container"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={20}
        subdomains="abcd"
      />

      {/* User location */}
      {userPosition && (
        <>
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          />
          {userPosition.accuracy && (
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={userPosition.accuracy}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
          )}
        </>
      )}

      {/* Destination marker */}
      {destination && (
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={destinationIcon}
        />
      )}

      {/* Direction line */}
      {polylinePositions && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#6366f1',
            weight: 3,
            opacity: 0.85,
            dashArray: '8, 6',
          }}
        />
      )}

      <MapController userPosition={userPosition} destination={destination} />
    </MapContainer>
  );
}
