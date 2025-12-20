import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './ShareEventDialog.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch connected users when dialog opens
  useEffect(() => {
    if (visible && userId) {
      fetchConnectedUsers();
    } else {
      // Reset state when dialog closes
      setConnectedUsers([]);
      setError(null);
      setSuccess(null);
    }
  }, [visible, userId]);

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
      setError(err instanceof Error ? err.message : 'Failed to share event');
      console.error('Error sharing event:', err);
    } finally {
      setSharingUserId(null);
    }
  };

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '500px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      className="share-event-dialog"
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
              SHARING
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              Share Event
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

        {/* Success Message */}
        {success && (
          <Message severity="success" text={success} style={{ width: '100%', marginBottom: '0.5rem' }} />
        )}

        {/* Content Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <ProgressSpinner style={{ width: '50px', height: '50px' }} />
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading connected users...</p>
            </div>
          ) : connectedUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>You don't have any connected users yet.</p>
              <p>Connect with other users to share events with them.</p>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.1em'
              }}>
                SELECT A USER
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {connectedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => !sharingUserId && handleShareEvent(user.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      cursor: sharingUserId ? 'not-allowed' : 'pointer',
                      opacity: sharingUserId && sharingUserId !== user.id ? 0.5 : 1,
                      transition: 'background-color 0.2s',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      if (!sharingUserId) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                  >
                    <div>
                      <div style={{
                        fontWeight: 600,
                        color: '#000',
                        marginBottom: '0.25rem'
                      }}>
                        {user.first_name} {user.last_name}
                      </div>
                      {user.email && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                    {sharingUserId === user.id && (
                      <ProgressSpinner style={{ width: '20px', height: '20px' }} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};
