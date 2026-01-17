import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import './TriathlonTimeBlocks.css';

interface TriathlonAttributes {
  id: string;
  event_id: string;
  swim_duration_seconds: number;
  bike_duration_seconds: number;
  run_duration_seconds: number;
  t1_duration_seconds: number | null;
  t2_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface TriathlonTimeBlocksProps {
  attributes: TriathlonAttributes;
  totalDuration: number;
  editable?: boolean;
  onUpdate?: (updated: TriathlonAttributes) => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const TriathlonTimeBlocks = ({ attributes, totalDuration, editable = false, onUpdate }: TriathlonTimeBlocksProps) => {
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    swim_minutes: Math.floor(attributes.swim_duration_seconds / 60),
    bike_minutes: Math.floor(attributes.bike_duration_seconds / 60),
    run_minutes: Math.floor(attributes.run_duration_seconds / 60),
    t1_minutes: attributes.t1_duration_seconds ? Math.floor(attributes.t1_duration_seconds / 60) : 0,
    t2_minutes: attributes.t2_duration_seconds ? Math.floor(attributes.t2_duration_seconds / 60) : 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const calculatePercentage = (duration: number) => {
    return (duration / totalDuration) * 100;
  };

  const swimPercentage = calculatePercentage(attributes.swim_duration_seconds);
  const t1Percentage = attributes.t1_duration_seconds ? calculatePercentage(attributes.t1_duration_seconds) : 0;
  const bikePercentage = calculatePercentage(attributes.bike_duration_seconds);
  const t2Percentage = attributes.t2_duration_seconds ? calculatePercentage(attributes.t2_duration_seconds) : 0;
  const runPercentage = calculatePercentage(attributes.run_duration_seconds);

  const handleSave = () => {
    const swimSeconds = editForm.swim_minutes * 60;
    const bikeSeconds = editForm.bike_minutes * 60;
    const runSeconds = editForm.run_minutes * 60;
    const t1Seconds = editForm.t1_minutes * 60;
    const t2Seconds = editForm.t2_minutes * 60;

    const totalSeconds = swimSeconds + bikeSeconds + runSeconds + t1Seconds + t2Seconds;

    if (totalSeconds !== totalDuration) {
      setValidationError(
        `Total segment duration (${formatTime(totalSeconds)}) must equal event duration (${formatTime(totalDuration)})`
      );
      return;
    }

    const updated: TriathlonAttributes = {
      ...attributes,
      swim_duration_seconds: swimSeconds,
      bike_duration_seconds: bikeSeconds,
      run_duration_seconds: runSeconds,
      t1_duration_seconds: t1Seconds || null,
      t2_duration_seconds: t2Seconds || null,
      updated_at: new Date().toISOString(),
    };

    onUpdate?.(updated);
    setEditDialogVisible(false);
    setValidationError(null);
  };

  const totalEditMinutes = editForm.swim_minutes + editForm.bike_minutes + editForm.run_minutes + editForm.t1_minutes + editForm.t2_minutes;
  const totalDurationMinutes = Math.floor(totalDuration / 60);

  return (
    <div className="triathlon-time-blocks">
      <div className="time-blocks-header">
        <h3>Triathlon Segments</h3>
        {editable && (
          <Button
            icon="pi pi-pencil"
            className="p-button-text p-button-sm"
            onClick={() => setEditDialogVisible(true)}
            tooltip="Edit segment durations"
          />
        )}
      </div>

      <div className="time-blocks-visualization">
        <div
          className="time-block swim"
          style={{ width: `${swimPercentage}%` }}
          title={`Swim: ${formatTime(attributes.swim_duration_seconds)}`}
        >
          <span className="time-block-label">Swim</span>
          <span className="time-block-duration">{formatTime(attributes.swim_duration_seconds)}</span>
        </div>

        {attributes.t1_duration_seconds && attributes.t1_duration_seconds > 0 && (
          <div
            className="time-block transition"
            style={{ width: `${t1Percentage}%` }}
            title={`T1: ${formatTime(attributes.t1_duration_seconds)}`}
          >
            <span className="time-block-label">T1</span>
          </div>
        )}

        <div
          className="time-block bike"
          style={{ width: `${bikePercentage}%` }}
          title={`Bike: ${formatTime(attributes.bike_duration_seconds)}`}
        >
          <span className="time-block-label">Bike</span>
          <span className="time-block-duration">{formatTime(attributes.bike_duration_seconds)}</span>
        </div>

        {attributes.t2_duration_seconds && attributes.t2_duration_seconds > 0 && (
          <div
            className="time-block transition"
            style={{ width: `${t2Percentage}%` }}
            title={`T2: ${formatTime(attributes.t2_duration_seconds)}`}
          >
            <span className="time-block-label">T2</span>
          </div>
        )}

        <div
          className="time-block run"
          style={{ width: `${runPercentage}%` }}
          title={`Run: ${formatTime(attributes.run_duration_seconds)}`}
        >
          <span className="time-block-label">Run</span>
          <span className="time-block-duration">{formatTime(attributes.run_duration_seconds)}</span>
        </div>
      </div>

      <div className="time-blocks-legend">
        <div className="legend-item">
          <span className="legend-color swim"></span>
          <span>Swim: {formatTime(attributes.swim_duration_seconds)}</span>
        </div>
        {attributes.t1_duration_seconds && attributes.t1_duration_seconds > 0 && (
          <div className="legend-item">
            <span className="legend-color transition"></span>
            <span>T1: {formatTime(attributes.t1_duration_seconds)}</span>
          </div>
        )}
        <div className="legend-item">
          <span className="legend-color bike"></span>
          <span>Bike: {formatTime(attributes.bike_duration_seconds)}</span>
        </div>
        {attributes.t2_duration_seconds && attributes.t2_duration_seconds > 0 && (
          <div className="legend-item">
            <span className="legend-color transition"></span>
            <span>T2: {formatTime(attributes.t2_duration_seconds)}</span>
          </div>
        )}
        <div className="legend-item">
          <span className="legend-color run"></span>
          <span>Run: {formatTime(attributes.run_duration_seconds)}</span>
        </div>
      </div>

      <Dialog
        header="Edit Triathlon Segments"
        visible={editDialogVisible}
        style={{ width: '500px' }}
        onHide={() => {
          setEditDialogVisible(false);
          setValidationError(null);
        }}
        footer={
          <div>
            <Button label="Cancel" icon="pi pi-times" onClick={() => setEditDialogVisible(false)} className="p-button-text" />
            <Button label="Save" icon="pi pi-check" onClick={handleSave} />
          </div>
        }
      >
        <div className="p-fluid">
          {validationError && (
            <Message severity="error" text={validationError} className="mb-3" />
          )}

          <div className="field mb-3">
            <label htmlFor="swim">Swim Duration (minutes)</label>
            <InputNumber
              id="swim"
              value={editForm.swim_minutes}
              onValueChange={(e) => setEditForm({ ...editForm, swim_minutes: e.value || 0 })}
              min={0}
              showButtons
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="t1">T1 - Transition 1 (minutes)</label>
            <InputNumber
              id="t1"
              value={editForm.t1_minutes}
              onValueChange={(e) => setEditForm({ ...editForm, t1_minutes: e.value || 0 })}
              min={0}
              showButtons
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="bike">Bike Duration (minutes)</label>
            <InputNumber
              id="bike"
              value={editForm.bike_minutes}
              onValueChange={(e) => setEditForm({ ...editForm, bike_minutes: e.value || 0 })}
              min={0}
              showButtons
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="t2">T2 - Transition 2 (minutes)</label>
            <InputNumber
              id="t2"
              value={editForm.t2_minutes}
              onValueChange={(e) => setEditForm({ ...editForm, t2_minutes: e.value || 0 })}
              min={0}
              showButtons
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="run">Run Duration (minutes)</label>
            <InputNumber
              id="run"
              value={editForm.run_minutes}
              onValueChange={(e) => setEditForm({ ...editForm, run_minutes: e.value || 0 })}
              min={0}
              showButtons
            />
          </div>

          <div className="field">
            <strong>Total: {totalEditMinutes} minutes / {totalDurationMinutes} minutes required</strong>
            {totalEditMinutes !== totalDurationMinutes && (
              <span style={{ color: 'red', marginLeft: '10px' }}>
                ({totalEditMinutes > totalDurationMinutes ? '+' : ''}{totalEditMinutes - totalDurationMinutes} minutes)
              </span>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TriathlonTimeBlocks;
