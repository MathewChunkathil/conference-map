import { useState, useEffect, useRef, useCallback } from 'react';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 3000, // Allow 3s cached position to reduce battery drain
};

// Drop any position update where accuracy exceeds this threshold (multipath/concrete)
const MAX_ACCURACY_METRES = 50;

/**
 * Convert AbsoluteOrientationSensor quaternion [x, y, z, w] to compass heading.
 * Returns degrees 0-360 (0=N, 90=E, 180=S, 270=W).
 */
function quaternionToHeading(q) {
  const [x, y, z, w] = q;
  // Compute yaw (rotation around Z axis) from quaternion
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  let yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
  // Convert from math angle to compass heading (clockwise from north)
  let heading = (360 - yaw) % 360;
  if (heading < 0) heading += 360;
  return heading;
}

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);
  const compassHeadingRef = useRef(null);
  const positionRef = useRef(null); // latest position for merging compass updates
  const sensorRef = useRef(null);

  // ── Merge compass heading into position ────────────────
  const updateWithCompass = useCallback((compassDeg) => {
    compassHeadingRef.current = compassDeg;
    // If we already have a GPS position, update it with the compass heading
    if (positionRef.current) {
      setPosition((prev) => {
        if (!prev) return prev;
        return { ...prev, heading: compassDeg };
      });
    }
  }, []);

  // ── AbsoluteOrientationSensor (best: fused IMU) ────────
  useEffect(() => {
    // Feature-detect the Generic Sensor API
    if (typeof AbsoluteOrientationSensor === 'undefined') return;

    let sensor = null;
    try {
      sensor = new AbsoluteOrientationSensor({ frequency: 10 }); // 10 Hz
      sensorRef.current = sensor;

      sensor.addEventListener('reading', () => {
        if (sensor.quaternion) {
          const heading = quaternionToHeading(sensor.quaternion);
          updateWithCompass(heading);
        }
      });

      sensor.addEventListener('error', (e) => {
        // Sensor not available or permission denied — fall through to DeviceOrientation
        console.warn('AbsoluteOrientationSensor error:', e.error?.message);
        sensorRef.current = null;
      });

      // Request permission if needed, then start
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'accelerometer' }).then((result) => {
          if (result.state !== 'denied') {
            sensor.start();
          }
        }).catch(() => {
          // Permission API not supported for sensors, try starting directly
          sensor.start();
        });
      } else {
        sensor.start();
      }
    } catch {
      // AbsoluteOrientationSensor not supported — no-op
    }

    return () => {
      if (sensor) {
        try { sensor.stop(); } catch { /* ignore */ }
      }
    };
  }, [updateWithCompass]);

  // ── DeviceOrientation listener (fallback compass heading) ─────
  useEffect(() => {
    // Skip if AbsoluteOrientationSensor is active
    // (we still register, but only update if sensor isn't providing data)
    function handleOrientation(e) {
      // If AbsoluteOrientationSensor is active and reading, skip DeviceOrientation
      if (sensorRef.current && sensorRef.current.activated) return;

      // iOS: webkitCompassHeading is degrees from North (0=N, 90=E)
      // Android: alpha is degrees (needs conversion: heading = 360 - alpha)
      let heading = null;

      if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) {
        heading = e.webkitCompassHeading;
      } else if (e.absolute && typeof e.alpha === 'number' && Number.isFinite(e.alpha)) {
        heading = (360 - e.alpha) % 360;
      } else if (typeof e.alpha === 'number' && Number.isFinite(e.alpha)) {
        // Non-absolute fallback — still useful on many Android devices
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        updateWithCompass(heading);
      }
    }

    // iOS 13+ requires explicit permission request
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        })
        .catch(() => {
          // Permission denied — compass heading unavailable, GPS heading still works
        });
    } else if (typeof window !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [updateWithCompass]);

  // ── Geolocation watch ──────────────────────────────────
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

        // Prefer compass heading (works when stationary) over coords.heading
        const heading = compassHeadingRef.current ?? pos.coords.heading ?? null;

        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading,
        };
        positionRef.current = newPos;
        setPosition(newPos);
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
