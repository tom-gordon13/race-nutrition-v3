import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { API_URL } from '../../config/api';



const FOOD_CATEGORIES = [
  'ENERGY_GEL',
  'ENERGY_BAR',
  'SPORTS_DRINK',
  'FRUIT',
  'SNACK',
  'OTHER'
] as const;

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ENERGY_GEL': 'Gel',
  'ENERGY_BAR': 'Bar',
  'SPORTS_DRINK': 'Drink',
  'FRUIT': 'Fruit',
  'SNACK': 'Snack',
  'OTHER': 'Other'
};

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

// Map nutrient names to their standard units
const getNutrientUnit = (nutrientName: string): string => {
  const name = nutrientName.toLowerCase();

  // Milligram nutrients
  if (name.includes('sodium') ||
      name.includes('potassium') ||
      name.includes('caffeine') ||
      name.includes('calcium') ||
      name.includes('iron') ||
      name.includes('magnesium') ||
      name.includes('zinc') ||
      name.includes('vitamin')) {
    return 'mg';
  }

  // Gram nutrients (default for most macros)
  return 'g';
};

interface FoodItemNutrient {
  nutrient_id: string;
  quantity: number | string;
  unit: string;
}

interface CreateFoodItemDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreate: () => void;
  auth0Sub: string;
}

