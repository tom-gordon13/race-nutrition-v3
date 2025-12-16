import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import './EditEventDialog.css';

interface EditEventDialogProps {
  visible: boolean;
  event: {
    id: string;
    type: string;
    expected_duration: number;
  } | null;
  onHide: () => void;
  onSave: () => void;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  visible,
  event,
  onHide,
  onSave,
}) => {
  const [eventName, setEventName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setEventName(event.type);
      const totalSeconds = event.expected_duration;
      setHours(Math.floor(totalSeconds / 3600));
      setMinutes(Math.floor((totalSeconds % 3600) / 60));
      setSeconds(totalSeconds % 60);
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (!eventName.trim()) {
      setError('Event name is required');
      return;
    }

    if (totalSeconds <= 0) {
      setError('Expected duration must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: eventName,
          expected_duration: totalSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      onSave();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="edit-event-footer">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={onHide}
        severity="secondary"
        outlined
      />
      <Button
        label="Save Changes"
        icon="pi pi-check"
        onClick={handleSave}
        disabled={loading}
        className="save-button"
      />
    </div>
  );

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const hoursDisplay = Math.floor(totalSeconds / 3600);
  const minutesDisplay = Math.floor((totalSeconds % 3600) / 60);
  const secondsDisplay = totalSeconds % 60;

  return (
    <Dialog
      header="Edit Event"
      visible={visible}
      style={{ width: '100vw', height: '75vh' }}
      footer={footer}
      onHide={onHide}
      modal
      dismissableMask
      position="bottom"
      className="edit-event-dialog"
    >
      {loading && (
        <div className="loading-container">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
        </div>
      )}

      {error && (
        <div className="error-container">
          <Message severity="error" text={error} style={{ width: '100%' }} />
        </div>
      )}

      <div className="edit-event-field">
        <label htmlFor="eventName" className="edit-event-label">
          Event Name
        </label>
        <div className="edit-event-input">
          <InputText
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g., Marathon, Half Marathon"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="edit-event-label">Expected Duration</label>
        <div className="duration-inputs">
          <div className="duration-input-wrapper">
            <label htmlFor="hours" className="duration-input-label">
              Hours
            </label>
            <InputText
              id="hours"
              type="number"
              value={hours.toString()}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              disabled={loading}
            />
          </div>
          <div className="duration-input-wrapper">
            <label htmlFor="minutes" className="duration-input-label">
              Minutes
            </label>
            <InputText
              id="minutes"
              type="number"
              value={minutes.toString()}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              min="0"
              max="59"
              disabled={loading}
            />
          </div>
          <div className="duration-input-wrapper">
            <label htmlFor="seconds" className="duration-input-label">
              Seconds
            </label>
            <InputText
              id="seconds"
              type="number"
              value={seconds.toString()}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              min="0"
              max="59"
              disabled={loading}
            />
          </div>
        </div>
        <div className="total-duration-display">
          <span className="total-duration-label">Total Duration:</span>
          <span className="total-duration-value">
            {hoursDisplay}h {minutesDisplay}m {secondsDisplay}s
          </span>
        </div>
      </div>
    </Dialog>
  );
};
