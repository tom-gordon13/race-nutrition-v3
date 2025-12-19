import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

  // Template for connect column
  const connectBodyTemplate = (rowData: User) => {
    const { connection } = rowData;

    // No connection - show connect button
    if (!connection) {
      return (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
          <Button
            icon="pi pi-user-plus"
            className="p-button-rounded p-button-text"
            onClick={(e) => {
              e.stopPropagation();
              handleConnect(rowData.id);
            }}
            tooltip="Connect"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      );
    }

    // I initiated a pending request - show "Pending"
    if (connection.type === 'INITIATED' && connection.status === 'PENDING') {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Tag value="Pending" severity="warning" />
        </div>
      );
    }

    // I received a pending request - show "View Request" button
    if (connection.type === 'RECEIVED' && connection.status === 'PENDING') {
      return (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
          <Button
            label="View Request"
            className="p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRequest(rowData);
            }}
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#9333ea',
              borderColor: '#9333ea',
              color: 'white'
            }}
          />
        </div>
      );
    }

    // Connection is accepted - show checkmark
    if (connection.status === 'ACCEPTED') {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', color: '#22c55e' }}>
          <i className="pi pi-check" style={{ fontSize: '1.25rem' }}></i>
        </div>
      );
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
    <Card
      title="Users"
      className="users-card"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '4px',
        border: '1px solid #d1d5db'
      }}
      pt={{
        title: {
          style: {
            textAlign: 'left',
            color: '#000000',
            padding: '1rem 1.5rem',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #d1d5db'
          }
        },
        body: {
          style: {
            flex: 1,
            overflow: 'auto',
            padding: 0,
            backgroundColor: 'white'
          }
        },
        content: {
          style: {
            padding: 0
          }
        }
      }}
    >
      {users.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '1rem' }}>
          No users found.
        </p>
      ) : (
        <>
          <DataTable
            value={users}
            stripedRows
            emptyMessage="No users found."
          >
            <Column
              header="First Name"
              field="first_name"
              sortable
              sortField="first_name"
              style={{ width: '33.33%' }}
            />
            <Column
              header="Last Name"
              field="last_name"
              sortable
              sortField="last_name"
              style={{ width: '33.33%' }}
            />
            <Column
              header="Connect"
              body={connectBodyTemplate}
              style={{ width: '33.33%', textAlign: 'center' }}
            />
          </DataTable>
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '1rem 0' }}>
            <Tag value={`Total: ${users.length}`} severity="info" />
          </div>
        </>
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
    </Card>
  );
};

export default Users;
