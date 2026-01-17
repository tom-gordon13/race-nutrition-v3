import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './EditEventDialog.css';
import '../shared/ModalSheet.css';
import { API_URL } from '../../config/api';

interface TriathlonAttributes {
  id: string;
  event_id: string;
  swim_duration_seconds: number;
  bike_duration_seconds: number;
  run_duration_seconds: number;
  t1_duration_seconds: number | null;
  t2_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  name: string;
  event_type: string;
  expected_duration: number;
  private: boolean;
  triathlonAttributes?: TriathlonAttributes | null;
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

  // Simple duration (when toggle is off or not triathlon)
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Triathlon-specific durations (when toggle is on)
  const [useTriathlonSegments, setUseTriathlonSegments] = useState(true);
  const [swimHours, setSwimHours] = useState(0);
  const [swimMinutes, setSwimMinutes] = useState(0);
  const [bikeHours, setBikeHours] = useState(0);
  const [bikeMinutes, setBikeMinutes] = useState(0);
  const [runHours, setRunHours] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);

  const [isPrivate, setIsPrivate] = useState(true);
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

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && existingEvent) {
      setEventName(existingEvent.name || '');
      setEventType(existingEvent.event_type || 'OTHER');
      const totalSeconds = existingEvent.expected_duration || 0;
      setHours(Math.floor(totalSeconds / 3600));
      setMinutes(Math.floor((totalSeconds % 3600) / 60));
      setIsPrivate(existingEvent.private ?? true);

      // Load existing triathlon attributes if they exist
      if (existingEvent.event_type === 'TRIATHLON' && existingEvent.triathlonAttributes) {
        setUseTriathlonSegments(true);
        setSwimHours(Math.floor(existingEvent.triathlonAttributes.swim_duration_seconds / 3600));
        setSwimMinutes(Math.floor((existingEvent.triathlonAttributes.swim_duration_seconds % 3600) / 60));
        setBikeHours(Math.floor(existingEvent.triathlonAttributes.bike_duration_seconds / 3600));
        setBikeMinutes(Math.floor((existingEvent.triathlonAttributes.bike_duration_seconds % 3600) / 60));
        setRunHours(Math.floor(existingEvent.triathlonAttributes.run_duration_seconds / 3600));
        setRunMinutes(Math.floor((existingEvent.triathlonAttributes.run_duration_seconds % 3600) / 60));
      } else {
        setUseTriathlonSegments(false);
      }
    }
  }, [mode, existingEvent]);

  // Reset form when dialog opens in create mode
  useEffect(() => {
    if (visible && mode === 'create') {
      setEventName('');
      setEventType('OTHER');
      setHours(0);
      setMinutes(0);
      setSwimHours(0);
      setSwimMinutes(0);
      setBikeHours(0);
      setBikeMinutes(0);
      setRunHours(0);
      setRunMinutes(0);
      setUseTriathlonSegments(true);
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
    setEventName('');
    setEventType('OTHER');
    setHours(0);
    setMinutes(0);
    setSwimHours(0);
    setSwimMinutes(0);
    setBikeHours(0);
    setBikeMinutes(0);
    setRunHours(0);
    setRunMinutes(0);
    setUseTriathlonSegments(true);
    setIsPrivate(true);
    setError(null);
    onHide();
  };

  const handleCreate = async () => {
    let totalSeconds: number;

    if (eventType === 'TRIATHLON' && useTriathlonSegments) {
      totalSeconds =
        (swimHours * 3600 + swimMinutes * 60) +
        (bikeHours * 3600 + bikeMinutes * 60) +
        (runHours * 3600 + runMinutes * 60);
    } else {
      totalSeconds = hours * 3600 + minutes * 60;
    }

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

      const result = await response.json();
      const eventId = mode === 'edit' ? existingEvent?.id : result.event?.id;

      // If triathlon with segments enabled, save triathlon attributes
      if (eventType === 'TRIATHLON' && useTriathlonSegments && eventId) {
        const triathlonPayload = {
          event_id: eventId,
          swim_duration_seconds: swimHours * 3600 + swimMinutes * 60,
          bike_duration_seconds: bikeHours * 3600 + bikeMinutes * 60,
          run_duration_seconds: runHours * 3600 + runMinutes * 60,
          t1_duration_seconds: null,
          t2_duration_seconds: null,
        };

        const triathlonResponse = await fetch(`${API_URL}/api/triathlon-attributes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(triathlonPayload),
        });

        if (!triathlonResponse.ok) {
          const errorData = await triathlonResponse.json();
          console.error('Failed to save triathlon attributes:', errorData);
        }
      }

      onCreate();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = () => {
    if (eventType === 'TRIATHLON' && useTriathlonSegments) {
      const totalMinutes =
        (swimHours * 60 + swimMinutes) +
        (bikeHours * 60 + bikeMinutes) +
        (runHours * 60 + runMinutes);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return { hours: h, minutes: m };
    } else {
      return { hours, minutes };
    }
  };

  const totalDuration = calculateTotalDuration();

  if (!shouldRender) return null;

  const isTriathlon = eventType === 'TRIATHLON';

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
            <h2 className="modal-header-title">Plan</h2>
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
                placeholder="e.g., Ironman Lake Placid"
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
                    fontWeight: 500,
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
                    textAlign: 'left',
                    color: '#a855f7'
                  }}
                >
                  <span style={{ textAlign: 'left' }}>{eventTypeOptions.find(o => o.value === eventType)?.label || 'Other'}</span>
                  <span style={{ fontSize: '0.875rem', color: '#a855f7' }}>▼</span>
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
              {/* Header with Toggle (only show for triathlon) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Expected Duration</label>
                {isTriathlon && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>By discipline</span>
                    <InputSwitch
                      checked={useTriathlonSegments}
                      onChange={(e) => setUseTriathlonSegments(e.value)}
                      disabled={loading}
                      style={{ transform: 'scale(0.8)' }}
                    />
                  </div>
                )}
              </div>

              {/* Triathlon Segments (only show when triathlon and toggle is ON) */}
              {isTriathlon && useTriathlonSegments ? (
                <div style={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(168, 85, 247, 0.02)'
                }}>
                  {/* Swim */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(14, 165, 233, 0.08)'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                        <path d="M2 12h1c1.5 0 3-1 3-1s1.5 1 3 1 3-1 3-1 1.5 1 3 1 3-1 3-1 1.5 1 3 1h1"/>
                        <path d="M2 18h1c1.5 0 3-1 3-1s1.5 1 3 1 3-1 3-1 1.5 1 3 1 3-1 3-1 1.5 1 3 1h1"/>
                        <circle cx="12" cy="7" r="3"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', width: '48px' }}>Swim</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={swimHours}
                        onChange={(e) => setSwimHours(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>h</span>
                      <input
                        type="number"
                        value={swimMinutes}
                        onChange={(e) => setSwimMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        min="0"
                        max="59"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>m</span>
                    </div>
                  </div>

                  {/* Bike */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(34, 197, 94, 0.08)'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <circle cx="5" cy="17" r="3"/>
                        <circle cx="19" cy="17" r="3"/>
                        <path d="M12 17V5l4 6h5"/>
                        <path d="m8 17 4-8"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', width: '48px' }}>Bike</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={bikeHours}
                        onChange={(e) => setBikeHours(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>h</span>
                      <input
                        type="number"
                        value={bikeMinutes}
                        onChange={(e) => setBikeMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        min="0"
                        max="59"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>m</span>
                    </div>
                  </div>

                  {/* Run */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(249, 115, 22, 0.08)'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                        <circle cx="17" cy="5" r="2"/>
                        <path d="M9 20H4l4-8 3 3 4-6 4 1"/>
                        <path d="m14 17-2-2"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', width: '48px' }}>Run</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={runHours}
                        onChange={(e) => setRunHours(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>h</span>
                      <input
                        type="number"
                        value={runMinutes}
                        onChange={(e) => setRunMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        min="0"
                        max="59"
                        disabled={loading}
                        style={{
                          width: '48px',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>m</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Simple Duration Input */
                <div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '0.375rem',
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
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '0.375rem',
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
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {isTriathlon && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      textAlign: 'center',
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                      </svg>
                      Turn on "By discipline" to set swim, bike, and run times separately
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Total Duration Display */}
            <div className="form-section">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '12px',
                backgroundColor: isTriathlon && useTriathlonSegments ? 'rgba(99, 102, 241, 0.05)' : '#f9fafb',
                padding: '0.75rem 1rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Total Duration</span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: isTriathlon && useTriathlonSegments ? '#6366f1' : '#111827'
                }}>
                  {totalDuration.hours}h {totalDuration.minutes}m
                </span>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="form-section">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '0.125rem'
                  }}>
                    {isPrivate ? 'Private' : 'Public'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    {isPrivate ? 'Only you can see this plan' : 'Anyone with the link can view'}
                  </div>
                </div>
                <InputSwitch
                  checked={!isPrivate}
                  onChange={(e) => setIsPrivate(!e.value)}
                  disabled={loading}
                  style={{ flexShrink: 0 }}
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
