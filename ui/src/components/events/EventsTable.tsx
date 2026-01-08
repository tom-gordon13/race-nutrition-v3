import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './EventsTable.css';

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  name: string;
  event_type: string;
  created_at: string;
  updated_at: string;
  private: boolean;
}

interface EventsTableProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  onEditEvent: (event: Event) => void;
  onDuplicateEvent: (event: Event) => void;
  isMobile?: boolean;
}

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

export const EventsTable = ({ events, selectedEvent, onEventSelect, onEditEvent, onDuplicateEvent, isMobile }: EventsTableProps) => {
  if (events.length === 0) {
    return <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '2rem' }}>No plans found. Create your first plan above!</p>;
  }

  return (
    <>
      {/* Desktop: Table Header (hidden on mobile) */}
      {!isMobile && (
        <div className="events-table-header">
          <div className="table-header-cell name-col">PLAN NAME</div>
          <div className="table-header-cell type-col">EVENT TYPE</div>
          <div className="table-header-cell duration-col">DURATION</div>
          <div className="table-header-cell created-col">CREATED</div>
          <div className="table-header-cell privacy-col">PRIVACY</div>
          <div className="table-header-cell actions-col">ACTIONS</div>
        </div>
      )}

      {/* Events List */}
      <div className="events-list">
        {events.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          const duration = formatDuration(event.expected_duration);
          const createdDate = new Date(event.created_at).toLocaleDateString();

          if (isMobile) {
            // Mobile: Card layout
            return (
              <div
                key={event.id}
                className={`event-card-mobile ${isSelected ? 'selected' : ''}`}
                onClick={() => onEventSelect(event)}
              >
                <div className="event-card-header">
                  <div>
                    <h3 className="event-type">{event.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className={`event-type-badge ${event.event_type.toLowerCase()}`}>
                        {formatEventType(event.event_type)}
                      </span>
                      <span className="event-duration">{duration}</span>
                    </div>
                  </div>
                  <div className="event-card-actions-mobile">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                    />
                    <Button
                      icon="pi pi-copy"
                      rounded
                      text
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateEvent(event);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          } else {
            // Desktop: Table row layout
            return (
              <div
                key={event.id}
                className={`event-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onEventSelect(event)}
              >
                <div className="table-cell name-col">
                  <span className="event-name-desktop">{event.name}</span>
                </div>
                <div className="table-cell type-col">
                  <span className={`event-type-badge ${event.event_type.toLowerCase()}`}>
                    {formatEventType(event.event_type)}
                  </span>
                </div>
                <div className="table-cell duration-col">
                  <span className="event-duration-desktop">{duration}</span>
                </div>
                <div className="table-cell created-col">
                  <span className="event-date">{createdDate}</span>
                </div>
                <div className="table-cell privacy-col">
                  <span className={`privacy-badge ${event.private ? 'private' : 'public'}`}>
                    {event.private ? 'Private' : 'Public'}
                  </span>
                </div>
                <div className="table-cell actions-col">
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  />
                  <Button
                    icon="pi pi-copy"
                    rounded
                    text
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateEvent(event);
                    }}
                  />
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Total Count */}
      <div className="events-total">
        <span className="events-count-badge">Total Plans: {events.length}</span>
      </div>
    </>
  );
};
