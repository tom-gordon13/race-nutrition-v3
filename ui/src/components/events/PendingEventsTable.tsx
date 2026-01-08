import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

interface SharedEvent {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    event_type: string;
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

interface PendingEventsTableProps {
  sharedEvents: SharedEvent[];
  onViewEvent: (sharedEvent: SharedEvent) => void;
  isMobile?: boolean;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const PendingEventsTable = ({
  sharedEvents,
  onViewEvent,
  isMobile
}: PendingEventsTableProps) => {
  // Template for event name column
  const eventNameBodyTemplate = (rowData: SharedEvent) => {
    return (
      <div>
        <div style={{ fontWeight: 500 }}>{rowData.event.name}</div>
        {!isMobile && (
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            {formatDuration(rowData.event.expected_duration)}
          </div>
        )}
      </div>
    );
  };

  // Template for sender name column
  const senderBodyTemplate = (rowData: SharedEvent) => {
    return `${rowData.sender.first_name} ${rowData.sender.last_name}`;
  };

  // Template for actions column
  const actionsBodyTemplate = (rowData: SharedEvent) => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <Button
          label={isMobile ? undefined : "View"}
          icon="pi pi-eye"
          className="p-button-primary p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewEvent(rowData);
          }}
          tooltip={isMobile ? "View plan" : undefined}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  if (sharedEvents.length === 0) {
    return null; // Don't show anything if there are no pending plans
  }

  return (
    <DataTable
      value={sharedEvents}
      dataKey="id"
      stripedRows
      emptyMessage="No pending shared plans."
    >
      <Column
        header="Plan Name"
        body={eventNameBodyTemplate}
        style={{ width: isMobile ? '40%' : 'auto' }}
      />
      <Column
        header="Shared By"
        body={senderBodyTemplate}
        style={{ width: isMobile ? '30%' : 'auto' }}
      />
      <Column
        header="Actions"
        body={actionsBodyTemplate}
        style={{ width: isMobile ? '30%' : '200px' }}
      />
    </DataTable>
  );
};
