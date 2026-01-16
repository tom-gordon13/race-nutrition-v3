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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [privateEventAlert, setPrivateEventAlert] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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
      setSelectedUserIds(new Set());
      setSearchTerm('');
      setCopySuccess(false);
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
      setConnectedUsers(data.users);
      setCurrentUserId(data.currentUserId); // Save the database user ID
    } catch (err) {
      setError('Failed to load - please try again in a few minutes');
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
      setCopySuccess(true);

      // Check if event is private and show warning
      if (event?.private) {
        setPrivateEventAlert(true);
        // Hide the alert after 5 seconds
        setTimeout(() => {
          setPrivateEventAlert(false);
        }, 5000);
      }

      // Reset copy button after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      setError('Failed to copy link');
      console.error('Error copying to clipboard:', err);
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleShareWithSelected = async () => {
    if (!eventId || !currentUserId || selectedUserIds.size === 0) return;

    setSharingInProgress(true);
    setError(null);

    try {
      // Share with all selected users
      const sharePromises = Array.from(selectedUserIds).map(receiverId =>
        fetch(`${API_URL}/api/shared-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: eventId,
            sender_id: currentUserId,
            receiver_id: receiverId,
          }),
        })
      );

      const results = await Promise.all(sharePromises);
      const allSuccessful = results.every(res => res.ok);

      if (!allSuccessful) {
        throw new Error('Some shares failed');
      }

      const count = selectedUserIds.size;
      setSuccess(`Event shared successfully with ${count} ${count === 1 ? 'person' : 'people'}!`);

      // Call onShare callback
      onShare();

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError('Failed to share - please try again');
      console.error('Error sharing event:', err);
    } finally {
      setSharingInProgress(false);
    }
  };

  const filteredUsers = connectedUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  const getShareButtonText = () => {
    if (selectedUserIds.size === 0) {
      return 'Select a Connection';
    }
    if (selectedUserIds.size === 1) {
      const selectedUser = connectedUsers.find(u => selectedUserIds.has(u.id));
      return `Share with ${selectedUser?.first_name}`;
    }
    return `Share with ${selectedUserIds.size} people`;
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-sheet-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-sheet share-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="share-modal-header">
          <div className="share-modal-header-text">
            <p className="share-modal-label">SHARING</p>
            <h2 className="share-modal-title">Share Plan</h2>
          </div>
          <button onClick={onHide} className="modal-close-button">
            ✕
          </button>
        </div>

        <div className="share-modal-content">
          {/* Error Message */}
          {error && (
            <div className="share-message-wrapper">
              <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="share-message-wrapper">
              <Message severity="success" text={success} style={{ width: '100%', marginBottom: '0.5rem' }} />
            </div>
          )}

          {/* Private Plan Alert */}
          {privateEventAlert && (
            <div className="share-message-wrapper">
              <Message
                severity="warn"
                text="This plan is private. Other users will not be able to see it unless you mark it as public."
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
            </div>
          )}

          {/* Copy Link Section */}
          <div className="share-copy-section">
            <button
              onClick={handleCopyLink}
              className={`share-copy-button ${copySuccess ? 'copied' : ''}`}
            >
              {!copySuccess ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Link</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Link Copied!</span>
                </>
              )}
            </button>
            <p className="share-copy-hint">Anyone with the link can view this plan</p>
          </div>

          {/* User List Section */}
          <div className="share-users-section">
            <label className="share-section-label">SHARE WITH CONNECTION</label>

            {loading ? (
              <div className="share-loading">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <p>Loading connected users...</p>
              </div>
            ) : connectedUsers.length === 0 ? (
              <div className="share-empty">
                <p>You don't have any connected users yet.</p>
                <p>Connect with other users to share plans with them.</p>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="share-search-wrapper">
                  <svg className="share-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="share-search-input"
                  />
                </div>

                {/* Connection Count */}
                <div className="share-count-row">
                  <span className="share-connection-count">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'connection' : 'connections'}
                  </span>
                  {selectedUserIds.size > 0 && (
                    <span className="share-selected-count">
                      {selectedUserIds.size} selected
                    </span>
                  )}
                </div>

                {/* User List */}
                {filteredUsers.length === 0 ? (
                  <div className="share-no-results">
                    <div className="share-no-results-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <p className="share-no-results-title">No connections found</p>
                    <p className="share-no-results-subtitle">Try a different search term</p>
                  </div>
                ) : (
                  <div className="share-user-list">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.has(user.id);
                      const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

                      return (
                        <div
                          key={user.id}
                          onClick={() => !sharingInProgress && toggleUserSelection(user.id)}
                          className={`share-user-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="share-user-avatar-wrapper">
                            <div className="share-user-avatar">
                              <span>{initials}</span>
                            </div>
                            <div className="share-user-connected-badge">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          </div>

                          <div className="share-user-info">
                            <h3 className="share-user-name">
                              {user.first_name} {user.last_name}
                            </h3>
                            {user.email && (
                              <p className="share-user-email">{user.email}</p>
                            )}
                          </div>

                          <div className="share-select-indicator">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {connectedUsers.length > 0 && (
          <div className="share-modal-footer">
            <button
              onClick={handleShareWithSelected}
              disabled={selectedUserIds.size === 0 || sharingInProgress}
              className={`share-submit-button ${selectedUserIds.size > 0 ? 'active' : ''}`}
            >
              {sharingInProgress ? (
                <>
                  <ProgressSpinner style={{ width: '18px', height: '18px' }} />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{getShareButtonText()}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
