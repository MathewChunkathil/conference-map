# 🧭 Campus Nav — Conference Navigation App

A mobile-first, GPS-guided navigation web app for conference delegates. Helps attendees find specific rooms and stages across a multi-building campus in real time.

Built with **React + Vite + Leaflet**. Zero backend — fully static, deployable anywhere.

---

## ✨ Features

- 📍 Live GPS tracking with accuracy circle
- 🗺️ Dark-themed interactive map (CartoDB Dark Matter tiles)
- 🔍 Search/filter venue list by name, building, or room code
- 📏 Real-time distance to destination with progress bar
- ✅ Auto-arrival detection (within 10 m) + manual "I've Arrived" button
- 📱 Mobile-first bottom drawer; desktop sidebar at ≥ 768 px
- 🚫 Graceful GPS-unavailable fallback (map reference mode)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd conference-map

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at **http://localhost:5173**

> **Note:** GPS requires the page to be served over HTTPS in production (localhost works fine for dev).

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ArrivalBanner.jsx     # "You've Arrived!" overlay
│   ├── GpsErrorScreen.jsx    # GPS permission error state
│   ├── MapView.jsx           # Leaflet map with user dot & destination pin
│   ├── NavigationPanel.jsx   # Bottom panel with distance & guidance
│   └── VenueSelector.jsx     # Searchable venue list drawer
├── data/
│   └── venues.json           # ⭐ Edit this to add/update venues
├── hooks/
│   └── useGeolocation.js     # GPS watchPosition hook
├── utils/
│   └── distance.js           # Haversine formula + display formatting
├── App.jsx                   # Root layout & state
├── App.css                   # All component styles
└── index.css                 # Design tokens & global reset
```

---

## 📝 Adding / Editing Venues

All venue data lives in **`src/data/venues.json`**. Edit this file to add new stages or update coordinates.

```jsonc
{
  "eventName": "Conference Navigation System",  // Shown in header subtitle
  "venues": [
    {
      "id": 1,                        // Unique integer ID
      "venueCode": "S01",             // Short code shown on badge (e.g. S01)
      "name": "Stage 1",              // Display name in list & nav panel
      "building": "Mini Auditorium",  // Building name
      "buildingCode": "MA",           // 2-char code → determines badge color
      "floor": "Ground",              // "Ground", "1", "2", "3" …
      "room": "Main Hall",            // Room identifier
      "latitude": 9.50956322008517,   // GPS latitude  (right-click on Google Maps)
      "longitude": 76.55018302223051, // GPS longitude
      "description": "",              // Optional (not displayed yet)
      "active": true                  // false = hidden from list
    }
  ]
}
```

### Building badge colours

Add a new `buildingCode` entry in `src/components/VenueSelector.jsx` under `BUILDING_COLORS` to auto-assign a color to any new building:

```js
const BUILDING_COLORS = {
  MA: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  // Add yours:
  XY: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
};
```

---

## 🏗️ Build for Production

```bash
npm run build
# Output → dist/
```

Deploy the `dist/` folder to any static host:
- **GitHub Pages** — push `dist/` to `gh-pages` branch (or use `vite-plugin-gh-pages`)
- **Netlify / Vercel** — connect repo, set build command `npm run build`, publish dir `dist`
- **Local file server** — `npm run preview` to test the production build locally

> For GitHub Pages, set `base: '/your-repo-name/'` in `vite.config.js`

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and test locally with `npm run dev`
3. Commit: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

---

## 🛠️ Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Map | Leaflet 1.9 + react-leaflet 5 |
| Icons | lucide-react |
| Tiles | CartoDB Dark Matter (OpenStreetMap data) |
| Styles | Vanilla CSS (design tokens in `index.css`) |
