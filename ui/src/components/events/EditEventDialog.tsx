import React from 'react';
import { CreateEventDialog } from './CreateEventDialog';

interface EditEventDialogProps {
  visible: boolean;
  event: {
    id: string;
    name: string;
    event_type: string;
    expected_duration: number;
    private: boolean;
    privacy_type?: 'PRIVATE' | 'SHARABLE_LIMITED' | 'SHARABLE_COMMUNITY';
  } | null;
  onHide: () => void;
  onSave: (updatedEvent: any) => void;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  visible,
  event,
  onHide,
  onSave,
}) => {
  const handleSave = () => {
    // Call onSave with the updated event (it will be refetched)
    onSave(event);
  };

  return (
    <CreateEventDialog
      visible={visible}
      onHide={onHide}
      onCreate={handleSave}
      mode="edit"
      existingEvent={event}
    />
  );
};
