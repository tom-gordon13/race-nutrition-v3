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
  if (events.length === 0) {
    return <p>No events found. Create your first event above!</p>;
  }

  return (
    <>
      <p>Total Events: {events.length}</p>
      <div className="events-table-container">
        <table>
          <thead>
            <tr>
              <th>Event Type</th>
              <th>Expected Duration</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                onClick={() => onEventSelect(event)}
                className={selectedEvent?.id === event.id ? 'selected' : ''}
                style={{ cursor: 'pointer' }}
              >
                <td>{event.type}</td>
                <td>{formatDuration(event.expected_duration)}</td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
