import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface EventsTableProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  onEditEvent: (event: Event) => void;
  onDuplicateEvent: (event: Event) => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const EventsTable = ({ events, selectedEvent, onEventSelect, onEditEvent, onDuplicateEvent }: EventsTableProps) => {
  // Template for duration column
  const durationBodyTemplate = (rowData: Event) => {
    return formatDuration(rowData.expected_duration);
  };

  // Template for date column
  const dateBodyTemplate = (rowData: Event) => {
    return new Date(rowData.created_at).toLocaleDateString();
  };

  // Template for actions column
  const actionsBodyTemplate = (rowData: Event) => {
    return (
      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            onEditEvent(rowData);
          }}
          tooltip="Edit event"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-copy"
          className="p-button-rounded p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateEvent(rowData);
          }}
          tooltip="Duplicate event"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  if (events.length === 0) {
    return <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '1rem' }}>No events found. Create your first event above!</p>;
  }

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <Tag value={`Total Events: ${events.length}`} severity="info" />
      </div>
      <DataTable
        value={events}
        selectionMode="single"
        selection={selectedEvent}
        onSelectionChange={(e) => onEventSelect(e.value as Event)}
        dataKey="id"
        stripedRows
        emptyMessage="No events found."
      >
        <Column field="type" header="Event Type" sortable />
        <Column
          header="Expected Duration"
          body={durationBodyTemplate}
          sortable
          sortField="expected_duration"
        />
        <Column
          header="Created"
          body={dateBodyTemplate}
          sortable
          sortField="created_at"
        />
        <Column
          header="Actions"
          body={actionsBodyTemplate}
          style={{ width: '7rem', textAlign: 'center' }}
        />
      </DataTable>
    </>
  );
};
