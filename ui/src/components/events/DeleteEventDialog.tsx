import React, { useEffect, useState } from 'react';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import '../shared/ModalSheet.css';
import './ShareEventDialog.css';

interface Event {
  id: string;
  name: string;
  event_type: string;
  expected_duration: number;
}

interface DeleteEventDialogProps {
  visible: boolean;
  event: Event | null;
  onHide: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  visible,
  event,
  onHide,
  onConfirmDelete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onHide();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete();
      // onConfirmDelete will handle navigation and closing the dialog
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatEventType = (eventType: string) => {
    const typeMap: { [key: string]: string } = {
      'TRIATHLON': 'Triathlon',
      'RUN': 'Run',
      'BIKE': 'Bike',
      'OTHER': 'Other'
    };
    return typeMap[eventType] || 'Other';
  };

  if (!shouldRender || !event) return null;

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
            <p className="share-modal-label">DELETE PLAN</p>
            <h2 className="share-modal-title">Confirm Deletion</h2>
          </div>
          <button onClick={onHide} className="modal-close-button" disabled={isDeleting}>
            ✕
          </button>
        </div>

        <div className="share-modal-content">
          {/* Error Message */}
          {error && (
            <div className="share-message-wrapper">
              <Message severity="error" text={error} style={{ width: '100%', marginBottom: '1rem' }} />
            </div>
          )}

          {/* Warning Message */}
          <div className="share-message-wrapper">
            <Message
              severity="warn"
              text="This action cannot be undone. All nutrition data for this plan will be permanently deleted."
              style={{ width: '100%', marginBottom: '1rem' }}
            />
          </div>

          {/* Plan Summary */}
          <div className="share-users-section">
            <label className="share-section-label">PLAN DETAILS</label>
            <div className="delete-plan-summary">
              <div className="delete-plan-info">
                <h3 className="delete-plan-name">{event.name}</h3>
                <div className="delete-plan-meta">
                  <span className={`event-type-badge ${event.event_type.toLowerCase()}`}>
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="delete-plan-duration">
                    {formatDuration(event.expected_duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="share-modal-footer">
          <div className="delete-modal-actions">
            <button
              onClick={onHide}
              disabled={isDeleting}
              className="delete-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="delete-confirm-button"
            >
              {isDeleting ? (
                <>
                  <ProgressSpinner style={{ width: '18px', height: '18px' }} />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
