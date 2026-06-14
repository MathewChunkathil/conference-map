Markdown
# 📘 CAMPUS NAV V1.1: COMPREHENSIVE MASTER SPECIFICATION 

> **AGENT PROTOCOL: READ THIS FIRST**
> You are building a zero-backend, offline-first conference navigation SPA. You must strictly adhere to the exhaustive data schemas and component logic below. Do NOT remove any existing Leaflet configurations or accessibility attributes. Verify each step compiles before modifying the next file.

---

## 🏗️ PART 1: SYSTEM ARCHITECTURE & FAIL-SAFES
* **Stack:** React 19 + TypeScript + Vite 8 + Leaflet (`react-leaflet`).
* **Infrastructure:** Zero-backend. Hosted on Vercel. 
* **Offline Resilience:** Vite PWA Service Worker caches HTML, JSON, and highly compressed indoor images on first load to survive campus network dead zones.
* **Failure Mitigations:**
  * **Lying GPS:** Concrete buildings cause multipath errors. `useGeolocation.js` MUST drop any position update where `position.coords.accuracy > 50` meters.
  * **Network Drop:** Map tiles may go grey offline, but relative routing and graph metrics must continue functioning.

---

## 🗄️ PART 2: THE COMPLETE DATABASE SCHEMAS

### A. The Venues Database (`src/data/venues.json`)
This is the complete, exhaustive list of all 9 stages + logistics, mapped to their specific coordinates, floors, rooms, and nearest walkable graph nodes.

