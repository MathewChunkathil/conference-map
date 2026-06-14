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

/**
 * Build a user location DivIcon with heading rotation for the flashlight effect.
 * When heading is available, a directional wedge is rendered; otherwise a plain dot.
 */
function createUserIcon(heading) {
  const hasHeading = heading !== null && heading !== undefined && Number.isFinite(heading);

  const html = hasHeading
    ? `<div class="user-location-dot user-location-dot--heading" style="transform: rotate(${heading}deg)">
         <div class="user-heading-wedge"></div>
       </div>`
    : `<div class="user-location-dot"></div>`;

  return new L.DivIcon({
    className: '',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Recenter map when user or destination changes
function MapController({ userPosition, destination }) {
  const map = useMap();
  const initialFitDone = useRef(false);
  const hadUserPosition = useRef(false);

  useEffect(() => {
    // Track if user position was ever null when we did the initial fit
    const userJustAcquired = userPosition && !hadUserPosition.current;

    if (userPosition) {
      hadUserPosition.current = true;
    }

    // If user position just became available and we already did a destination-only fit,
    // reset so we can re-fit with both points
    if (userJustAcquired && initialFitDone.current && destination) {
      initialFitDone.current = false;
    }

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
    hadUserPosition.current = !!userPosition;
  }, [destination?.id]);

  return null;
}

export default function MapView({ userPosition, destination, routeCoordinates }) {
  const defaultCenter = destination
    ? [destination.latitude, destination.longitude]
    : [9.5097, 76.5505]; // Campus approximate center

  // Use graph-based route coordinates if available, otherwise direct line
  const polylinePositions = routeCoordinates
    ? routeCoordinates
    : userPosition && destination
      ? [
          [userPosition.lat, userPosition.lng],
          [destination.latitude, destination.longitude],
        ]
      : null;

  // Build user icon with heading support for flashlight effect
  const userIcon = createUserIcon(userPosition?.heading);

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

      {/* Route polyline — thick styled path from routing engine */}
      {polylinePositions && (
        <>
          {/* Glow outline */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#6366f1',
              weight: 8,
              opacity: 0.25,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main route line */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#818cf8',
              weight: 4,
              opacity: 0.9,
              dashArray: '12, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      <MapController userPosition={userPosition} destination={destination} />
    </MapContainer>
  );
}
