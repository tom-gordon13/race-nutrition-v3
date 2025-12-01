import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
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
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const EventsTable = ({ events, selectedEvent, onEventSelect }: EventsTableProps) => {
  // Template for duration column
  const durationBodyTemplate = (rowData: Event) => {
    return formatDuration(rowData.expected_duration);
  };

  // Template for date column
  const dateBodyTemplate = (rowData: Event) => {
    return new Date(rowData.created_at).toLocaleDateString();
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
        onSelectionChange={(e) => onEventSelect(e.value)}
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
      </DataTable>
    </>
  );
};
