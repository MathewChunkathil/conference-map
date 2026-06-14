/**
 * routing.js — Campus graph routing engine
 *
 * Provides Dijkstra shortest-path routing over the campus-graph.json data
 * and a node-snapping utility for raw GPS → graph node conversion.
 */

import { getDistanceMetres } from './distance';
import graphData from '../data/campus-graph.json';

const { nodes, edges } = graphData;

/**
 * Snap a raw GPS coordinate to the nearest graph node using Haversine distance.
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {Object} [nodesObj] - Optional custom nodes map; defaults to campus-graph.json nodes
 * @returns {{ nodeId: string, distance: number }} Closest node ID and distance in metres
 */
export function snapToNearestNode(lat, lng, nodesObj = nodes) {
  let closest = null;
  let minDist = Infinity;

  for (const [nodeId, node] of Object.entries(nodesObj)) {
    // Skip nodes with zero coordinates (placeholder junctions not yet surveyed)
    if (node.lat === 0 && node.lng === 0) continue;

    const dist = getDistanceMetres(lat, lng, node.lat, node.lng);
    if (dist !== null && dist < minDist) {
      minDist = dist;
      closest = nodeId;
    }
  }

  return { nodeId: closest, distance: minDist };
}

/**
 * Standard Dijkstra shortest-path algorithm over the campus graph.
 * Returns the ordered path as an array of { nodeId, lat, lng } objects,
 * or an empty array if no path exists.
 *
 * @param {string} startNodeId - Starting graph node ID
 * @param {string} endNodeId   - Destination graph node ID
 * @param {Object} [edgesObj]  - Optional custom edges map
 * @param {Object} [nodesObj]  - Optional custom nodes map
 * @returns {{ path: Array<{nodeId: string, lat: number, lng: number}>, totalWeight: number }}
 */
export function dijkstra(startNodeId, endNodeId, edgesObj = edges, nodesObj = nodes) {
  if (!startNodeId || !endNodeId) return { path: [], totalWeight: 0 };
  if (startNodeId === endNodeId) {
    const n = nodesObj[startNodeId];
    return {
      path: n ? [{ nodeId: startNodeId, lat: n.lat, lng: n.lng }] : [],
      totalWeight: 0,
    };
  }

  // Build distance and predecessor tables
  const dist = {};
  const prev = {};
  const visited = new Set();

  // Collect all known node IDs from both nodes and edges
  const allNodeIds = new Set([
    ...Object.keys(nodesObj),
    ...Object.keys(edgesObj),
  ]);

  for (const id of allNodeIds) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startNodeId] = 0;

  while (true) {
    // Pick unvisited node with smallest distance
    let u = null;
    let uDist = Infinity;
    for (const id of allNodeIds) {
      if (!visited.has(id) && dist[id] < uDist) {
        u = id;
        uDist = dist[id];
      }
    }

    if (u === null || u === endNodeId) break;
    visited.add(u);

    // Relax neighbors
    const neighbors = edgesObj[u] || {};
    for (const [v, weight] of Object.entries(neighbors)) {
      if (visited.has(v)) continue;
      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  // No path found
  if (dist[endNodeId] === Infinity) {
    return { path: [], totalWeight: 0 };
  }

  // Reconstruct path
  const pathIds = [];
  let current = endNodeId;
  while (current !== null) {
    pathIds.unshift(current);
    current = prev[current];
  }

  const path = pathIds.map((id) => {
    const node = nodesObj[id] || { lat: 0, lng: 0 };
    return { nodeId: id, lat: node.lat, lng: node.lng };
  });

  return { path, totalWeight: dist[endNodeId] };
}

/**
 * Compute the full route from a raw user GPS position to a venue's nearestNode.
 * Snaps the user to the closest graph node, runs Dijkstra, and returns
 * the coordinate path with the user's actual position prepended.
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {string} destNodeId - The destination venue's nearestNode
 * @returns {{ coordinates: Array<[number, number]>, totalDistance: number, path: Array }}
 */
export function computeRoute(userLat, userLng, destNodeId) {
  const snap = snapToNearestNode(userLat, userLng);

  if (!snap.nodeId || !destNodeId) {
    return { coordinates: [], totalDistance: 0, path: [] };
  }

  const { path, totalWeight } = dijkstra(snap.nodeId, destNodeId);

  if (path.length === 0) {
    return { coordinates: [], totalDistance: 0, path: [] };
  }

  // Prepend user's actual position for smooth polyline start
  const coordinates = [
    [userLat, userLng],
    ...path.map((p) => [p.lat, p.lng]),
  ];

  // Total distance = snap distance + graph weight
  const totalDistance = snap.distance + totalWeight;

  return { coordinates, totalDistance, path };
}

/**
 * Calculate the remaining graph distance from a user position along an existing path.
 * Finds the closest node in the path and sums remaining edge weights.
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array} path - The Dijkstra path array of { nodeId, lat, lng }
 * @returns {number} Remaining distance in metres
 */
export function getRemainingDistance(userLat, userLng, path) {
  if (!path || path.length === 0) return 0;

  // Find closest node in the path
  let closestIdx = 0;
  let minDist = Infinity;

  for (let i = 0; i < path.length; i++) {
    const d = getDistanceMetres(userLat, userLng, path[i].lat, path[i].lng);
    if (d !== null && d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  // Sum remaining edge weights from closestIdx to end
  let remaining = minDist; // distance from user to closest node
  for (let i = closestIdx; i < path.length - 1; i++) {
    const fromId = path[i].nodeId;
    const toId = path[i + 1].nodeId;
    const edgeWeight = edges[fromId]?.[toId];
    if (edgeWeight != null) {
      remaining += edgeWeight;
    } else {
      // Fallback: Haversine between consecutive path nodes
      const d = getDistanceMetres(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
      remaining += d || 0;
    }
  }

  return remaining;
}

/**
 * Convert metres to a humanized estimated walking time.
 * Assumes average walking speed of 80 m/min.
 *
 * @param {number} metres
 * @returns {string} e.g., "~2 min walk"
 */
export function getWalkingTime(metres) {
  if (!Number.isFinite(metres) || metres <= 0) return '--';
  const mins = Math.ceil(metres / 80);
  if (mins <= 1) return '~1 min walk';
  return `~${mins} min walk`;
}
