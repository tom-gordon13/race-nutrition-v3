import { useState, type FormEvent } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

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
  const [hoursInput, setHoursInput] = useState<number | null>(null);
  const [minutesInput, setMinutesInput] = useState<number | null>(null);
  const [secondsInput, setSecondsInput] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewSeconds = computeSecondsFromInputs(
    String(hoursInput ?? ''),
    String(minutesInput ?? ''),
    String(secondsInput ?? '')
  );

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
      setHoursInput(null);
      setMinutesInput(null);
      setSecondsInput(null);
    } finally {
      setSubmitting(false);
    }
  };

  const headerContent = (
    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#646cff' }}>
      Create New Event
    </h3>
  );

  return (
    <Card
      header={headerContent}
      style={{ marginBottom: '2rem', backgroundColor: '#f3f0ff' }}
      pt={{
        header: { style: { textAlign: 'left', padding: '1.25rem', backgroundColor: '#f3f0ff' } },
        body: { style: { padding: '1.25rem', backgroundColor: '#f3f0ff' } },
        content: { style: { padding: 0 } }
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="eventType" style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
            Event Type *
          </label>
          <InputText
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g., Marathon, Half Marathon, 10K"
            style={{ width: '100%' }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
            Expected Duration
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <InputNumber
                inputId="hoursInput"
                value={hoursInput}
                onValueChange={(e) => setHoursInput(e.value ?? null)}
                min={0}
                placeholder="Hours"
                inputStyle={{ width: '100%' }}
                showButtons={false}
              />
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#646cff', opacity: 0.7 }}>hours</div>
            </div>
            <div style={{ flex: 1 }}>
              <InputNumber
                inputId="minutesInput"
                value={minutesInput}
                onValueChange={(e) => setMinutesInput(e.value ?? null)}
                min={0}
                max={59}
                placeholder="Minutes"
                inputStyle={{ width: '100%' }}
                showButtons={false}
              />
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#646cff', opacity: 0.7 }}>minutes</div>
            </div>
            <div style={{ flex: 1 }}>
              <InputNumber
                inputId="secondsInput"
                value={secondsInput}
                onValueChange={(e) => setSecondsInput(e.value ?? null)}
                min={0}
                max={59}
                placeholder="Seconds"
                inputStyle={{ width: '100%' }}
                showButtons={false}
              />
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#646cff', opacity: 0.7 }}>seconds</div>
            </div>
          </div>
          {(hoursInput !== null || minutesInput !== null || secondsInput !== null) && (
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#646cff' }}>
              {previewSeconds !== null
                ? `→ ${previewSeconds}s (${formatDuration(previewSeconds)})`
                : 'Enter valid time (mm and ss 0–59)'}
            </small>
          )}
        </div>

        <Button
          type="submit"
          label={submitting ? 'Creating...' : 'Create Event'}
          disabled={submitting || !eventType || previewSeconds === null}
          loading={submitting}
          style={{ width: '100%' }}
        />
      </form>
    </Card>
  );
};
