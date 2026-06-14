import { CheckCircle2, Building2, Layers, DoorOpen, RotateCcw } from 'lucide-react';
import { formatFloor } from '../utils/distance';

export default function ArrivalBanner({ venue, onDismiss }) {
  return (
    <div className="arrival-overlay">
      <div className="arrival-card">
        <div className="arrival-icon-ring">
          <CheckCircle2 size={44} className="arrival-check" />
        </div>
        <h2 className="arrival-title">You've Arrived!</h2>
        <p className="arrival-venue-name">{venue.name}</p>

        <div className="arrival-details">
          <div className="arrival-detail-row">
            <Building2 size={16} />
            <span>{venue.building}</span>
          </div>
          <div className="arrival-detail-row">
            <Layers size={16} />
            <span>{formatFloor(venue.floor)}</span>
          </div>
          <div className="arrival-detail-row">
            <DoorOpen size={16} />
            <span>Room {venue.room}</span>
          </div>
        </div>

        <button className="btn-navigate-another" onClick={onDismiss}>
          <RotateCcw size={15} />
          Navigate to Another Venue
        </button>
      </div>
    </div>
  );
}
