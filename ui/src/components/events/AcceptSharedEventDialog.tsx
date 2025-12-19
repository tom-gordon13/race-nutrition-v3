import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './AcceptSharedEventDialog.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface SharedEvent {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    type: string;
    expected_duration: number;
    created_at: string;
  };
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

interface AcceptSharedEventDialogProps {
  visible: boolean;
  sharedEvent: SharedEvent | null;
  onHide: () => void;
  onAccept: () => void;
  onDeny: () => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const AcceptSharedEventDialog: React.FC<AcceptSharedEventDialogProps> = ({
  visible,
  sharedEvent,
  onHide,
  onAccept,
  onDeny,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!sharedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept shared event');
      }

      onAccept();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept event');
      console.error('Error accepting shared event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!sharedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DENIED'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deny shared event');
      }

      onDeny();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny event');
      console.error('Error denying shared event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!sharedEvent) return null;

  const footer = (
    <div className="accept-shared-event-footer">
      <Button
        label="Deny"
        icon="pi pi-times"
        onClick={handleDeny}
        severity="danger"
        outlined
        disabled={loading}
      />
      <Button
        label="Accept Event"
        icon="pi pi-check"
        onClick={handleAccept}
        severity="success"
        disabled={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Shared Event"
      style={{ width: '500px' }}
      modal
      footer={footer}
      className="accept-shared-event-dialog"
      closeIcon="pi pi-times"
    >
      <div className="accept-shared-event-content">
        {error && (
          <Message severity="error" text={error} style={{ width: '100%', marginBottom: '1rem' }} />
        )}

        {loading ? (
          <div className="loading-container">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p>Processing...</p>
          </div>
        ) : (
          <>
            <div className="event-info-section">
              <h3 className="event-name">{sharedEvent.event.type}</h3>
              <div className="event-details">
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{formatDuration(sharedEvent.event.expected_duration)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Shared by:</span>
                  <span className="detail-value">
                    {sharedEvent.sender.first_name} {sharedEvent.sender.last_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-message">
              <i className="pi pi-info-circle" style={{ marginRight: '0.5rem' }}></i>
              <div>
                <strong>Accepting this event will:</strong>
                <ul>
                  <li>Create a copy of the event in your events list</li>
                  <li>Copy all food items and nutrition information</li>
                  <li>Copy all nutrition goals (hourly and total)</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