```json
{
  "version": "1.1",
  "venues": [
    {
      "id": "S01", "type": "stage", "name": "Stage 1", "building": "Mini Auditorium", "floor": "Ground", "room": "MA",
      "latitude": 9.50956322008517, "longitude": 76.55018302223051, "nearestNode": "B_MA",
      "metadata": { "entrancePhoto": "/assets/entrances/ma-main.jpg", "indoorInstructions": "Enter main doors.", "corridorPhoto": "", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S02", "type": "stage", "name": "Stage 2", "building": "Admin Block", "floor": "2", "room": "AB20X",
      "latitude": 9.50987349428246, "longitude": 76.55077935407670, "nearestNode": "B_AB",
      "metadata": { "entrancePhoto": "/assets/entrances/ab-main.jpg", "indoorInstructions": "Take main stairs to Floor 2.", "corridorPhoto": "/assets/corridors/ab-2.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S03", "type": "stage", "name": "Stage 3", "building": "South Block", "floor": "1", "room": "SB201",
      "latitude": 9.509374473409801, "longitude": 76.55087304059582, "nearestNode": "B_SB",
      "metadata": { "entrancePhoto": "/assets/entrances/sb-main.jpg", "indoorInstructions": "Take stairs to Floor 1.", "corridorPhoto": "/assets/corridors/sb-1.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S04", "type": "stage", "name": "Stage 4", "building": "North Block", "floor": "Ground", "room": "TC1 (NB106)",
      "latitude": 9.510428518223684, "longitude": 76.55101861496703, "nearestNode": "B_NB",
      "metadata": { "entrancePhoto": "/assets/entrances/nb-main.jpg", "indoorInstructions": "Proceed down ground floor corridor.", "corridorPhoto": "/assets/corridors/nb-g.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S05", "type": "stage", "name": "Stage 5", "building": "Visvesvaraya Block", "floor": "2", "room": "VB304",
      "latitude": 9.509352681151002, "longitude": 76.55071700646165, "nearestNode": "B_VB",
      "metadata": { "entrancePhoto": "/assets/entrances/vb-main.jpg", "indoorInstructions": "Take stairs to Second Floor.", "corridorPhoto": "/assets/corridors/vb-2.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S06", "type": "stage", "name": "Stage 6", "building": "North Block", "floor": "Ground", "room": "TC1 (NB114)",
      "latitude": 9.510428518223684, "longitude": 76.55101861496703, "nearestNode": "B_NB",
      "metadata": { "entrancePhoto": "/assets/entrances/nb-main.jpg", "indoorInstructions": "Proceed down ground floor corridor.", "corridorPhoto": "/assets/corridors/nb-g.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S07", "type": "stage", "name": "Stage 7", "building": "South Block", "floor": "1", "room": "SB205",
      "latitude": 9.509374473409801, "longitude": 76.55087304059582, "nearestNode": "B_SB",
      "metadata": { "entrancePhoto": "/assets/entrances/sb-main.jpg", "indoorInstructions": "Take stairs to Floor 1.", "corridorPhoto": "/assets/corridors/sb-1.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S08", "type": "stage", "name": "Stage 8", "building": "South Block", "floor": "2", "room": "SB303",
      "latitude": 9.509374473409801, "longitude": 76.55087304059582, "nearestNode": "B_SB",
      "metadata": { "entrancePhoto": "/assets/entrances/sb-main.jpg", "indoorInstructions": "Take stairs to Floor 2.", "corridorPhoto": "/assets/corridors/sb-2.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "S09", "type": "stage", "name": "Stage 9", "building": "Ramanujan Block", "floor": "2", "room": "RB203",
      "latitude": 9.510222191281922, "longitude": 76.55040316744015, "nearestNode": "B_RB",
      "metadata": { "entrancePhoto": "/assets/entrances/rb-main.jpg", "indoorInstructions": "Take stairs to Floor 2.", "corridorPhoto": "/assets/corridors/rb-2.jpg", "coordinatorPhone": "+91XXXXXXXXXX" }
    },
    {
      "id": "L01", "type": "logistics", "name": "Registration & Check-in", "building": "Main Gate", "floor": "Ground", "room": "Registration Desk",
      "latitude": 9.510000, "longitude": 76.551000, "nearestNode": "J1",
      "metadata": { "entrancePhoto": "/assets/entrances/gate.jpg", "indoorInstructions": "Present QR code at desk.", "corridorPhoto": "", "coordinatorPhone": "+91XXXXXXXXXX" }
    }
  ]
}
B. The Routing Graph (src/data/campus-graph.json)
The building nodes are precisely mapped to the user's provided coordinates. The 'J' (Junction) nodes and edges are placeholders to be updated after the physical campus walk.

JSON
{
  "nodes": {
    "B_MA": { "lat": 9.50956322008517, "lng": 76.55018302223051, "label": "Mini Auditorium Entrance" },
    "B_AB": { "lat": 9.50987349428246, "lng": 76.55077935407670, "label": "Admin Block Entrance" },
    "B_SB": { "lat": 9.509374473409801, "lng": 76.55087304059582, "label": "South Block Entrance" },
    "B_NB": { "lat": 9.510428518223684, "lng": 76.55101861496703, "label": "North Block Entrance" },
    "B_VB": { "lat": 9.509352681151002, "lng": 76.55071700646165, "label": "Visvesvaraya Entrance" },
    "B_RB": { "lat": 9.510222191281922, "lng": 76.55040316744015, "label": "Ramanujan Entrance" },
    "J1": { "lat": 0.0000, "lng": 0.0000, "label": "Main Gate Junction (Update Tomorrow)" },
    "J2": { "lat": 0.0000, "lng": 0.0000, "label": "Central Path (Update Tomorrow)" }
  },
  "edges": {
    "J1": { "J2": 50 },
    "J2": { "J1": 50, "B_AB": 15, "B_NB": 30 },
    "B_AB": { "J2": 15 },
    "B_NB": { "J2": 30 }
  }
}
⚙️ PART 3: COMPONENT LOGIC & UX FLOWS
Module 1: Entry, State & Deep Links (App.jsx)
Name Saver (Onboarding): Check localStorage.getItem('delegateName') on mount. If null, show a full-screen input prompt. Save on submit. Pass to VenueSelector to display "Hi, [Name]" in the directory header.

Deep Links: Parse window.location.search.

?target=S02 -> Auto-select Stage 2 and start routing.

?meetLat=X&meetLng=Y -> Plot a temporary "Meeting Point" pin and route to it.

Module 2: The Routing Engine (src/utils/routing.js)
Node Snapping: Create snapToNearestNode(userLat, userLng, nodesObject). Calculates Haversine distance from the user's raw GPS to all graph nodes to find the closest starting node.

Dijkstra Algorithm: A standard algorithm that reads campus-graph.json and returns the shortest path as an array of coordinates from the snapped start node to the destination's nearestNode.

Module 3: Active Outdoor Tracking (MapView.jsx & HUD)
The Polyline: Draw the Dijkstra coordinate array using a thick Leaflet <Polyline>.

The Flashlight Effect: Extract position.coords.heading from geolocation. Apply CSS transform: rotate(Xdeg) to the user's marker to show their physical orientation.

Graph Metrics: Calculate remaining distance by summing the remaining edge weights of the Dijkstra path. Divide by 80 to show humanized estimated walking time (e.g., "~2 min walk").

Peer-to-Peer Sharing: Add a "Share Location" button triggering navigator.share() with the user's live coordinates. Keep screen awake using the WakeLock API.

Module 4: The Indoor Handoff (ArrivalBanner.jsx)
Proximity Trigger: Fire the Arrival State automatically when the snapped distance to the final node is < 20m (retain manual override).

The Vertical Visual Strip: Replace the map with a full-screen, vertically scrollable list displaying the specific venue's metadata in exact order:

entrancePhoto (Visual anchor)

indoorInstructions (Large text for stairs)

corridorPhoto (Pre-marked image of the specific door)

SOS Action: Include a red button at the bottom: "I'm lost - Call Volunteer" linked via <a href="tel:..."> to the venue's coordinatorPhone.

Module 5: Campus Info (CampusInfoModal.jsx)
SOS Utility: Add an "ℹ️ Help" button to the top navigation. This triggers a static modal displaying Guest Wi-Fi details (SSID/Password) and Emergency Contact phone numbers.