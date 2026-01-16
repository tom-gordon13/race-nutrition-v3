import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { API_URL } from './config/api';
import './Users.css';
import LoadingSpinner from './LoadingSpinner';

type TabType = 'connections' | 'community';

interface ConnectionInfo {
  connectionId: string;
  status: 'PENDING' | 'DENIED' | 'ACCEPTED';
  type: 'INITIATED' | 'RECEIVED';
  created_at?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  connection: ConnectionInfo | null;
  sharedPlansCount?: number;
  lastActive?: string;
}

interface UsersProps {
  onPendingCountChange?: (count: number) => void;
}

const Users = ({ onPendingCountChange }: UsersProps) => {
  const { user } = useAuth0();
  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch current user's UUID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(`${API_URL}/api/users?auth0_sub=${encodeURIComponent(user.sub)}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        } else {
          console.error('Failed to fetch current user:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`${API_URL}/api/users/all?current_user_id=${encodeURIComponent(currentUserId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId, fetchUsers]);

  // Handle sending a connection request
  const handleConnect = async (receivingUserId: string) => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`${API_URL}/api/user-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiating_user: currentUserId,
          receiving_user: receivingUserId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError('Failed to load - please try again in a few minutes');
    }
  };

  // Handle resending invitation
  const handleResendInvitation = async (connectionId: string) => {
    // TODO: Implement resend invitation API call
    console.log('Resending invitation for connection:', connectionId);
  };

  // Handle accepting connection request
  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/user-connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept connection request');
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error accepting connection request:', err);
      setError('Failed to accept request - please try again');
    }
  };

  // Handle declining connection request
  const handleDeclineRequest = async (connectionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/user-connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DENIED'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline connection request');
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error declining connection request:', err);
      setError('Failed to decline request - please try again');
    }
  };

  // Format last active time
  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Active now';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    if (diffInDays === 1) return 'Active 1d ago';
    if (diffInDays < 7) return `Active ${diffInDays}d ago`;
    return `Active ${Math.floor(diffInDays / 7)}w ago`;
  };

  // Format invited date
  const formatInvitedDate = (dateString?: string) => {
    if (!dateString) return 'Invited recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Invited today';
    if (diffInDays === 1) return 'Invited 1d ago';
    if (diffInDays < 7) return `Invited ${diffInDays}d ago`;
    return `Invited ${Math.floor(diffInDays / 7)}w ago`;
  };

  // Format requested date for incoming requests
  const formatRequestedDate = (dateString?: string) => {
    if (!dateString) return 'Requested recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return 'Requested just now';
    if (diffInHours < 24) return `Requested ${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Requested yesterday';
    if (diffInDays < 7) return `Requested ${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    return `Requested ${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) !== 1 ? 's' : ''} ago`;
  };

  // Get pending incoming requests (RECEIVED + PENDING status)
  const getPendingIncomingRequests = () => {
    return users.filter(u =>
      u.connection &&
      u.connection.status === 'PENDING' &&
      u.connection.type === 'RECEIVED'
    );
  };

  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by tab
    if (activeTab === 'connections') {
      // Show only connected users and pending outgoing invitations (but not incoming)
      filtered = filtered.filter(u =>
        u.connection && (
          u.connection.status === 'ACCEPTED' ||
          (u.connection.status === 'PENDING' && u.connection.type === 'INITIATED')
        )
      );
    }
    // For community tab, show all users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const pendingIncomingRequests = getPendingIncomingRequests();
  const filteredUsers = getFilteredUsers();
  const userCount = filteredUsers.length;

  // Notify parent component of pending count changes
  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingIncomingRequests.length);
    }
  }, [pendingIncomingRequests.length, onPendingCountChange]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view users.</div>;
  }

  return (
    <div className="users-page">
      {/* Helper Text */}
      <div className="users-helper-text">
        <div className="helper-icon">
          <i className="pi pi-users"></i>
        </div>
        <div className="helper-message">
          <strong>Connections</strong> let you share plans and collaborate with other athletes.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="users-tabs-wrapper">
        <div className="users-tabs">
          <button
            onClick={() => setActiveTab('connections')}
            className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          >
            Community
          </button>
          <div className={`tab-indicator tab-indicator-${activeTab}`} />
        </div>
      </div>

      {/* Search and Actions Section */}
      <div className="users-search-section">
        <div className="search-input-wrapper">
          <i className="pi pi-search search-icon"></i>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="search-input"
          />
        </div>
        {/* <button className="filter-button">
          <i className="pi pi-filter"></i>
        </button> */}
        {/* <button className="add-user-button">
          <i className="pi pi-user-plus"></i>
        </button> */}
      </div>

      {/* Pending Incoming Requests Section */}
      {activeTab === 'connections' && pendingIncomingRequests.length > 0 && (
        <div className="pending-requests-section">
          {/* Section Header */}
          <div className="pending-requests-header">
            <div className="pending-requests-header-left">
              <div className="pending-count-badge">
                {pendingIncomingRequests.length}
              </div>
              <span className="pending-requests-title">Pending Requests</span>
            </div>
            <span className="pending-requests-subtitle">Wants to connect</span>
          </div>

          {/* Pending Requests List */}
          <div className="pending-requests-list">
            {pendingIncomingRequests.map((userItem, index) => (
              <div key={userItem.id}>
                <div className="pending-request-card">
                  {/* Avatar */}
                  <div className="pending-request-avatar">
                    <i className="pi pi-user"></i>
                    <div className="pending-request-indicator">
                      <i className="pi pi-plus"></i>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="pending-request-info">
                    <h3 className="pending-request-name">{userItem.first_name} {userItem.last_name}</h3>
                    <p className="pending-request-time">{formatRequestedDate(userItem.connection?.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="pending-request-actions">
                    <button
                      className="pending-decline-btn"
                      onClick={() => handleDeclineRequest(userItem.connection!.connectionId)}
                      title="Decline"
                    >
                      <i className="pi pi-times"></i>
                    </button>
                    <button
                      className="pending-accept-btn"
                      onClick={() => handleAcceptRequest(userItem.connection!.connectionId)}
                    >
                      <i className="pi pi-check"></i>
                      Accept
                    </button>
                  </div>
                </div>
                {index < pendingIncomingRequests.length - 1 && <div className="pending-request-divider" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider after pending requests */}
      {activeTab === 'connections' && pendingIncomingRequests.length > 0 && (
        <div className="pending-requests-divider-section" />
      )}

      {/* User Count */}
      <div className="users-count">
        {userCount} {activeTab === 'connections' ? 'connection' : 'user'}{userCount !== 1 ? 's' : ''}
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', backgroundColor: '#ffffff' }}>
          {activeTab === 'connections' ? 'No connections found.' : 'No users found.'}
        </p>
      ) : (
        <div className="users-list">
          {filteredUsers.map((userItem) => {
            const connection = userItem.connection;
            const isConnected = connection && connection.status === 'ACCEPTED';
            const isPending = connection && connection.status === 'PENDING';
            const plansCount = userItem.sharedPlansCount || 0;

            return (
              <div key={userItem.id} className="user-card">
                {/* Profile picture placeholder */}
                <div className="user-avatar">
                  <i className="pi pi-user"></i>
                  {isConnected && <div className="connected-badge"><i className="pi pi-check"></i></div>}
                  {isPending && connection.type === 'INITIATED' && <div className="pending-badge"><i className="pi pi-clock"></i></div>}
                </div>

                {/* User info */}
                <div className="user-info">
                  <h3 className="user-name">{userItem.first_name} {userItem.last_name}</h3>

                  {activeTab === 'connections' && isConnected && (
                    <div className="user-meta">
                      <span className="connection-status-badge connected">Connected</span>
                      <span className="active-status">{formatLastActive(userItem.lastActive)}</span>
                    </div>
                  )}

                  {activeTab === 'connections' && isPending && connection.type === 'INITIATED' && (
                    <div className="user-meta">
                      <span className="connection-status-badge pending">Pending</span>
                      <span className="invited-date">{formatInvitedDate(connection.created_at)}</span>
                    </div>
                  )}

                  {activeTab === 'community' && (
                    <span className="shared-plans-count">{plansCount} shared plan{plansCount !== 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Right section */}
                <div className="user-right-section">
                  {activeTab === 'connections' && isConnected && (
                    <div className="plans-count-section">
                      <div className="plans-number">{plansCount}</div>
                      <div className="plans-label">Plans</div>
                    </div>
                  )}

                  {activeTab === 'connections' && isPending && connection.type === 'INITIATED' && (
                    <Button
                      label="Resend"
                      className="resend-button"
                      onClick={() => handleResendInvitation(connection.connectionId)}
                    />
                  )}

                  {activeTab === 'community' && isConnected && (
                    <span className="connection-status-badge connected">Connected</span>
                  )}

                  {activeTab === 'community' && !connection && (
                    <Button
                      label="Connect"
                      className="connect-button"
                      onClick={() => handleConnect(userItem.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Users;
