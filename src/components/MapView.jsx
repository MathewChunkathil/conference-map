import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  useMap,
  useMapsLibrary,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';
import graphData from '../data/campus-graph.json';

// ─── Pre-compute graph edge segments and node positions ───────────────────────
function buildGraphOverlay() {
  const { nodes, edges } = graphData;
  const edgeSegments = [];
  const drawn = new Set();

  for (const [fromId, neighbors] of Object.entries(edges)) {
    const fromNode = nodes[fromId];
    if (!fromNode || (fromNode.lat === 0 && fromNode.lng === 0)) continue;

    for (const toId of Object.keys(neighbors)) {
      const key = [fromId, toId].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);

      const toNode = nodes[toId];
      if (!toNode || (toNode.lat === 0 && toNode.lng === 0)) continue;

      edgeSegments.push({
        key,
        from: { lat: fromNode.lat, lng: fromNode.lng },
        to: { lat: toNode.lat, lng: toNode.lng },
      });
    }
  }

  const nodeMarkers = Object.entries(nodes)
    .filter(([, n]) => n.lat !== 0 || n.lng !== 0)
    .map(([id, n]) => ({
      id,
      lat: n.lat,
      lng: n.lng,
      label: n.label,
      isBuilding: id.startsWith('B_'),
    }));

  return { edgeSegments, nodeMarkers };
}

const graphOverlayData = buildGraphOverlay();

// ─── Graph overlay: polylines + node dots ─────────────────────────────────────
function GraphOverlay() {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const overlaysRef = useRef([]);

  useEffect(() => {
    if (!map || !coreLib) return;

    // Clean up previous overlays
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    // Draw edge polylines
    graphOverlayData.edgeSegments.forEach((seg) => {
      const polyline = new google.maps.Polyline({
        path: [seg.from, seg.to],
        strokeColor: '#94a3b8',
        strokeOpacity: 0.45,
        strokeWeight: 2,
        geodesic: true,
        map,
        zIndex: 1,
      });
      overlaysRef.current.push(polyline);
    });

    // Draw node circle markers
    graphOverlayData.nodeMarkers.forEach((node) => {
      const circle = new google.maps.Circle({
        center: { lat: node.lat, lng: node.lng },
        radius: node.isBuilding ? 2.5 : 1.5,
        strokeColor: node.isBuilding ? '#a78bfa' : '#94a3b8',
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: node.isBuilding ? '#a78bfa' : '#94a3b8',
        fillOpacity: node.isBuilding ? 0.7 : 0.5,
        map,
        zIndex: 2,
        clickable: false,
      });
      overlaysRef.current.push(circle);
    });

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
    };
  }, [map, coreLib]);

  return null;
}

// ─── Walking Directions renderer ──────────────────────────────────────────────
function Directions({ origin, destination, onRouteReady }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const serviceRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!routesLib || !map) return;

    serviceRef.current = new routesLib.DirectionsService();
    rendererRef.current = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true, // We draw our own markers
      polylineOptions: {
        strokeColor: '#818cf8',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        zIndex: 10,
      },
    });

    return () => {
      if (rendererRef.current) {
        rendererRef.current.setMap(null);
      }
    };
  }, [routesLib, map]);

  useEffect(() => {
    if (!serviceRef.current || !rendererRef.current || !origin || !destination) {
      // Clear directions when no route needed
      if (rendererRef.current) {
        rendererRef.current.setDirections({ routes: [] });
      }
      return;
    }

    serviceRef.current.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          rendererRef.current.setDirections(result);

          // Extract distance and duration from the response
          const leg = result.routes?.[0]?.legs?.[0];
          if (leg && onRouteReady) {
            onRouteReady({
              distanceMetres: leg.distance?.value || 0,
              distanceText: leg.distance?.text || '',
              durationSeconds: leg.duration?.value || 0,
              durationText: leg.duration?.text || '',
              steps: leg.steps || [],
            });
          }
        } else {
          console.warn('Directions request failed:', status);
          // Report failure so App can fall back to Dijkstra
          if (onRouteReady) {
            onRouteReady(null);
          }
        }
      }
    );
  }, [origin, destination, onRouteReady]);

  return null;
}

