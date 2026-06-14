import { useEffect, useCallback } from 'react';
import { X, Wifi, Phone, AlertTriangle } from 'lucide-react';

export default function CampusInfoModal({ onClose }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="campus-info-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Campus information and help"
    >
      <div className="campus-info-card">
        <div className="campus-info-header">
          <h2 className="campus-info-title">ℹ️ Campus Help</h2>
          <button
            className="campus-info-close"
            onClick={onClose}
            aria-label="Close help"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wi-Fi Details */}
        <div className="campus-info-section">
          <div className="campus-info-section-header">
            <Wifi size={18} />
            <span>Guest Wi-Fi</span>
          </div>
          <div className="campus-info-detail">
            <span className="campus-info-label">Network</span>
            <span className="campus-info-value">Conference_Guest</span>
          </div>
          <div className="campus-info-detail">
            <span className="campus-info-label">Password</span>
            <span className="campus-info-value campus-info-mono">conf2026!</span>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="campus-info-section">
          <div className="campus-info-section-header">
            <Phone size={18} />
            <span>Emergency Contacts</span>
          </div>
          <a href="tel:+919876543210" className="campus-info-contact">
            <div>
              <div className="campus-info-contact-name">Event Control Room</div>
              <div className="campus-info-contact-number">+91 98765 43210</div>
            </div>
            <Phone size={16} />
          </a>
          <a href="tel:+919876543211" className="campus-info-contact">
            <div>
              <div className="campus-info-contact-name">Medical Emergency</div>
              <div className="campus-info-contact-number">+91 98765 43211</div>
            </div>
            <Phone size={16} />
          </a>
          <a href="tel:+919876543212" className="campus-info-contact">
            <div>
              <div className="campus-info-contact-name">Campus Security</div>
              <div className="campus-info-contact-number">+91 98765 43212</div>
            </div>
            <Phone size={16} />
          </a>
        </div>

        {/* SOS tip */}
        <div className="campus-info-sos-tip">
          <AlertTriangle size={16} />
          <span>If you're lost, tap a venue → "I've Arrived" → call a volunteer from the indoor guide.</span>
        </div>
      </div>
    </div>
  );
}
