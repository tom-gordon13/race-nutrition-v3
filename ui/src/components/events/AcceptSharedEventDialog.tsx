import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './AcceptSharedEventDialog.css';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        throw new Error(data.error || 'Failed to accept shared event');
      }

      onAccept();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept event');
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
        throw new Error(data.error || 'Failed to deny shared event');
      }

      onDeny();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny event');
      console.error('Error denying shared event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!sharedEvent) return null;

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '550px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      className="accept-shared-event-dialog"
      pt={{
        root: { style: { borderRadius: '20px', overflow: 'hidden' } },
        header: { style: { display: 'none' } },
        content: { style: { padding: 0, borderRadius: '20px', overflow: 'hidden' } }
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e5e7eb',
        padding: '1rem',
        gap: '0.5rem',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#9ca3af',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem'
            }}>
              SHARED EVENT
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              {sharedEvent.event.name}
            </div>
          </div>
          <button
            onClick={onHide}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
        )}

        {loading ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Processing...</p>
          </div>
        ) : (
          <>
            {/* Event Details Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.1em'
              }}>
                EVENT DETAILS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontWeight: 500, color: '#6b7280' }}>Duration:</span>
                  <span style={{ fontWeight: 600, color: '#000' }}>
                    {formatDuration(sharedEvent.event.expected_duration)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontWeight: 500, color: '#6b7280' }}>Shared by:</span>
                  <span style={{ fontWeight: 600, color: '#000' }}>
                    {sharedEvent.sender.first_name} {sharedEvent.sender.last_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '0.875rem',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <i className="pi pi-info-circle" style={{
                color: '#3b82f6',
                fontSize: '1.25rem',
                flexShrink: 0,
                marginTop: '0.125rem'
              }}></i>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Accepting this event will:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>Create a copy of the event in your events list</li>
                  <li>Copy all food items and nutrition information</li>
                  <li>Copy all nutrition goals (hourly and total)</li>
                </ul>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0' }}>
              <Button
                label="Deny"
                icon="pi pi-times"
                onClick={handleDeny}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#d1d5db',
                  border: 'none',
                  color: '#6b7280',
                  fontWeight: 600,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              />
              <Button
                label="Accept Event"
                icon="pi pi-check"
                onClick={handleAccept}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#22c55e',
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
