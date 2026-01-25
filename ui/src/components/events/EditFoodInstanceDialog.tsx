import React, { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputSwitch } from 'primereact/inputswitch';
import '../shared/ModalSheet.css';

interface FoodItemNutrient {
  id: string;
  food_item_id: string;
  nutrient_id: string;
  quantity: number;
  unit: string;
  nutrient: {
    id: string;
    nutrient_name: string;
    nutrient_abbreviation: string;
  };
}

interface FoodItem {
  id: string;
  item_name: string;
  brand?: string;
  category?: string;
  foodItemNutrients?: FoodItemNutrient[];
}

interface FoodInstance {
  id: string;
  time_elapsed_at_consumption: number;
  servings: number;
  food_item_id: string;
  event_id: string;
  foodItem: FoodItem;
}

export interface RepeatConfig {
  enabled: boolean;
  cadenceMinutes: number;
  endTime: number | null;
}

interface EditFoodInstanceDialogProps {
  visible: boolean;
  foodInstance: FoodInstance | null;
  eventDuration: number;
  onHide: () => void;
  onSave: (instanceId: string, time: number, servings: number) => Promise<void>;
  onDelete: (instanceId: string) => void;
  onRepeat?: (foodItemId: string, startTime: number, servings: number, repeatConfig: RepeatConfig) => void;
  viewOnly?: boolean;
}

const formatTimeHHMM = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const parseTimeHHMM = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return (hours * 3600) + (minutes * 60);
};

