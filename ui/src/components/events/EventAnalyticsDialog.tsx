import { useState, useEffect } from 'react';
import '../shared/ModalSheet.css';

interface EventAnalyticsDialogProps {
  visible: boolean;
  onHide: () => void;
}

export const EventAnalyticsDialog = ({
  visible,
  onHide
}: EventAnalyticsDialogProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-sheet-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <p className="modal-header-label">ANALYTICS</p>
            <h2 className="modal-header-title">Event Analytics</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Content Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 2rem',
            textAlign: 'center'
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#374151',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Analytics Coming Soon
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#9ca3af',
              margin: 0
            }}>
              We're working on bringing you detailed event analytics.
            </p>
          </div>

          {/* Footer Button */}
          <button
            onClick={onHide}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '1rem',
              borderRadius: '0.75rem',
              fontSize: '1.0625rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111827';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
