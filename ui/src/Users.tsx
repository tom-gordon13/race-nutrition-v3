import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import { API_URL } from './config/api';
import './Users.css';



interface ConnectionInfo {
  connectionId: string;
  status: 'PENDING' | 'DENIED' | 'ACCEPTED';
  type: 'INITIATED' | 'RECEIVED';
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  connection: ConnectionInfo | null;
}

const Users = () => {
  const { user } = useAuth0();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<User | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setError(err instanceof Error ? err.message : 'Failed to send connection request');
    }
  };

  // Handle viewing a received request
  const handleViewRequest = (requestUser: User) => {
    setSelectedRequest(requestUser);
    setShowRequestDialog(true);
  };

  // Handle accepting or denying a request
  const handleRespondToRequest = async (connectionId: string, status: 'ACCEPTED' | 'DENIED') => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/user-connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update connection request');
      }

      // Close dialog and refresh users list
      setShowRequestDialog(false);
      setSelectedRequest(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating connection request:', err);
      setError(err instanceof Error ? err.message : 'Failed to update connection request');
    } finally {
      setProcessing(false);
    }
  };

  // Render connection status for desktop view
  const renderConnectionStatus = (connection: ConnectionInfo | null) => {
    if (!connection) {
      return <span className="connection-status-text">—</span>;
    }

    if (connection.status === 'PENDING' && connection.type === 'INITIATED') {
      return <span className="connection-status pending">Pending</span>;
    }

    if (connection.status === 'PENDING' && connection.type === 'RECEIVED') {
      return <span className="connection-status incoming">Incoming</span>;
    }

    if (connection.status === 'ACCEPTED') {
      return <span className="connection-status connected">Connected</span>;
    }

    return <span className="connection-status-text">—</span>;
  };

  // Render connection action button
  const renderConnectionAction = (rowData: User, connection: ConnectionInfo | null) => {
    // No connection - show connect button
    if (!connection) {
      return (
        <Button
          icon="pi pi-user-plus"
          label="Connect"
          className="connect-button"
          onClick={() => handleConnect(rowData.id)}
        />
      );
    }

    // I initiated a pending request - no action
    if (connection.type === 'INITIATED' && connection.status === 'PENDING') {
      return null;
    }

    // I received a pending request - show "View Request" button
    if (connection.type === 'RECEIVED' && connection.status === 'PENDING') {
      return (
        <Button
          label="View Request"
          className="view-request-button"
          onClick={() => handleViewRequest(rowData)}
        />
      );
    }

    // Connection is accepted - no action needed
    if (connection.status === 'ACCEPTED') {
      return null;
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view users.</div>;
  }

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="users-title-section">
          <h1 className="users-title">Users</h1>
          <span className="users-count">{users.length} users</span>
        </div>
      </div>

      {/* Desktop: Table Header (hidden on mobile) */}
      {!isMobile && users.length > 0 && (
        <div className="users-table-header">
          <div className="table-header-cell name-col">NAME</div>
          <div className="table-header-cell email-col">EMAIL</div>
          <div className="table-header-cell status-col">STATUS</div>
          <div className="table-header-cell actions-col">ACTION</div>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '2rem' }}>
          No users found.
        </p>
      ) : (
        <div className="users-list">
          {users.map((userItem) => {
            const connection = userItem.connection;

            if (isMobile) {
              // Mobile: Card layout
              return (
                <div key={userItem.id} className="user-card-mobile">
                  <div className="user-card-header">
                    <div className="user-info-mobile">
                      <div
                        className="user-name"
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#000000',
                          margin: 0,
                          padding: 0,
                          display: 'block',
                          visibility: 'visible',
                          opacity: 1,
                          lineHeight: 1.4,
                          width: '100%',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      >
                        {userItem.first_name} {userItem.last_name}
                      </div>
                      <div className="user-status-mobile">
                        {renderConnectionStatus(connection)}
                      </div>
                    </div>
                    {connection && connection.status === 'ACCEPTED' && (
                      <i className="pi pi-check connection-check"></i>
                    )}
                  </div>
                  <div className="user-card-actions">
                    {renderConnectionAction(userItem, connection)}
                  </div>
                </div>
              );
            } else {
              // Desktop: Table row layout
              return (
                <div key={userItem.id} className="user-row">
                  <div className="table-cell name-col">
                    <span className="user-name-desktop">
                      {userItem.first_name} {userItem.last_name}
                    </span>
                  </div>
                  <div className="table-cell email-col">
                    <span className="user-email">—</span>
                  </div>
                  <div className="table-cell status-col">
                    {renderConnectionStatus(connection)}
                  </div>
                  <div className="table-cell actions-col">
                    {renderConnectionAction(userItem, connection)}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Connection Request Dialog */}
      <Dialog
        header="Connection Request"
        visible={showRequestDialog}
        style={{ width: '400px' }}
        closable={false}
        onHide={() => {
          setShowRequestDialog(false);
          setSelectedRequest(null);
        }}
        footer={
          selectedRequest?.connection && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                label="Deny"
                icon="pi pi-times"
                onClick={() => handleRespondToRequest(selectedRequest.connection!.connectionId, 'DENIED')}
                severity="danger"
                disabled={processing}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              />
              <Button
                label="Accept"
                icon="pi pi-check"
                onClick={() => handleRespondToRequest(selectedRequest.connection!.connectionId, 'ACCEPTED')}
                severity="success"
                disabled={processing}
                loading={processing}
                style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
              />
            </div>
          )
        }
      >
        {selectedRequest && (
          <div style={{ padding: '1rem 0' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
              <strong>{selectedRequest.first_name} {selectedRequest.last_name}</strong> wants to connect with you.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Would you like to accept or deny this connection request?
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Users;