// ─── User location blue dot with compass cone ─────────────────────────────────
function UserLocationMarker({ position }) {
  if (!position) return null;

  const hasHeading =
    position.heading !== null &&
    position.heading !== undefined &&
    Number.isFinite(position.heading);

  return (
    <AdvancedMarker
      position={{ lat: position.lat, lng: position.lng }}
      zIndex={100}
    >
      <div
        style={{
          position: 'relative',
          width: hasHeading ? '60px' : '22px',
          height: hasHeading ? '60px' : '22px',
        }}
      >
        {hasHeading && (
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `rotate(${position.heading}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <defs>
              <radialGradient
                id="cone-grad"
                cx="50%"
                cy="100%"
                r="100%"
                fx="50%"
                fy="100%"
              >
                <stop offset="0%" stopColor="rgba(59,130,246,0.45)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0)" />
              </radialGradient>
            </defs>
            <path d="M30,30 L16,4 Q30,0 44,4 Z" fill="url(#cone-grad)" />
          </svg>
        )}
        <div
          className="user-location-dot"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </AdvancedMarker>
  );
}

// ─── Map controller for auto-fit ──────────────────────────────────────────────
function MapController({ userPosition, destination }) {
  const map = useMap();
  const initialFitDone = useRef(false);
  const hadUserPosition = useRef(false);

  useEffect(() => {
    if (!map) return;

    const userJustAcquired = userPosition && !hadUserPosition.current;
    if (userPosition) hadUserPosition.current = true;

    if (userJustAcquired && initialFitDone.current && destination) {
      initialFitDone.current = false;
    }

    if (!initialFitDone.current) {
      if (userPosition && destination) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: userPosition.lat, lng: userPosition.lng });
        bounds.extend({ lat: destination.latitude, lng: destination.longitude });
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        initialFitDone.current = true;
      } else if (destination && !userPosition) {
        map.setCenter({ lat: destination.latitude, lng: destination.longitude });
        map.setZoom(18);
        initialFitDone.current = true;
      }
    }
  }, [userPosition, destination, map]);

  useEffect(() => {
    initialFitDone.current = false;
    hadUserPosition.current = !!userPosition;
  }, [destination?.id]);

  return null;
}

// ─── Main MapView component ──────────────────────────────────────────────────
export default function MapView({
  userPosition,
  destination,
  onGoogleRouteReady,
}) {
  const defaultCenter = destination
    ? { lat: destination.latitude, lng: destination.longitude }
    : { lat: 9.5097, lng: 76.5505 };

  // Build origin/destination for Directions API
  const directionsOrigin = userPosition
    ? { lat: userPosition.lat, lng: userPosition.lng }
    : null;

  const directionsDestination = destination
    ? { lat: destination.latitude, lng: destination.longitude }
    : null;

  const handleRouteReady = useCallback(
    (routeInfo) => {
      if (onGoogleRouteReady) onGoogleRouteReady(routeInfo);
    },
    [onGoogleRouteReady]
  );

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={18}
      mapId="campus-nav-map"
      className="map-container"
      gestureHandling="greedy"
      disableDefaultUI={false}
      zoomControl={true}
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={false}
      mapTypeId="satellite"
      tilt={0}
    >
      {/* Campus walkable path network */}
      <GraphOverlay />

      {/* User blue dot with compass cone */}
      <UserLocationMarker position={userPosition} />

      {/* Destination pin */}
      {destination && (
        <AdvancedMarker
          position={{ lat: destination.latitude, lng: destination.longitude }}
          zIndex={50}
        >
          <div className="dest-pin">
            <svg
              width="28"
              height="40"
              viewBox="0 0 24 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
                fill="#6366f1"
              />
              <circle cx="12" cy="12" r="5" fill="white" />
            </svg>
          </div>
        </AdvancedMarker>
      )}

      {/* Google Walking Directions */}
      <Directions
        origin={directionsOrigin}
        destination={directionsDestination}
        onRouteReady={handleRouteReady}
      />

      {/* Auto-fit camera */}
      <MapController
        userPosition={userPosition}
        destination={destination}
      />
    </Map>
  );
}
