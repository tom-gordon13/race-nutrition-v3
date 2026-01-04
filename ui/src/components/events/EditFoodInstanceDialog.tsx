import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!foodInstance) return null;

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '500px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      pt={{
        root: { style: { borderRadius: '20px', overflow: 'hidden' } },
        header: { style: { display: 'none' } },
        content: { style: { padding: 0, borderRadius: '20px', overflow: 'hidden' } }
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e5e7eb',
        padding: '1rem',
        gap: '0.5rem',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#9ca3af',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem'
            }}>
              {viewOnly ? 'VIEWING FOOD ITEM' : 'EDITING FOOD ITEM'}
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              {foodInstance.foodItem.item_name}
            </div>
            {foodInstance.foodItem.brand && (
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                {foodInstance.foodItem.brand}
              </div>
            )}
          </div>
          <button
            onClick={onHide}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <Message severity="error" text={error} style={{ width: '100%', marginBottom: '0.5rem' }} />
        )}

        {/* Time Input Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Time (HH:MM)
          </div>
          <InputText
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
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '8px'
            }}
          />
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            Maximum: {formatTimeHHMM(eventDuration)}
          </div>
        </div>

        {/* Servings Input Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Servings
          </div>
          <InputNumber
            value={servings}
            onValueChange={(e) => {
              setServings(e.value || 1);
              setError(null);
            }}
            mode="decimal"
            minFractionDigits={0}
            maxFractionDigits={2}
            min={0.1}
            step={0.1}
            showButtons={!viewOnly}
            disabled={viewOnly}
            readOnly={viewOnly}
            style={{ width: '100%' }}
            inputStyle={{
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Nutrition Information Section */}
        {foodInstance.foodItem.foodItemNutrients && foodInstance.foodItem.foodItemNutrients.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Nutrition Information {servings !== 1 && `(${servings} ${servings === 1 ? 'serving' : 'servings'})`}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {foodInstance.foodItem.foodItemNutrients.map((nutrient) => {
                const totalQuantity = nutrient.quantity * servings;
                return (
                  <div
                    key={nutrient.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: 500
                    }}>
                      {nutrient.nutrient.nutrient_name}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {totalQuantity.toFixed(1)} {nutrient.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {viewOnly ? (
          <div style={{ marginTop: '0.5rem' }}>
            <Button
              label="Close"
              onClick={onHide}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: '#646cff',
                border: 'none'
              }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <Button
              label="Delete"
              severity="danger"
              outlined
              onClick={handleDelete}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px'
              }}
            />
            <Button
              label={loading ? 'Saving...' : 'Save Changes'}
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 2,
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: '#646cff',
                border: 'none'
              }}
            />
          </div>
        )}

        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        )}
      </div>
    </Dialog>
  );
};
