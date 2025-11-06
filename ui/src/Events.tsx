import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
}

// Compute seconds from three inputs (hours, minutes, seconds)
const computeSecondsFromInputs = (hStr: string, mStr: string, sStr: string): number | null => {
  const toInt = (v: string) => (v.trim() === '' ? 0 : Number(v));
  const h = toInt(hStr);
  const m = toInt(mStr);
  const s = toInt(sStr);

  if (![h, m, s].every((n) => Number.isInteger(n) && n >= 0)) return null;
  if (m > 59 || s > 59) return null;

  return h * 3600 + m * 60 + s;
};

const Events = () => {
  const { user } = useAuth0();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventType, setEventType] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    if (!user || !user.sub) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/events?auth0_sub=${encodeURIComponent(user.sub)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }

      const seconds = computeSecondsFromInputs(hoursInput, minutesInput, secondsInput);
      if (seconds === null) {
        throw new Error('Please enter valid time values. Minutes and seconds must be 0–59.');
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          expected_duration: seconds,
          type: eventType
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const data = await response.json();
      setSuccess(`Event "${data.event.type}" created successfully!`);

      // Reset form
      setEventType('');
      setHoursInput('');
      setMinutesInput('');
      setSecondsInput('');
      setShowCreateForm(false);

      // Refresh events list
      fetchEvents();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const previewSeconds = computeSecondsFromInputs(hoursInput, minutesInput, secondsInput);

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view events.</div>;
  }

  return (
    <div>
      <h2>My Events</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="add-nutrient-btn"
        >
          {showCreateForm ? 'Cancel' : '+ Create New Event'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-food-item" style={{ marginBottom: '2rem' }}>
          <h3>Create New Event</h3>
          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label htmlFor="eventType">Event Type *</label>
              <input
                type="text"
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                placeholder="e.g., Marathon, Half Marathon, 10K"
              />
            </div>

            <div className="form-group">
              <label>Expected Duration</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <input
                    type="number"
                    id="hoursInput"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    min={0}
                    step={1}
                    placeholder="Hours"
                    inputMode="numeric"
                    style={{ width: '6rem' }}
                  />
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>hours</div>
                </div>
                <div>
                  <input
                    type="number"
                    id="minutesInput"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(e.target.value)}
                    min={0}
                    max={59}
                    step={1}
                    placeholder="Minutes"
                    inputMode="numeric"
                    style={{ width: '6rem' }}
                  />
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>minutes</div>
                </div>
                <div>
                  <input
                    type="number"
                    id="secondsInput"
                    value={secondsInput}
                    onChange={(e) => setSecondsInput(e.target.value)}
                    min={0}
                    max={59}
                    step={1}
                    placeholder="Seconds"
                    inputMode="numeric"
                    style={{ width: '6rem' }}
                  />
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>seconds</div>
                </div>
              </div>
              {(hoursInput !== '' || minutesInput !== '' || secondsInput !== '') && (
                <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {previewSeconds !== null
                    ? `→ ${previewSeconds}s (${formatDuration(previewSeconds)})`
                    : 'Enter valid time (mm and ss 0–59)'}
                </small>
              )}
            </div>

            <button type="submit" disabled={submitting || !eventType || previewSeconds === null} className="submit-btn">
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      <p>Total Events: {events.length}</p>

      {events.length === 0 ? (
        <p>No events found. Create your first event above!</p>
      ) : (
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
              <tr key={event.id}>
                <td>{event.type}</td>
                <td>{formatDuration(event.expected_duration)}</td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Events;
