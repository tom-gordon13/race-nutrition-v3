import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './EditEventDialog.css';

interface CreateEventDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreate: () => void;
  auth0Sub: string;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  visible,
  onHide,
  onCreate,
  auth0Sub,
}) => {
  const [eventName, setEventName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (visible) {
      setEventName('');
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (!eventName.trim()) {
      setError('Event name is required');
      return;
    }

    if (totalSeconds <= 0) {
      setError('Expected duration must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: auth0Sub,
          type: eventName,
          expected_duration: totalSeconds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      onCreate();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const hoursDisplay = Math.floor(totalSeconds / 3600);
  const minutesDisplay = Math.floor((totalSeconds % 3600) / 60);
  const secondsDisplay = totalSeconds % 60;

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '600px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      className="edit-event-dialog"
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
              CREATE NEW
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              {eventName || 'Event'}
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

        {/* Event Name Section */}
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
            EVENT NAME
          </div>

          <InputText
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g., Marathon, Half Marathon"
            disabled={loading}
            style={{
              width: '100%',
              fontSize: '1.125rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: '2px solid #e5e7eb',
              borderRadius: 0,
              padding: '0.375rem 0',
              outline: 'none'
            }}
          />
        </div>

        {/* Duration Section */}
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
            EXPECTED DURATION
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Hours
              </div>
              <InputText
                type="number"
                value={hours.toString()}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.625rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Minutes
              </div>
              <InputText
                type="number"
                value={minutes.toString()}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                min="0"
                max="59"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.625rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Seconds
              </div>
              <InputText
                type="number"
                value={seconds.toString()}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                min="0"
                max="59"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.625rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            paddingTop: '0.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: 600 }}>Total:</span> {hoursDisplay}h {minutesDisplay}m {secondsDisplay}s
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0' }}>
          <Button
            label="Cancel"
            onClick={onHide}
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
            label={loading ? 'Creating...' : 'Create Event'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            onClick={handleCreate}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#1f2937',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.9375rem'
            }}
          />
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            zIndex: 10
          }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          </div>
        )}
      </div>
    </Dialog>
  );
};
