import { useState, useMemo } from 'react';
import { MapPin, Building2, ChevronRight, Search, X, Pencil } from 'lucide-react';

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

export default function VenueSelector({ venues, selectedVenue, onSelect, delegateTitle, delegateName, onEditProfile }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
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
          placeholder="Search stage, building, room…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search venues"
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
        {filtered.length === 0 && (
          <div className="venue-empty">
            <p>No venues match "<strong>{query}</strong>"</p>
          </div>
        )}
        {filtered.map((venue) => {
          const style = getBuildingStyle(venue.buildingCode);
          const isSelected = selectedVenue?.id === venue.id;
          // Avoid repeating building name as room display if they match
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
      </div>
    </div>
  );
}
