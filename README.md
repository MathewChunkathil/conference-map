# 🧭 Campus Nav — Conference Navigation App

A mobile-first, offline-resilient, GPS-guided indoor/outdoor navigation web app for conference delegates. Helps attendees navigate a multi-building campus, locate specific rooms or stages, view step-by-step indoor guides, and call building coordinators in real time.

Built with **React 19 + Vite 8 + Leaflet**. Designed as a pure static single-page application (SPA) that can be deployed anywhere with zero server/database overhead.

---

## ✨ Features (Version 1.3)

### 📍 Live Map & GPS Navigation
- **CartoDB Dark Matter Tiles:** A high-contrast, premium dark-mode interface optimized for outdoor and indoor visibility.
- **Accuracy Safeguards:** Drops low-quality GPS updates (multipath errors inside concrete buildings) where accuracy is $>50\text{ m}$.
- **Compass Heading Cone:** Uses the device compass via the **DeviceOrientation API** (with iOS `webkitCompassHeading` and Android `alpha` support) to render a Google Maps-style **directional cone** on the user's blue dot, showing which direction they're facing — even when standing still.
- **Bearing Indicator:** The navigation panel shows a directional arrow (↗, ↑, ←, etc.) pointing toward the destination so users can orient themselves.
- **Location Permission Banner:** When GPS is denied or unavailable, a prominent banner with clear instructions and a reload button guides users to enable location access.

### 🔀 Dijkstra Routing Engine
- **Graph-Based Shortest Paths:** Snap raw user GPS coordinates to the nearest campus junction/entrance node and dynamically compute the shortest path.
- **Accurate Routing Metric Display:** Shows exact total walking distance (in meters) and estimated time of arrival (assuming a standard walking pace of $80\text{ m/min}$).
- **Interactive Polyline Overlay:** Draws the calculated path directly onto the Leaflet map.

### 🚻 Dynamic Building Facilities Guidance
- **Facility Quick Chips:** Inline buttons for 🚻 Washroom, 💧 Water, and 🍽️ Food below the navigation step instructions.
- **Gender-Appropriate Routing:** Automatically routes the delegate to their gender-specific washroom (Male or Female) based on their onboarding selections.
- **Arrival Handoff Integration:** Displays exact facility floors and descriptions when the user arrives at their destination building.

### 🔑 Multi-Step Onboarding & Profile Management
- **Wizard Flow:** First-time users walk through a clean, multi-step profile builder:
  - **Step 1:** Select a professional title pill (`Dr.`, `Prof.`, `Er.`, `Mr.`, `Ms.`, `Mrs.`) and type their name.
  - **Step 2:** Choose gender (`Male` or `Female`) to calibrate gender-specific washroom navigation.
- **Edit Profile:** A profile edit pencil icon in the sidebar header allows users to change their title, name, or gender at any time.
- **Target Venue Deep Links:** Open direct links like `?target=S02` to automatically select a venue, focus the camera, and compute navigation paths.
- **Custom Meeting Point Pins:** Generate coordinates dynamically with deep links like `?meetLat=9.5101&meetLng=76.5505` to set a custom meeting point pin.

### 🏢 Indoor Handoff (Vertical Visual Strip)
- **Automatic Arrival Detection:** Detects when the user is within $20\text{ m}$ of their target building entrance.
- **Step-by-Step Indoor Guides:** Swaps the map view for a vertically scrollable onboarding/indoor visual strip detailing:
  - **Entrance Photo:** Real-world visual reference of the building entrance.
  - **Indoor Instructions:** Clear floor-by-floor walking instructions.
  - **Corridor Photo:** Specific office door highlight.
- **Emergency Hotline:** Built-in "I'm lost" button linked directly to the building coordinator's telephone number.

