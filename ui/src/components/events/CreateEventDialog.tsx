import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './EditEventDialog.css';
import '../shared/ModalSheet.css';
import { API_URL } from '../../config/api';

interface Event {
  id: string;
  name: string;
  event_type: string;
  expected_duration: number;
  private: boolean;
}

interface CreateEventDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreate: () => void;
  auth0Sub?: string;
  mode?: 'create' | 'edit';
  existingEvent?: Event | null;
}

const eventTypeOptions = [
  { label: 'Triathlon', value: 'TRIATHLON' },
  { label: 'Run', value: 'RUN' },
  { label: 'Bike', value: 'BIKE' },
  { label: 'Other', value: 'OTHER' }
];

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  visible,
  onHide,
  onCreate,
  auth0Sub,
  mode = 'create',
  existingEvent = null,
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (visible) {
      // Start rendering immediately
      setShouldRender(true);
      // Small delay to ensure the browser calculates the initial state
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Start slide-out animation
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // Match the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && existingEvent) {
      setEventName(existingEvent.name || '');
      setEventType(existingEvent.event_type || 'OTHER');
      const totalSeconds = existingEvent.expected_duration || 0;
      setHours(Math.floor(totalSeconds / 3600));
      setMinutes(Math.floor((totalSeconds % 3600) / 60));
      setSeconds(totalSeconds % 60);
      setIsPrivate(existingEvent.private ?? true);
    }
  }, [mode, existingEvent]);

  // Reset form when dialog opens in create mode
  useEffect(() => {
    if (visible && mode === 'create') {
      setEventName('');
      setEventType('OTHER');
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setIsPrivate(true);
      setError(null);
    }
  }, [visible, mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setEventName('');
    setEventType('OTHER');
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setIsPrivate(true);
    setError(null);
    onHide();
  };

  const handleCreate = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (!eventName.trim()) {
      setError('Plan name is required');
      return;
    }

    if (totalSeconds <= 0) {
      setError('Expected duration must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = mode === 'edit' && existingEvent
        ? `${API_URL}/api/events/${existingEvent.id}`
        : `${API_URL}/api/events`;

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const payload: any = {
        name: eventName,
        event_type: eventType,
        expected_duration: totalSeconds,
        private: isPrivate,
      };

      // Only include auth0_sub for create mode
      if (mode === 'create') {
        payload.auth0_sub = auth0Sub;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${mode} plan`);
      }

      onCreate();
      handleClose();
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
            <p className="modal-header-label">{mode === 'edit' ? 'EDIT' : 'CREATE NEW'}</p>
            <h2 className="modal-header-title">{eventName || 'Plan'}</h2>
          </div>
          <button
            onClick={handleClose}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="modal-content">
            {/* Error Message */}
            {error && (
              <div style={{ padding: '0 1.25rem' }}>
                <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
              </div>
            )}

            {/* Plan Name Section */}
            <div className="form-section">
              <label className="form-label">Plan Name</label>
              <input
                type="text"
                className="input-field"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Marathon, Half Marathon"
                disabled={loading}
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 400,
                  border: 'none',
                  borderBottom: '2px solid #e5e7eb',
                  borderRadius: 0,
                  padding: '0.875rem 0',
                  textAlign: 'left'
                }}
              />
            </div>

            {/* Event Type Section */}
            <div className="form-section">
              <label className="form-label">Event Type</label>

              <div style={{ position: 'relative' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!loading) setShowEventTypeDropdown(!showEventTypeDropdown);
                  }}
                  style={{
                    width: '100%',
                    fontSize: '1.0625rem',
                    fontWeight: 400,
                    border: 'none',
                    borderBottom: '2px solid #e5e7eb',
                    borderRadius: 0,
                    padding: '0.875rem 0',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ textAlign: 'left' }}>{eventTypeOptions.find(o => o.value === eventType)?.label || 'Other'}</span>
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
                          padding: '0.875rem 1rem',
                          cursor: 'pointer',
                          fontSize: '1.0625rem',
                          fontWeight: eventType === option.value ? 600 : 400,
                          backgroundColor: eventType === option.value ? '#f3f4f6' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textAlign: 'left'
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
                        {eventType === option.value && <span style={{ color: '#6366f1', fontSize: '1.125rem' }}>✓</span>}
                        <span style={{ textAlign: 'left' }}>{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Section */}
            <div className="form-section">
              <label className="form-label">Expected Duration</label>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    textAlign: 'left'
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
                      padding: '0.75rem',
                      fontSize: '1.0625rem',
                      textAlign: 'left'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    textAlign: 'left'
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
                      padding: '0.75rem',
                      fontSize: '1.0625rem',
                      textAlign: 'left'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    textAlign: 'left'
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
                      padding: '0.75rem',
                      fontSize: '1.0625rem',
                      textAlign: 'left'
                    }}
                  />
                </div>
              </div>

              <div style={{
                fontSize: '1rem',
                color: '#6b7280',
                paddingTop: '0.75rem',
                marginTop: '0.75rem',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <span style={{ fontWeight: 600 }}>Total:</span> {hoursDisplay}h {minutesDisplay}m {secondsDisplay}s
              </div>
            </div>

            {/* Privacy Section */}
            <div className="form-section">
              <label className="form-label">Privacy</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: '1.0625rem',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '0.25rem'
                  }}>
                    {isPrivate ? 'Private' : 'Public'}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {isPrivate ? 'Only you can see this plan' : 'Anyone with the link can view'}
                  </div>
                </div>
                <InputSwitch
                  checked={!isPrivate}
                  onChange={(e) => setIsPrivate(!e.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <svg className="pi pi-spin pi-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                  </svg>
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {mode === 'edit' ? 'Save Changes' : 'Create Plan'}
                </>
              )}
            </button>
          </div>
        </form>

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
            borderRadius: '24px 24px 0 0',
            zIndex: 10
          }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          </div>
        )}
      </div>
    </div>
  );
};
