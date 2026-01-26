import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import './NutrientGoalsDialog.css';
import '../shared/ModalSheet.css';
import { API_URL } from '../../config/api';

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



const UNIT_OPTIONS = [
  { label: 'g', value: 'g' },
  { label: 'mg', value: 'mg' },
  { label: 'mcg', value: 'mcg' },
  { label: 'ml', value: 'ml' }
];

// Nutrient-specific default units based on nutrient name
const NUTRIENT_DEFAULT_UNITS: { [key: string]: string } = {
  'water': 'ml',
  'sodium': 'mg',
  'caffeine': 'mg',
  'carbohydrate': 'g',
  'carbohydrates': 'g',
  'carbs': 'g',
  'protein': 'g',
  'fat': 'g',
  'fiber': 'g',
  'sugar': 'g',
  'potassium': 'mg',
  'calcium': 'mg',
  'iron': 'mg',
  'magnesium': 'mg',
  'zinc': 'mg',
  'vitamin c': 'mg',
  'vitamin d': 'mcg',
  'vitamin b12': 'mcg'
};

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (visible) {
      // Start rendering immediately
      setShouldRender(true);
      // Small delay to ensure the browser calculates the initial state
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Start slide-out animation
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // Match the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

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
      setError('Failed to load - please try again in a few minutes');
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
      setError('Failed to load - please try again in a few minutes');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultUnitForNutrient = (nutrientId: string): string => {
    const nutrient = nutrients.find(n => n.id === nutrientId);
    if (!nutrient) return 'g';

    // Check for default unit based on nutrient name (case-insensitive)
    const nutrientName = nutrient.nutrient_name.toLowerCase();
    const defaultUnit = NUTRIENT_DEFAULT_UNITS[nutrientName];

    return defaultUnit || 'g';
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

    const defaultUnit = getDefaultUnitForNutrient(selectedNutrientId);

    setBaseGoals([...baseGoals, {
      nutrient_id: selectedNutrientId,
      quantity: 0,
      unit: defaultUnit
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
      setError('Failed to load - please try again in a few minutes');
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-sheet-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <p className="modal-header-label">GOALS</p>
            <h2 className="modal-header-title">Nutrient Goals</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="modal-content">
            {/* Error Message */}
            {error && (
              <div style={{ padding: '0 1.25rem' }}>
                <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
              </div>
            )}

            {loading ? (
              <div style={{
                padding: '3rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <ProgressSpinner />
              </div>
            ) : (
              <>
                {/* Add Base Goal Section */}
                <div className="form-section">
                  <label className="form-label">Add Base Goal (Per Hour)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Dropdown
                      value={selectedNutrientId}
                      options={availableNutrients}
                      onChange={(e) => setSelectedNutrientId(e.value)}
                      placeholder="Select nutrient..."
                      style={{ flex: 1, fontSize: '1.0625rem' }}
                      filter
                    />
                    <button
                      onClick={addBaseGoal}
                      disabled={!selectedNutrientId}
                      style={{
                        backgroundColor: '#6366f1',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '0.75rem',
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        cursor: !selectedNutrientId ? 'not-allowed' : 'pointer',
                        opacity: !selectedNutrientId ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>

                {/* Base Goals List */}
                {baseGoals.length === 0 ? (
                  <div className="form-section" style={{ textAlign: 'center' }}>
                    <Message
                      severity="info"
                      text="No nutrient goals set. Add a goal to get started."
                      style={{ width: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="form-section">
                    <label className="form-label">Your Goals</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {baseGoals.map(goal => {
                const nutrientHourlyGoals = hourlyGoals.filter(
                  h => h.nutrient_id === goal.nutrient_id
                ).sort((a, b) => a.hour - b.hour);
                const isExpanded = expandedNutrients.has(goal.nutrient_id);

                const headerTemplate = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '120px', fontSize: '1.0625rem' }}>
                      {getNutrientName(goal.nutrient_id)}
                    </span>
                    <span style={{ flex: 1, color: '#6b7280', fontSize: '1rem' }}>
                      Base: {goal.quantity} {goal.unit}/hr
                      {nutrientHourlyGoals.length > 0 && (
                        <span style={{ marginLeft: '1rem', fontStyle: 'italic', fontSize: '0.9375rem' }}>
                          ({nutrientHourlyGoals.length} hourly override{nutrientHourlyGoals.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        removeBaseGoal(goal.nutrient_id);
                      }}
                      title="Remove goal"
                      style={{
                        color: '#dc3545',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );

                return (
                  <Panel
                    key={goal.nutrient_id}
                    header={headerTemplate}
                    toggleable
                    collapsed={!isExpanded}
                    onToggle={() => toggleExpanded(goal.nutrient_id)}
                    collapseIcon="pi pi-chevron-down"
                    expandIcon="pi pi-chevron-right"
                    pt={{
                      header: { style: { backgroundColor: '#f3f0ff', borderColor: '#646cff' } },
                      togglerIcon: { style: { color: 'white' } },
                      toggler: { style: { backgroundColor: '#646cff', borderColor: '#646cff', color: 'white', borderRadius: '4px' } }
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem', textAlign: 'left' }}>
                          Base Quantity
                        </label>
                        <InputNumber
                          value={goal.quantity}
                          onValueChange={(e) => updateBaseGoal(goal.nutrient_id, 'quantity', e.value || 0)}
                          mode="decimal"
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          min={0}
                          style={{ width: '100%', fontSize: '1.0625rem' }}
                        />
                      </div>
                      <div style={{ width: '120px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem', textAlign: 'left' }}>
                          Unit
                        </label>
                        <Dropdown
                          value={goal.unit}
                          options={UNIT_OPTIONS}
                          onChange={(e) => updateBaseGoal(goal.nutrient_id, 'unit', e.value)}
                          style={{ width: '100%', fontSize: '1.0625rem' }}
                        />
                      </div>
                    </div>

                    <Divider />

                    {/* Hourly Overrides */}
                    <div>
                      <h5 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'left' }}>
                        Hourly Overrides ({nutrientHourlyGoals.length})
                      </h5>
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
                          style={{ width: '100%', fontSize: '1.0625rem' }}
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
                                padding: '0.75rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.5rem'
                              }}
                            >
                              <span style={{ width: '80px', fontWeight: 600, fontSize: '1rem', textAlign: 'left' }}>
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
                                style={{ flex: 1, fontSize: '1.0625rem' }}
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
                                style={{ width: '100px', fontSize: '1.0625rem' }}
                              />
                              <button
                                onClick={() => removeHourlyOverride(hourlyGoal.nutrient_id, hourlyGoal.hour)}
                                title="Remove override"
                                style={{
                                  color: '#dc3545',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.5rem',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Panel>
                );
              })}
                </div>
              </div>
            )}
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={saving}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || baseGoals.length === 0}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <svg className="pi pi-spin pi-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save Goals
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading Overlay */}
        {saving && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '24px 24px 0 0',
            zIndex: 10
          }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          </div>
        )}
      </div>
    </div>
  );
};