### ℹ️ Campus Info & SOS Support
- **Quick Help Panel:** A persistent global help modal detailing the conference guest Wi-Fi credentials (SSID and Password).
- **Emergency Direct Lines:** Fast-access emergency hotline numbers.
- **Screen Wake Lock:** Prevents device screens from going to sleep while actively navigating.
- **Web Share Integration:** Single-tap peer-to-peer location sharing containing the delegate's current coordinates.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ArrivalBanner.jsx     # Indoor handoff vertical visual strip & SOS button
│   ├── CampusInfoModal.jsx   # Guest Wi-Fi details & emergency contact hotline
│   ├── GpsErrorScreen.jsx    # GPS permission error fallback screen
│   ├── MapView.jsx           # Leaflet map with user compass dot, polyline, & pins
│   ├── NavigationPanel.jsx   # Collapsible nav bar with distance, ETA, bearing & guidance
│   └── VenueSelector.jsx     # Searchable building/room directory with badges
├── data/
│   ├── campus-graph.json     # 🗺️ Navigational graph nodes & edges
│   └── venues.json           # 🏢 Conference stages, rooms, and metadata
├── hooks/
│   └── useGeolocation.js     # High-accuracy GPS + DeviceOrientation compass heading hook
├── utils/
│   ├── distance.js           # Haversine distance, bearing, and compass formatting
│   └── routing.js            # Dijkstra shortest path & node snapping utilities
├── App.jsx                   # Root application state & deep-link routing
├── App.css                   # Layout, animations, and component styles
└── index.css                 # CSS variables, typography, and design system tokens
```

---

## 🗄️ Database Schemas

### 1. The Campus Graph (`src/data/campus-graph.json`)
Consists of physical campus nodes (building entrances and walk junctions) and the weighted path connections between them.

```json
{
  "nodes": {
    "B_MA": { "lat": 9.50956322008517, "lng": 76.55018302223051, "label": "Mini Auditorium Entrance" },
    "J1":   { "lat": 9.51000000000000, "lng": 76.55100000000000, "label": "Main Gate Junction" }
  },
  "edges": {
    "J1": { "B_MA": 70 }
  }
}
```

### 2. The Venues Directory (`src/data/venues.json`)
Defines the name, location, closest routing node, building codes (for custom color badges), and indoor handoff assets.

```json
{
  "version": "1.1",
  "eventName": "Conference Navigation System",
  "venues": [
    {
      "id": 1,
      "venueCode": "S01",
      "type": "stage",
      "name": "Stage 1",
      "building": "Mini Auditorium",
      "buildingCode": "MA",
      "floor": "Ground",
      "room": "Main Hall",
      "latitude": 9.50956322008517,
      "longitude": 76.55018302223051,
      "nearestNode": "B_MA",
      "description": "",
      "active": true,
      "metadata": {
        "entrancePhoto": "/assets/entrances/ma-main.jpg",
        "indoorInstructions": "Enter main doors.",
        "corridorPhoto": "",
        "coordinatorPhone": "+91XXXXXXXXXX"
      }
    }
  ]
}
```

### 3. Building Facilities Schema (`src/data/venues.json` - `buildingFacilities`)
Defines locations of gender-specific washrooms, water points, and food stalls for each building block.

```json
{
  "buildingFacilities": {
    "MA": {
      "name": "Mini Auditorium",
      "washrooms": {
        "Ground": { "male": "Right side of lobby", "female": "Left side of lobby" }
      },
      "water": "Drinking water station near entrance",
      "food": "Refreshments counter in foyer"
    }
  }
}
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (Node Package Manager)

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd Conference_Map
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at **http://localhost:5173**.

> [!NOTE]
> High-accuracy GPS positioning requires the app to be served over a secure connection (HTTPS) in production deployment. Localhost is permitted to use Geolocation API over HTTP.

---

## 🏗️ Build & Production Deployment

To build a optimized, static production bundle:
```bash
npm run build
```
The output files will be built into the `dist/` directory. 

### Deployment Options
- **Netlify / Vercel:** Point your build setup to `npm run build` with `dist` as the publish directory.
- **GitHub Pages:**
  1. Set the correct `base` directory in `vite.config.js`.
  2. Deploy `dist/` using the `gh-pages` npm package.
