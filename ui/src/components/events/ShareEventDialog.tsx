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
      visible={visible}
      onHide={onHide}
      header="Share Event"
      style={{ width: '450px' }}
      modal
      className="share-event-dialog"
    >
      <div className="share-event-content">
        {error && (
          <Message severity="error" text={error} style={{ width: '100%', marginBottom: '1rem' }} />
        )}

        {success && (
          <Message severity="success" text={success} style={{ width: '100%', marginBottom: '1rem' }} />
        )}

        {loading ? (
          <div className="loading-container">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p>Loading connected users...</p>
          </div>
        ) : connectedUsers.length === 0 ? (
          <div className="no-users-message">
            <p>You don't have any connected users yet.</p>
            <p>Connect with other users to share events with them.</p>
          </div>
        ) : (
          <div className="users-list">
            <p className="users-list-header">Select a user to share this event with:</p>
            {connectedUsers.map((user) => (
              <div
                key={user.id}
                className="user-item"
                onClick={() => !sharingUserId && handleShareEvent(user.id)}
                style={{
                  cursor: sharingUserId ? 'not-allowed' : 'pointer',
                  opacity: sharingUserId && sharingUserId !== user.id ? 0.5 : 1,
                }}
              >
                <div className="user-info">
                  <div className="user-name">
                    {user.first_name} {user.last_name}
                  </div>
                  {user.email && (
                    <div className="user-email">{user.email}</div>
                  )}
                </div>
                {sharingUserId === user.id && (
                  <ProgressSpinner style={{ width: '20px', height: '20px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
};