export const CreateFoodItemDialog: React.FC<CreateFoodItemDialogProps> = ({
  visible,
  onHide,
  onCreate,
  auth0Sub,
}) => {
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [availableNutrients, setAvailableNutrients] = useState<Nutrient[]>([]);
  const [nutrients, setNutrients] = useState<FoodItemNutrient[]>([]);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch available nutrients
  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);
        if (!response.ok) throw new Error('Failed to fetch nutrients');
        const data = await response.json();
        setAvailableNutrients(data.nutrients);
      } catch (err) {
        console.error('Error fetching nutrients:', err);
      }
    };

    fetchNutrients();
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (visible) {
      setItemName('');
      setBrand('');
      setCategory('');
      setCost(0);
      setNutrients([]);
      setError(null);
      setIsEditingCost(false);
    }
  }, [visible]);

  const addNutrientRow = () => {
    setNutrients([...nutrients, { nutrient_id: '', quantity: '', unit: '' }]);
  };

  const removeNutrientRow = (index: number) => {
    const updated = nutrients.filter((_, i) => i !== index);
    setNutrients(updated);
  };

  const updateNutrient = (index: number, field: keyof FoodItemNutrient, value: string | number) => {
    const updated = [...nutrients];
    updated[index] = { ...updated[index], [field]: value };
    setNutrients(updated);
  };

  const handleCreate = async () => {
    if (!itemName.trim()) {
      setError('Food item name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out empty nutrient rows
      const validNutrients = nutrients.filter(
        n => n.nutrient_id && n.quantity && n.unit
      ).map(n => ({
        nutrient_id: n.nutrient_id,
        quantity: parseFloat(n.quantity.toString()),
        unit: n.unit
      }));

      const payload = {
        item_name: itemName,
        brand: brand || undefined,
        category: category || undefined,
        cost: cost > 0 ? cost : undefined,
        auth0_sub: auth0Sub,
        nutrients: validNutrients
      };

      const response = await fetch(`${API_URL}/api/food-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create food item');
      }

      onCreate();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '700px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      className="food-item-edit-dialog"
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
        borderRadius: '20px',
        maxHeight: '90vh',
        overflow: 'auto'
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
              CREATE NEW
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              {itemName || 'Food Item'}
            </div>
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

        {/* BASIC INFO Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#9ca3af',
            letterSpacing: '0.1em'
          }}>
            BASIC INFO
          </div>

          {/* Food Name */}
          <InputText
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Banana, Energy Gel"
            disabled={loading}
            style={{
              width: '100%',
              fontSize: '1.125rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: '2px solid #e5e7eb',
              borderRadius: 0,
              padding: '0.375rem 0',
              outline: 'none'
            }}
          />

          {/* Category and Brand */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Category
              </div>
              <Dropdown
                value={category}
                onChange={(e) => setCategory(e.value)}
                options={FOOD_CATEGORIES.map((cat) => ({
                  label: CATEGORY_DISPLAY_NAMES[cat] || cat,
                  value: cat
                }))}
                placeholder="Select category"
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px'
                }}
                pt={{
                  input: { style: { fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#f3f4f6' } },
                  trigger: { style: { color: '#000' } }
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Brand
              </div>
              <InputText
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Add brand"
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.625rem',
                  fontSize: '0.875rem',
                  color: brand ? '#000' : '#9ca3af'
                }}
              />
            </div>
          </div>
        </div>

        {/* COST PER SERVING Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#9ca3af',
            letterSpacing: '0.1em'
          }}>
            COST PER SERVING
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!isEditingCost ? (
              <div style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#000'
              }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(cost || 0)}
              </div>
            ) : (
              <InputNumber
                value={cost || 0}
                onValueChange={(e) => setCost(e.value || 0)}
                mode="currency"
                currency="USD"
                locale="en-US"
                onBlur={() => setIsEditingCost(false)}
                autoFocus
                inputStyle={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: '2px solid #6366f1',
                  borderRadius: 0,
                  padding: '0.25rem 0',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            )}
            <Button
              label="Edit"
              onClick={() => setIsEditingCost(true)}
              style={{
                backgroundColor: '#f3f4f6',
                border: 'none',
                color: '#6b7280',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* NUTRIENTS Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.1em'
            }}>
              NUTRIENTS
            </div>
            <Button
              label="Add"
              icon="pi pi-plus"
              onClick={addNutrientRow}
              style={{
                backgroundColor: '#6366f1',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                padding: '0.5rem 0.875rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Nutrient List */}
          {nutrients.map((nutrient, index) => {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}
              >
                {/* Nutrient Info */}
                <div style={{ flex: 2, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <Dropdown
                    value={availableNutrients.find(n => n.id === nutrient.nutrient_id) || null}
                    onChange={(e) => {
                      if (e.value && e.value.id) {
                        const unit = getNutrientUnit(e.value.nutrient_name);
                        const updated = [...nutrients];
                        updated[index] = {
                          ...updated[index],
                          nutrient_id: e.value.id,
                          unit: unit
                        };
                        setNutrients(updated);
                      }
                    }}
                    options={availableNutrients}
                    optionLabel="nutrient_name"
                    placeholder="Select nutrient"
                    style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}
                  />
                </div>

                {/* Quantity with unit label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  flex: 1,
                  justifyContent: 'flex-end'
                }}>
                  <InputNumber
                    value={typeof nutrient.quantity === 'string' ? parseFloat(nutrient.quantity) || null : (nutrient.quantity || null)}
                    onValueChange={(e) => {
                      const updated = [...nutrients];
                      updated[index] = {
                        ...updated[index],
                        quantity: e.value ?? ''
                      };
                      setNutrients(updated);
                    }}
                    placeholder="0"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    min={0}
                    inputStyle={{
                      width: '45px',
                      textAlign: 'right',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: 'none',
                      borderBottom: '1px solid #e5e7eb',
                      borderRadius: 0,
                      padding: '0.25rem 0.25rem',
                      backgroundColor: 'transparent'
                    }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    minWidth: '30px',
                    textAlign: 'left'
                  }}>
                    {nutrient.unit || '-'}
                  </span>
                </div>

                {/* Delete Button */}
                <Button
                  icon="pi pi-trash"
                  onClick={() => removeNutrientRow(index)}
                  text
                  rounded
                  severity="danger"
                  style={{
                    color: '#ef4444',
                    flexShrink: 0,
                    padding: 0,
                    margin: 0,
                    minWidth: 'auto',
                    width: '1.5rem',
                    height: '1.5rem'
                  }}
                  pt={{
                    root: { style: { padding: 0, margin: 0 } },
                    icon: { style: { fontSize: '0.875rem' } }
                  }}
                />
              </div>
            );
          })}

          {nutrients.length === 0 && (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              No nutrients added yet. Click "Add" to add nutrients.
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0' }}>
          <Button
            label="Cancel"
            onClick={onHide}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#d1d5db',
              border: 'none',
              color: '#6b7280',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.9375rem'
            }}
          />
          <Button
            label={loading ? 'Creating...' : 'Create Food Item'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            onClick={handleCreate}
            disabled={loading || !itemName.trim()}
            style={{
              flex: 1,
              backgroundColor: '#1f2937',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.9375rem'
            }}
          />
        </div>

        {/* Loading Overlay */}
        {loading && (
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
            borderRadius: '20px',
            zIndex: 10
          }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          </div>
        )}
      </div>
    </Dialog>
  );
};
