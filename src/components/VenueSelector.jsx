import { useState, useMemo } from 'react';
import { MapPin, Building2, ChevronRight, Search, X, Pencil, Droplets, UtensilsCrossed, Bath } from 'lucide-react';

// Building colour tags — visually distinguish same-building venues
const BUILDING_COLORS = {
  MA: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  AB: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  SB: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  NB: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  VB: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  RB: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  MG: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  MT: { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' },
};

function getBuildingStyle(code) {
  return BUILDING_COLORS[code] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
}

// ── Amenity type config ────────────────────────────────
const AMENITY_ICONS = {
  washroom: Bath,
  water: Droplets,
  food: UtensilsCrossed,
};
const AMENITY_LABELS = {
  washroom: 'Washroom',
  water: 'Drinking Water',
  food: 'Food & Refreshments',
};
const AMENITY_COLORS = {
  washroom: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  water:    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  food:     { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
};

export default function VenueSelector({ venues, selectedVenue, onSelect, delegateTitle, delegateName, onEditProfile, buildingFacilities, delegateGender }) {
  const [query, setQuery] = useState('');

  // ── Build amenity items from buildingFacilities ──────
  const amenityItems = useMemo(() => {
    if (!buildingFacilities) return [];
    const items = [];
    Object.entries(buildingFacilities).forEach(([code, bldg]) => {
      // Washroom — pick gender-appropriate direction from first available floor
      const floors = bldg.washrooms ? Object.keys(bldg.washrooms) : [];
      if (floors.length > 0) {
        const floorEntries = floors.map((f) => {
          const dir = delegateGender === 'female' ? bldg.washrooms[f]?.female : bldg.washrooms[f]?.male;
          return dir ? `${f === 'Ground' ? 'Ground Fl.' : `Floor ${f}`}: ${dir}` : null;
        }).filter(Boolean);
        if (floorEntries.length > 0) {
          items.push({ type: 'washroom', buildingCode: code, building: bldg.name, detail: floorEntries.join(' · ') });
        }
      }
      // Water
      if (bldg.water) {
        items.push({ type: 'water', buildingCode: code, building: bldg.name, detail: bldg.water });
      }
      // Food
      if (bldg.food) {
        items.push({ type: 'food', buildingCode: code, building: bldg.name, detail: bldg.food });
      }
    });
    return items;
  }, [buildingFacilities, delegateGender]);

  // ── Filter venues ─────────────────────────────────────
  const filteredVenues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.building.toLowerCase().includes(q) ||
        v.room.toLowerCase().includes(q) ||
        v.venueCode.toLowerCase().includes(q)
    );
  }, [query, venues]);

  // ── Filter amenities ──────────────────────────────────
  const filteredAmenities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return amenityItems;
    return amenityItems.filter(
      (a) =>
        AMENITY_LABELS[a.type].toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.building.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q)
    );
  }, [query, amenityItems]);

  return (
    <div className="venue-selector">
      <div className="venue-selector-header">
        <MapPin size={18} className="header-icon" />
        <span>
          {delegateName
            ? `Welcome, ${delegateTitle ? delegateTitle + ' ' : ''}${delegateName.split(' ')[0]}`
            : 'Select Your Destination'}
        </span>
        {delegateName && onEditProfile && (
          <button
            className="edit-profile-btn"
            onClick={onEditProfile}
            aria-label="Edit profile"
            title="Edit profile"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="venue-search-wrap">
        <Search size={15} className="venue-search-icon" />
        <input
          className="venue-search-input"
          type="search"
          placeholder="Search venues, amenities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search venues and amenities"
        />
        {query && (
          <button
            className="venue-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="venue-list">
        {filteredVenues.length === 0 && filteredAmenities.length === 0 && (
          <div className="venue-empty">
            <p>No results match "<strong>{query}</strong>"</p>
          </div>
        )}

        {/* ── VENUES SECTION ──────────────────────────── */}
        {filteredVenues.length > 0 && (
          <>
            <div className="venue-section-header">
              <MapPin size={14} />
              <span>Venues</span>
            </div>
            {filteredVenues.map((venue) => {
              const style = getBuildingStyle(venue.buildingCode);
              const isSelected = selectedVenue?.id === venue.id;
              const roomDisplay = venue.room === venue.building ? null : venue.room;

              return (
                <button
                  key={venue.id}
                  className={`venue-card ${isSelected ? 'venue-card--selected' : ''}`}
                  onClick={() => onSelect(venue)}
                  aria-pressed={isSelected}
                >
                  <div className="venue-card-left">
                    <span
                      className="venue-badge"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      {venue.venueCode}
                    </span>
                    <div className="venue-card-info">
                      <span className="venue-name">{venue.name}</span>
                      <div className="venue-meta">
                        <Building2 size={12} />
                        <span>{venue.building}</span>
                        <span className="venue-meta-sep">·</span>
                        <span>{venue.floor === 'Ground' ? 'Ground Fl.' : `Floor ${venue.floor}`}</span>
                        {roomDisplay && (
                          <>
                            <span className="venue-meta-sep">·</span>
                            <span>{roomDisplay}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`venue-chevron ${isSelected ? 'venue-chevron--active' : ''}`}
                  />
                </button>
              );
            })}
          </>
        )}

        {/* ── AMENITIES SECTION ───────────────────────── */}
        {filteredAmenities.length > 0 && (
          <>
            <div className="venue-section-header venue-section-header--amenities">
              <Building2 size={14} />
              <span>Amenities</span>
            </div>
            {filteredAmenities.map((amenity, idx) => {
              const style = AMENITY_COLORS[amenity.type];
              const Icon = AMENITY_ICONS[amenity.type];

              return (
                <div
                  key={`${amenity.type}-${amenity.buildingCode}-${idx}`}
                  className="venue-card amenity-card"
                >
                  <div className="venue-card-left">
                    <span
                      className="venue-badge amenity-badge"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <div className="venue-card-info">
                      <span className="venue-name">{AMENITY_LABELS[amenity.type]}</span>
                      <div className="venue-meta">
                        <Building2 size={12} />
                        <span>{amenity.building}</span>
                      </div>
                      <div className="amenity-detail">{amenity.detail}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

