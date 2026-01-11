import React, { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './ShareEventDialog.css';
import '../shared/ModalSheet.css';
import { API_URL } from '../../config/api';



interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface Event {
  id: string;
  private: boolean;
}

interface ShareEventDialogProps {
  visible: boolean;
  eventId: string | null;
  userId: string | null; // This is auth0_sub
  onHide: () => void;
  onShare: () => void;
}

export const ShareEventDialog: React.FC<ShareEventDialogProps> = ({
  visible,
  eventId,
  userId,
  onHide,
  onShare,
}) => {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Database user ID
  const [loading, setLoading] = useState(false);
  const [sharingUserId, setSharingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [privateEventAlert, setPrivateEventAlert] = useState<boolean>(false);
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

  // Fetch connected users and event details when dialog opens
  useEffect(() => {
    if (visible && userId && eventId) {
      fetchConnectedUsers();
      fetchEventDetails();
    } else {
      // Reset state when dialog closes
      setConnectedUsers([]);
      setError(null);
      setSuccess(null);
      setEvent(null);
      setPrivateEventAlert(false);
    }
  }, [visible, userId, eventId]);

  const fetchConnectedUsers = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events/connections/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch connected users');
      }

      const data = await response.json();
      console.log('ShareEventDialog - Fetched connections:', {
        currentUserId: data.currentUserId,
        connectedUsersCount: data.users?.length,
        currentUserId_type: typeof data.currentUserId
      });
      setConnectedUsers(data.users);
      setCurrentUserId(data.currentUserId); // Save the database user ID
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connected users');
      console.error('Error fetching connected users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!eventId) return;

    const eventUrl = `${window.location.origin}/plans/${eventId}`;

    try {
      await navigator.clipboard.writeText(eventUrl);
      setSuccess('Link copied to clipboard!');

      // Check if event is private and show warning
      if (event?.private) {
        setPrivateEventAlert(true);
        // Hide the alert after 5 seconds
        setTimeout(() => {
          setPrivateEventAlert(false);
        }, 5000);
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to copy link to clipboard');
      console.error('Error copying to clipboard:', err);
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleShareEvent = async (receiverId: string) => {
    if (!eventId || !currentUserId) return;

    console.log('ShareEventDialog - Sharing event:', {
      event_id: eventId,
      sender_id: currentUserId,
      receiver_id: receiverId,
      sender_id_type: typeof currentUserId
    });

    setSharingUserId(receiverId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          sender_id: currentUserId, // Use the database user ID
          receiver_id: receiverId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share event');
      }

      const receiver = connectedUsers.find(u => u.id === receiverId);
      setSuccess(`Event shared successfully with ${receiver?.first_name} ${receiver?.last_name}!`);

      // Call onShare callback
      onShare();

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share plan');
      console.error('Error sharing event:', err);
    } finally {
      setSharingUserId(null);
    }
  };

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
            <p className="modal-header-label">SHARING</p>
            <h2 className="modal-header-title">Share Event</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Error Message */}
          {error && (
            <div style={{ padding: '0 1.25rem' }}>
              <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{ padding: '0 1.25rem' }}>
              <Message severity="success" text={success} style={{ width: '100%', marginBottom: '0.5rem' }} />
            </div>
          )}

          {/* Private Plan Alert */}
          {privateEventAlert && (
            <div style={{ padding: '0 1.25rem' }}>
              <Message
                severity="warn"
                text="This plan is private. Other users will not be able to see it unless you mark it as public."
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
            </div>
          )}

          {/* Copy Link Section */}
          <div className="form-section">
            <button
              onClick={handleCopyLink}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '1.0625rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5558e3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Link
            </button>
          </div>

          {/* User List Section */}
          <div className="form-section">
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem'
              }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '1rem' }}>Loading connected users...</p>
              </div>
            ) : connectedUsers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <p style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>You don't have any connected users yet.</p>
                <p style={{ fontSize: '1rem' }}>Connect with other users to share events with them.</p>
              </div>
            ) : (
              <>
                <label className="form-label">Select A User</label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {connectedUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => !sharingUserId && handleShareEvent(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.75rem',
                        cursor: sharingUserId ? 'not-allowed' : 'pointer',
                        opacity: sharingUserId && sharingUserId !== user.id ? 0.5 : 1,
                        transition: 'background-color 0.2s',
                        border: '1px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => {
                        if (!sharingUserId) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '1.0625rem',
                          color: '#000',
                          marginBottom: '0.25rem'
                        }}>
                          {user.first_name} {user.last_name}
                        </div>
                        {user.email && (
                          <div style={{
                            fontSize: '0.9375rem',
                            color: '#6b7280'
                          }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                      {sharingUserId === user.id && (
                        <ProgressSpinner style={{ width: '24px', height: '24px' }} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
