import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import './NutrientGoalsDialog.css';

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface EventGoalBase {
  id?: string;
  nutrient_id: string;
  quantity: number;
  unit: string;
}

interface EventGoalHourly {
  id?: string;
  nutrient_id: string;
  hour: number;
  quantity: number;
  unit: string;
}

interface NutrientGoalsDialogProps {
  visible: boolean;
  eventId: string;
  eventDuration: number;
  userId: string;
  onHide: () => void;
  onSave: () => void;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const UNIT_OPTIONS = [
  { label: 'g', value: 'g' },
  { label: 'mg', value: 'mg' },
  { label: 'mcg', value: 'mcg' },
  { label: 'ml', value: 'ml' }
];

export const NutrientGoalsDialog = ({
  visible,
  eventId,
  eventDuration,
  userId,
  onHide,
  onSave
}: NutrientGoalsDialogProps) => {
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [baseGoals, setBaseGoals] = useState<EventGoalBase[]>([]);
  const [hourlyGoals, setHourlyGoals] = useState<EventGoalHourly[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>(null);
  const [expandedNutrients, setExpandedNutrients] = useState<Set<string>>(new Set());

  // Fetch nutrients and goals when dialog opens
  useEffect(() => {
    if (visible) {
      fetchNutrients();
      fetchGoals();
    }
  }, [visible, eventId]);

  const fetchNutrients = async () => {
    try {
      const response = await fetch(`${API_URL}/api/nutrients`);
      if (!response.ok) throw new Error('Failed to fetch nutrients');
      const data = await response.json();
      setNutrients(data.nutrients);
    } catch (err) {
      console.error('Error fetching nutrients:', err);
      setError('Failed to load nutrients');
    }
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const [baseResponse, hourlyResponse] = await Promise.all([
        fetch(`${API_URL}/api/event-goals/base?event_id=${eventId}&user_id=${userId}`),
        fetch(`${API_URL}/api/event-goals/hourly?event_id=${eventId}&user_id=${userId}`)
      ]);

      if (baseResponse.ok) {
        const baseData = await baseResponse.json();
        setBaseGoals(baseData.goals || []);
      }

      if (hourlyResponse.ok) {
        const hourlyData = await hourlyResponse.json();
        setHourlyGoals(hourlyData.goals || []);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load existing goals');
    } finally {
      setLoading(false);
    }
  };

  const addBaseGoal = () => {
    if (!selectedNutrientId) {
      setError('Please select a nutrient');
      return;
    }

    // Check if goal already exists
    if (baseGoals.find(g => g.nutrient_id === selectedNutrientId)) {
      setError('Goal for this nutrient already exists');
      return;
    }

    setBaseGoals([...baseGoals, {
      nutrient_id: selectedNutrientId,
      quantity: 0,
      unit: 'g'
    }]);
    setSelectedNutrientId(null);
    setError(null);
  };

  const removeBaseGoal = (nutrientId: string) => {
    setBaseGoals(baseGoals.filter(g => g.nutrient_id !== nutrientId));
    // Also remove any hourly overrides for this nutrient
    setHourlyGoals(hourlyGoals.filter(g => g.nutrient_id !== nutrientId));
    // Remove from expanded set
    const newExpanded = new Set(expandedNutrients);
    newExpanded.delete(nutrientId);
    setExpandedNutrients(newExpanded);
  };

  const updateBaseGoal = (nutrientId: string, field: 'quantity' | 'unit', value: number | string) => {
    setBaseGoals(baseGoals.map(g =>
      g.nutrient_id === nutrientId ? { ...g, [field]: value } : g
    ));
  };

  const addHourlyOverride = (nutrientId: string, hour: number) => {
    // Check if override already exists
    if (hourlyGoals.find(g => g.nutrient_id === nutrientId && g.hour === hour)) {
      return;
    }

    const baseGoal = baseGoals.find(g => g.nutrient_id === nutrientId);
    setHourlyGoals([...hourlyGoals, {
      nutrient_id: nutrientId,
      hour,
      quantity: baseGoal?.quantity || 0,
      unit: baseGoal?.unit || 'g'
    }]);
  };

  const removeHourlyOverride = (nutrientId: string, hour: number) => {
    setHourlyGoals(hourlyGoals.filter(g =>
      !(g.nutrient_id === nutrientId && g.hour === hour)
    ));
  };

  const updateHourlyGoal = (
    nutrientId: string,
    hour: number,
    field: 'quantity' | 'unit',
    value: number | string
  ) => {
    setHourlyGoals(hourlyGoals.map(g =>
      g.nutrient_id === nutrientId && g.hour === hour ? { ...g, [field]: value } : g
    ));
  };

  const toggleExpanded = (nutrientId: string) => {
    const newExpanded = new Set(expandedNutrients);
    if (newExpanded.has(nutrientId)) {
      newExpanded.delete(nutrientId);
    } else {
      newExpanded.add(nutrientId);
    }
    setExpandedNutrients(newExpanded);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save base goals
      await fetch(`${API_URL}/api/event-goals/base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          event_id: eventId,
          goals: baseGoals
        })
      });

      // Save hourly goals
      await fetch(`${API_URL}/api/event-goals/hourly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          event_id: eventId,
          goals: hourlyGoals
        })
      });

