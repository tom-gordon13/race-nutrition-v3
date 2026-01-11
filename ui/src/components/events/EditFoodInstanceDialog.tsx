import React, { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
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

interface EditFoodInstanceDialogProps {
  visible: boolean;
  foodInstance: FoodInstance | null;
  eventDuration: number;
  onHide: () => void;
  onSave: (instanceId: string, time: number, servings: number) => Promise<void>;
  onDelete: (instanceId: string) => void;
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
  viewOnly = false,
}) => {
  const [timeInput, setTimeInput] = useState('');
  const [servings, setServings] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

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
    }
  }, [foodInstance]);

  const handleSave = async () => {
    if (!foodInstance) return;

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

    setLoading(true);

    try {
      await onSave(foodInstance.id, timeSeconds, servings);
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update food instance');
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
