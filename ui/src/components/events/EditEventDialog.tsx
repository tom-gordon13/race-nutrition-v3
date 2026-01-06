import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './EditEventDialog.css';
import { API_URL } from '../../config/api';

interface EditEventDialogProps {
  visible: boolean;
  event: {
    id: string;
    name: string;
    event_type: string;
    expected_duration: number;
    private: boolean;
  } | null;
  onHide: () => void;
  onSave: (updatedEvent: any) => void;
}

const eventTypeOptions = [
  { label: 'Triathlon', value: 'TRIATHLON' },
  { label: 'Run', value: 'RUN' },
  { label: 'Bike', value: 'BIKE' },
  { label: 'Other', value: 'OTHER' }
];

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  visible,
  event,
  onHide,
  onSave,
}) => {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('OTHER');
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);
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

  useEffect(() => {
    if (event) {
      setEventName(event.name);
      setEventType(event.event_type);
      const totalSeconds = event.expected_duration;
      setHours(Math.floor(totalSeconds / 3600));
      setMinutes(Math.floor((totalSeconds % 3600) / 60));
      setSeconds(totalSeconds % 60);
      setIsPrivate(event.private);
    }
  }, [event]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showEventTypeDropdown) {
        setShowEventTypeDropdown(false);
      }
    };

    if (showEventTypeDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showEventTypeDropdown]);

  const handleSave = async () => {
    if (!event) return;

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
      
      const response = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          event_type: eventType,
          expected_duration: totalSeconds,
          private: isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const data = await response.json();
      const updatedEvent = data.event;

      onSave(updatedEvent);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#9ca3af',
            letterSpacing: '0.1em'
          }}>
            EDITING
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

        {/* Event Type Section */}
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
            EVENT TYPE
          </div>

          <div style={{ position: 'relative' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!loading) setShowEventTypeDropdown(!showEventTypeDropdown);
              }}
              style={{
                width: '100%',
                fontSize: '1.125rem',
                fontWeight: 700,
                border: 'none',
                borderBottom: '2px solid #e5e7eb',
                borderRadius: 0,
                padding: '0.375rem 0',
                outline: 'none',
                backgroundColor: 'white',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{eventTypeOptions.find(o => o.value === eventType)?.label || 'Other'}</span>
              <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>▼</span>
            </div>

            {showEventTypeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginTop: '0.25rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                {eventTypeOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventType(option.value);
                      setShowEventTypeDropdown(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: eventType === option.value ? 700 : 400,
                      backgroundColor: eventType === option.value ? '#f3f4f6' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (eventType !== option.value) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (eventType !== option.value) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {eventType === option.value && <span style={{ color: '#646cff' }}>✓</span>}
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Private Toggle Section */}
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
            PRIVACY
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Private
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {isPrivate ? 'Only you can see this event' : 'Event can be shared with others'}
              </div>
            </div>
            <InputSwitch
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.value)}
              disabled={loading}
            />
          </div>
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
            label={loading ? 'Saving...' : 'Save Changes'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            onClick={handleSave}
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
