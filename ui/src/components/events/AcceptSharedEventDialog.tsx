import React, { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import '../shared/ModalSheet.css';
import { API_URL } from '../../config/api';



interface SharedEvent {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    event_type: string;
    expected_duration: number;
    created_at: string;
  };
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

interface AcceptSharedEventDialogProps {
  visible: boolean;
  sharedEvent: SharedEvent | null;
  onHide: () => void;
  onAccept: () => void;
  onDeny: () => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const AcceptSharedEventDialog: React.FC<AcceptSharedEventDialogProps> = ({
  visible,
  sharedEvent,
  onHide,
  onAccept,
  onDeny,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleAccept = async () => {
    if (!sharedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept shared plan');
      }

      onAccept();
      onHide();
    } catch (err) {
      setError('Failed to load - please try again in a few minutes');
      console.error('Error accepting shared event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!sharedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DENIED'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deny shared plan');
      }

      onDeny();
      onHide();
    } catch (err) {
      setError('Failed to load - please try again in a few minutes');
      console.error('Error denying shared event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  if (!sharedEvent || !shouldRender) return null;

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
            <p className="modal-header-label">SHARED EVENT</p>
            <h2 className="modal-header-title">{sharedEvent.event.name}</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Error Message */}
          {error && (
            <Message severity="error" text={error} style={{ width: '100%' }} />
          )}

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem'
            }}>
              <ProgressSpinner style={{ width: '50px', height: '50px' }} />
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '1rem' }}>Processing...</p>
            </div>
          ) : (
            <>
              {/* Event Details Section */}
              <div className="form-section">
                <label className="form-label">EVENT DETAILS</label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #f3f4f6'
                  }}>
                    <span style={{ fontWeight: 500, color: '#6b7280', fontSize: '1rem' }}>Duration:</span>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                      {formatDuration(sharedEvent.event.expected_duration)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #f3f4f6'
                  }}>
                    <span style={{ fontWeight: 500, color: '#6b7280', fontSize: '1rem' }}>Shared by:</span>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                      {sharedEvent.sender.first_name} {sharedEvent.sender.last_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0.75rem',
                border: '1px solid #dbeafe'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div style={{ fontSize: '0.9375rem', color: '#374151' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#111827' }}>
                    Accepting this event will:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                    <li>Create a copy of the event in your events list</li>
                    <li>Copy all food items and nutrition information</li>
                    <li>Copy all nutrition goals (hourly and total)</li>
                  </ul>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleDeny}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: '#e5e7eb',
                    border: 'none',
                    color: '#374151',
                    fontWeight: 600,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.0625rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                >
                  Deny
                </button>
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: '#22c55e',
                    border: 'none',
                    color: 'white',
                    fontWeight: 600,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.0625rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#16a34a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#22c55e';
                  }}
                >
                  Accept Event
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