      onSave();
      onHide();
    } catch (err) {
      console.error('Error saving goals:', err);
      setError('Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  const durationHours = Math.ceil(eventDuration / 3600);
  const hours = Array.from({ length: durationHours }, (_, i) => i);

  const getNutrientName = (nutrientId: string) => {
    return nutrients.find(n => n.id === nutrientId)?.nutrient_name || 'Unknown';
  };

  const availableNutrients = nutrients
    .filter(n => !baseGoals.find(g => g.nutrient_id === n.id))
    .map(n => ({ label: n.nutrient_name, value: n.id }));

  const footerContent = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={onHide}
        disabled={saving}
        style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white' }}
      />
      <Button
        label={saving ? 'Saving...' : 'Save Goals'}
        icon="pi pi-check"
        onClick={handleSave}
        autoFocus
        disabled={saving || baseGoals.length === 0}
        style={{ backgroundColor: '#646cff', borderColor: '#646cff', color: 'white' }}
      />
    </div>
  );

  return (
    <Dialog
      header="Nutrient Goals"
      visible={visible}
      style={{ width: '50vw', minWidth: '600px' }}
      onHide={onHide}
      footer={footerContent}
      maximizable
      className="nutrient-goals-dialog"
    >
      {error && (
        <Message severity="error" text={error} style={{ marginBottom: '1rem', width: '100%' }} />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <ProgressSpinner />
        </div>
      ) : (
        <>
          {/* Add Base Goal Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginTop: 0 }}>Base Goals (per hour)</h4>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Dropdown
                value={selectedNutrientId}
                options={availableNutrients}
                onChange={(e) => setSelectedNutrientId(e.value)}
                placeholder="Select nutrient..."
                style={{ flex: 1 }}
                filter
              />
              <Button
                label="Add Goal"
                icon="pi pi-plus"
                onClick={addBaseGoal}
                disabled={!selectedNutrientId}
                style={{ backgroundColor: '#646cff', borderColor: '#646cff', color: 'white' }}
              />
            </div>
          </div>

          <Divider />

          {/* Base Goals List */}
          {baseGoals.length === 0 ? (
            <Message
              severity="info"
              text="No nutrient goals set. Add a goal to get started."
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {baseGoals.map(goal => {
                const nutrientHourlyGoals = hourlyGoals.filter(
                  h => h.nutrient_id === goal.nutrient_id
                ).sort((a, b) => a.hour - b.hour);
                const isExpanded = expandedNutrients.has(goal.nutrient_id);

                const headerTemplate = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '120px' }}>
                      {getNutrientName(goal.nutrient_id)}
                    </span>
                    <span style={{ flex: 1, color: '#666' }}>
                      Base: {goal.quantity} {goal.unit}/hr
                      {nutrientHourlyGoals.length > 0 && (
                        <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>
                          ({nutrientHourlyGoals.length} hourly override{nutrientHourlyGoals.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBaseGoal(goal.nutrient_id);
                      }}
                      tooltip="Remove goal"
                      tooltipOptions={{ position: 'top' }}
                      style={{ color: '#dc3545' }}
                    />
                  </div>
                );

                return (
                  <Panel
                    key={goal.nutrient_id}
                    header={headerTemplate}
                    toggleable
                    collapsed={!isExpanded}
                    onToggle={() => toggleExpanded(goal.nutrient_id)}
                    pt={{
                      header: { style: { backgroundColor: '#f3f0ff', borderColor: '#646cff' } },
                      togglerIcon: { style: { color: '#646cff' } }
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                          Base Quantity
                        </label>
                        <InputNumber
                          value={goal.quantity}
                          onValueChange={(e) => updateBaseGoal(goal.nutrient_id, 'quantity', e.value || 0)}
                          mode="decimal"
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          min={0}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ width: '120px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                          Unit
                        </label>
                        <Dropdown
                          value={goal.unit}
                          options={UNIT_OPTIONS}
                          onChange={(e) => updateBaseGoal(goal.nutrient_id, 'unit', e.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <Divider />

                    {/* Hourly Overrides */}
                    <div>
                      <h5>Hourly Overrides ({nutrientHourlyGoals.length})</h5>
                      <div style={{ marginBottom: '1rem' }}>
                        <Dropdown
                          value={null}
                          options={hours
                            .filter(h => !nutrientHourlyGoals.find(hg => hg.hour === h))
                            .map(h => ({
                              label: `Hour ${h} (${h}:00-${h + 1}:00)`,
                              value: h
                            }))}
                          onChange={(e) => {
                            if (e.value !== null) {
                              addHourlyOverride(goal.nutrient_id, e.value);
                            }
                          }}
                          placeholder="Add hour override..."
                          style={{ width: '100%' }}
                        />
                      </div>

                      {nutrientHourlyGoals.length === 0 ? (
                        <Message
                          severity="info"
                          text={`No hourly overrides. All hours use base goal of ${goal.quantity} ${goal.unit}.`}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {nutrientHourlyGoals.map(hourlyGoal => (
                            <div
                              key={`${hourlyGoal.nutrient_id}-${hourlyGoal.hour}`}
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                              }}
                            >
                              <span style={{ width: '80px', fontWeight: 500 }}>
                                Hour {hourlyGoal.hour}
                              </span>
                              <InputNumber
                                value={hourlyGoal.quantity}
                                onValueChange={(e) => updateHourlyGoal(
                                  hourlyGoal.nutrient_id,
                                  hourlyGoal.hour,
                                  'quantity',
                                  e.value || 0
                                )}
                                mode="decimal"
                                minFractionDigits={0}
                                maxFractionDigits={2}
                                min={0}
                                style={{ flex: 1 }}
                              />
                              <Dropdown
                                value={hourlyGoal.unit}
                                options={UNIT_OPTIONS}
                                onChange={(e) => updateHourlyGoal(
                                  hourlyGoal.nutrient_id,
                                  hourlyGoal.hour,
                                  'unit',
                                  e.value
                                )}
                                style={{ width: '100px' }}
                              />
                              <Button
                                icon="pi pi-trash"
                                className="p-button-rounded p-button-text p-button-sm"
                                onClick={() => removeHourlyOverride(hourlyGoal.nutrient_id, hourlyGoal.hour)}
                                tooltip="Remove override"
                                tooltipOptions={{ position: 'top' }}
                                style={{ color: '#dc3545' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </>
      )}
    </Dialog>
  );
};
