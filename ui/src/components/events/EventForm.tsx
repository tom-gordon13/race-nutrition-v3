import { useState, type FormEvent } from 'react';

interface EventFormProps {
  onSubmit: (eventType: string, expectedDuration: number) => Promise<void>;
  onCancel: () => void;
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

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const EventForm = ({ onSubmit }: EventFormProps) => {
  const [eventType, setEventType] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const previewSeconds = computeSecondsFromInputs(hoursInput, minutesInput, secondsInput);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (previewSeconds === null) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(eventType, previewSeconds);
      // Reset form
      setEventType('');
      setHoursInput('');
      setMinutesInput('');
      setSecondsInput('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-food-item" style={{ marginBottom: '2rem' }}>
      <h3>Create New Event</h3>
      <form onSubmit={handleSubmit}>
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
  );
};