export const EditFoodInstanceDialog: React.FC<EditFoodInstanceDialogProps> = ({
  visible,
  foodInstance,
  eventDuration,
  onHide,
  onSave,
  onDelete,
  onRepeat,
  viewOnly = false,
}) => {
  const [timeInput, setTimeInput] = useState('');
  const [servings, setServings] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Repeat functionality state
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [cadenceMinutes, setCadenceMinutes] = useState<number>(15);
  const [cadenceInput, setCadenceInput] = useState<string>('15');
  const [endTimeInput, setEndTimeInput] = useState<string>('');
  const [showRepeatPreview, setShowRepeatPreview] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (foodInstance) {
      setTimeInput(formatTimeHHMM(foodInstance.time_elapsed_at_consumption));
      setServings(foodInstance.servings);
      setError(null);
      setRepeatEnabled(false);
      setCadenceMinutes(15);
      setCadenceInput('15');
      setEndTimeInput('');
      setShowRepeatPreview(false);
    }
  }, [foodInstance]);

  const calculateRepeatInstances = () => {
    if (!foodInstance || !repeatEnabled) return [];

    const timeSeconds = parseTimeHHMM(timeInput);
    const endTime = endTimeInput ? parseTimeHHMM(endTimeInput) : eventDuration;
    const cadenceSeconds = cadenceMinutes * 60;

    const instances = [];
    let currentTime = timeSeconds;

    while (currentTime <= endTime && currentTime <= eventDuration) {
      instances.push({
        time: currentTime,
        timeFormatted: formatTimeHHMM(currentTime),
        servings: servings,
      });
      currentTime += cadenceSeconds;
    }

    return instances;
  };

  const isRepeatButtonDisabled = () => {
    if (!repeatEnabled) return false;
    if (cadenceInput === '' || parseInt(cadenceInput) <= 0) return true;
    if (parseInt(cadenceInput) < 10) return true;
    return false;
  };

  const handleSave = async () => {
    if (!foodInstance) return;

    // Don't allow click if repeat is enabled but cadence is invalid
    if (isRepeatButtonDisabled()) {
      return;
    }

    setError(null);

    // Validate servings
    if (servings <= 0) {
      setError('Servings must be greater than 0');
      return;
    }

    // Validate and parse time
    const timeSeconds = parseTimeHHMM(timeInput);
    if (isNaN(timeSeconds)) {
      setError('Please enter valid time in HH:MM format');
      return;
    }

    // Validate time is within event bounds
    if (timeSeconds < 0) {
      setError('Time cannot be negative. Please enter a time of 0:00 or later.');
      return;
    }

    if (timeSeconds > eventDuration) {
      const maxTime = formatTimeHHMM(eventDuration);
      setError(`Time cannot exceed event duration of ${maxTime}. Please enter a time between 0:00 and ${maxTime}.`);
      return;
    }

    // Validate repeat settings if enabled
    if (repeatEnabled) {
      if (cadenceMinutes < 10) {
        setError('Repeat cadence must be at least 10 minutes');
        return;
      }

      if (endTimeInput) {
        const endTimeSeconds = parseTimeHHMM(endTimeInput);
        if (isNaN(endTimeSeconds)) {
          setError('Please enter valid end time in HH:MM format');
          return;
        }
        if (endTimeSeconds <= timeSeconds) {
          setError('End time must be after start time');
          return;
        }
        if (endTimeSeconds > eventDuration) {
          const maxTime = formatTimeHHMM(eventDuration);
          setError(`End time cannot exceed event duration of ${maxTime}`);
          return;
        }
      }

      // Show preview before creating repeated instances
      setShowRepeatPreview(true);
      return;
    }

    setLoading(true);

    try {
      await onSave(foodInstance.id, timeSeconds, servings);
      onHide();
    } catch (err) {
      setError('Failed to load - please try again in a few minutes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRepeat = async () => {
    if (!foodInstance || !onRepeat) return;

    const timeSeconds = parseTimeHHMM(timeInput);
    const endTime = endTimeInput ? parseTimeHHMM(endTimeInput) : null;

    setLoading(true);
    try {
      await onRepeat(foodInstance.food_item_id, timeSeconds, servings, {
        enabled: true,
        cadenceMinutes,
        endTime,
      });
      onHide();
    } catch (err) {
      setError('Failed to create repeated instances');
      setShowRepeatPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!foodInstance) return;
    if (window.confirm(`Are you sure you want to delete ${foodInstance.foodItem.item_name}?`)) {
      onDelete(foodInstance.id);
      onHide();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  if (!foodInstance || !shouldRender) return null;

  return (
    <div
      className={`modal-sheet-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleOverlayClick}
      style={{ zIndex: 15000 }}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <p className="modal-header-label">{viewOnly ? 'VIEWING FOOD ITEM' : 'EDITING FOOD ITEM'}</p>
            <h2 className="modal-header-title">{foodInstance.foodItem.item_name}</h2>
            {foodInstance.foodItem.brand && (
              <p style={{
                fontSize: '0.9375rem',
                color: '#6b7280',
                marginTop: '0.25rem',
                textAlign: 'left'
              }}>
                {foodInstance.foodItem.brand}
              </p>
            )}
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Error Message */}
          {error && (
            <Message severity="error" text={error} style={{ width: '100%' }} />
          )}

          {/* Time and Servings Input Section */}
          <div className="form-section">
            <label className="form-label">TIME & SERVINGS</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {/* Time Input Card */}
              <div className="nutrient-card" style={{ cursor: 'default' }}>
                <div className="nutrient-card-header">
                  <span className="nutrient-card-label">Time</span>
                  <span className="nutrient-card-unit">HH:MM</span>
                </div>
                <input
                  type="text"
                  value={timeInput}
                  onChange={(e) => {
                    setTimeInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="0:00"
                  disabled={viewOnly}
                  readOnly={viewOnly}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                    padding: 0,
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Servings Input Card */}
              <div className="nutrient-card" style={{ cursor: 'default' }}>
                <div className="nutrient-card-header">
                  <span className="nutrient-card-label">Servings</span>
                </div>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setServings(isNaN(value) ? 1 : value);
                    setError(null);
                  }}
                  min={0.1}
                  step={0.1}
                  disabled={viewOnly}
                  readOnly={viewOnly}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                    padding: 0,
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                />
              </div>
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#6b7280',
              marginTop: '0.5rem',
              textAlign: 'left'
            }}>
              Maximum time: {formatTimeHHMM(eventDuration)}
            </div>
          </div>

          {/* Repeat Functionality Section */}
          {!viewOnly && onRepeat && (
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>REPEAT ITEM</label>
                <InputSwitch
                  checked={repeatEnabled}
                  onChange={(e) => {
                    setRepeatEnabled(e.value);
                    setError(null);
                  }}
                  disabled={loading}
                  style={{ transform: 'scale(0.8)' }}
                />
              </div>

              {repeatEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Cadence Input */}
                  <div className="nutrient-card" style={{ cursor: 'default' }}>
                    <div className="nutrient-card-header">
                      <span className="nutrient-card-label">Repeat every</span>
                      <span className="nutrient-card-unit">minutes</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cadenceInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setCadenceInput(value);
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            setCadenceMinutes(numValue);
                          }
                          setError(null);
                        }
                      }}
                      onBlur={() => {
                        // If empty or invalid on blur, reset to 15
                        const value = parseInt(cadenceInput);
                        if (cadenceInput === '' || isNaN(value) || value < 10) {
                          setCadenceInput('15');
                          setCadenceMinutes(15);
                        }
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#111827',
                        padding: 0,
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5
                      }}
                    />
                  </div>

                  {/* End Time Input (Optional) */}
                  <div className="nutrient-card" style={{ cursor: 'default' }}>
                    <div className="nutrient-card-header">
                      <span className="nutrient-card-label">End time (optional)</span>
                      <span className="nutrient-card-unit">HH:MM</span>
                    </div>
                    <input
                      type="text"
                      value={endTimeInput}
                      onChange={(e) => {
                        setEndTimeInput(e.target.value);
                        setError(null);
                      }}
                      placeholder={formatTimeHHMM(eventDuration)}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#111827',
                        padding: 0,
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5
                      }}
                    />
                  </div>

                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                    textAlign: 'left'
                  }}>
                    {cadenceInput === '' || parseInt(cadenceInput) < 10 ? (
                      <span style={{ color: '#dc2626' }}>Minimum cadence is 10 minutes</span>
                    ) : endTimeInput ? (
                      `Will repeat from ${timeInput} to ${endTimeInput} every ${cadenceMinutes} minutes`
                    ) : (
                      `Will repeat from ${timeInput} until end of event every ${cadenceMinutes} minutes`
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nutrition Information Section */}
          {foodInstance.foodItem.foodItemNutrients && foodInstance.foodItem.foodItemNutrients.length > 0 && (
            <div className="form-section">
              <label className="form-label">
                NUTRITION INFORMATION {servings !== 1 && `(${servings} ${servings === 1 ? 'serving' : 'servings'})`}
              </label>
              <div className="nutrient-grid">
                {foodInstance.foodItem.foodItemNutrients.map((nutrient) => {
                  const totalQuantity = nutrient.quantity * servings;
                  return (
                    <div key={nutrient.id} className="nutrient-card" style={{ cursor: 'default' }}>
                      <div className="nutrient-card-header">
                        <span className="nutrient-card-label">{nutrient.nutrient.nutrient_name}</span>
                        <span className="nutrient-card-unit">{nutrient.unit}</span>
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1.5
                      }}>
                        {totalQuantity.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <ProgressSpinner style={{ width: '40px', height: '40px' }} />
            </div>
          ) : viewOnly ? (
            <button
              onClick={onHide}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.0625rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                backgroundColor: '#6366f1',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                marginTop: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5558e3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }}
            >
              Close
            </button>
          ) : (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem'
            }}>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  borderRadius: '0.75rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#fecaca';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                }}
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={loading || isRepeatButtonDisabled()}
                style={{
                  flex: 2,
                  padding: '1rem',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  borderRadius: '0.75rem',
                  backgroundColor: '#6366f1',
                  border: 'none',
                  color: 'white',
                  cursor: (loading || isRepeatButtonDisabled()) ? 'not-allowed' : 'pointer',
                  opacity: (loading || isRepeatButtonDisabled()) ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading && !isRepeatButtonDisabled()) {
                    e.currentTarget.style.backgroundColor = '#5558e3';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                }}
              >
                {loading ? 'Saving...' : repeatEnabled ? 'Preview Repeat' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Repeat Preview/Confirmation Dialog */}
      {showRepeatPreview && (
        <div
          className="modal-sheet-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRepeatPreview(false);
            }
          }}
          style={{ zIndex: 16000 }}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>

            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <p className="modal-header-label">CONFIRM REPEAT</p>
                <h2 className="modal-header-title">Review Items to Create</h2>
              </div>
              <button
                onClick={() => setShowRepeatPreview(false)}
                className="modal-close-button"
              >
                ✕
              </button>
            </div>

            <div className="modal-content" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Summary */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.75rem',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>
                  {foodInstance?.foodItem.item_name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#0c4a6e' }}>
                  {calculateRepeatInstances().length} instances will be created
                </div>
              </div>

              {/* List of instances */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {calculateRepeatInstances().map((instance, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6366f1',
                        backgroundColor: '#eef2ff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem'
                      }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                          {instance.timeFormatted}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {instance.servings} {instance.servings === 1 ? 'serving' : 'servings'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem'
                }}>
                  <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <button
                    onClick={() => setShowRepeatPreview(false)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      borderRadius: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRepeat}
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '1rem',
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      borderRadius: '0.75rem',
                      backgroundColor: '#6366f1',
                      border: 'none',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#5558e3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6366f1';
                    }}
                  >
                    Create {calculateRepeatInstances().length} Items
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
