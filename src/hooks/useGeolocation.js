import { useState, useEffect, useRef } from 'react';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 3000, // Allow 3s cached position to reduce battery drain
};

// Drop any position update where accuracy exceeds this threshold (multipath/concrete)
const MAX_ACCURACY_METRES = 50;

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Fail-safe: drop inaccurate readings from concrete buildings
        if (pos.coords.accuracy > MAX_ACCURACY_METRES) {
          // Keep loading if we haven't got a good fix yet
          return;
        }

        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading, // may be null if stationary
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access was denied. Please enable GPS in your browser settings and reload the page.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Your location could not be determined. Make sure you are outdoors or near a window.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        } else {
          setError('An unknown location error occurred.');
        }
        setLoading(false);
      },
      GEOLOCATION_OPTIONS
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, loading };
}
