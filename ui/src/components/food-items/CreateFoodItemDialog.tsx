import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config/api';
import '../shared/ModalSheet.css';

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface NutrientValue {
  [nutrientId: string]: string;
}

interface FoodItemNutrient {
  id: string;
  quantity: number;
  unit: string;
  nutrient: Nutrient;
}

interface FoodItem {
  id: string;
  item_name: string;
  brand?: string | null;
  category?: string | null;
  cost?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  foodItemNutrients: FoodItemNutrient[];
}

interface CreateFoodItemDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreate: () => void;
  auth0Sub: string;
  mode?: 'create' | 'edit';
  existingItem?: FoodItem | null;
}

// Category configuration with colors matching the design
const CATEGORIES = [
  { value: 'ENERGY_GEL', label: 'Gel', color: '#14b8a6' },
  { value: 'SPORTS_DRINK', label: 'Drink', color: '#f97316' },
  { value: 'ENERGY_BAR', label: 'Bar', color: '#f59e0b' },
  { value: 'FRUIT', label: 'Fruit', color: '#d946ef' },
  { value: 'SNACK', label: 'Chews', color: '#6366f1' },
  { value: 'OTHER', label: 'Other', color: '#6b7280' }
];

// Helper function to determine the correct unit for a nutrient
const getNutrientUnit = (nutrient: Nutrient): string => {
  const nameLower = nutrient.nutrient_name.toLowerCase();
  const abbrevLower = nutrient.nutrient_abbreviation.toLowerCase();

  // Nutrients that should be in milliliters (ml)
  if (nameLower.includes('water') || abbrevLower.includes('water')) {
    return 'ml';
  }

  // Nutrients that should be in micrograms (mcg)
  const mcgNutrients = ['vitamin d', 'vitamin b12', 'b12', 'folate', 'biotin'];
  for (const keyword of mcgNutrients) {
    if (nameLower.includes(keyword) || abbrevLower.includes(keyword)) {
      return 'mcg';
    }
  }

  // Nutrients that should be in milligrams (mg)
  const mgNutrients = [
    'sodium', 'caffeine', 'potassium', 'calcium', 'iron',
    'magnesium', 'zinc', 'vitamin', 'cholesterol'
  ];

  // Check if any of the mg nutrient keywords are in the name or abbreviation
  for (const keyword of mgNutrients) {
    if (nameLower.includes(keyword) || abbrevLower.includes(keyword)) {
      return 'mg';
    }
  }

  // Default to grams for macronutrients (carbs, protein, fat, fiber, sugar, etc.)
  return 'g';
};

export const CreateFoodItemDialog: React.FC<CreateFoodItemDialogProps> = ({
  visible,
  onHide,
  onCreate,
  auth0Sub,
  mode = 'create',
  existingItem = null,
}) => {
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('0.00');
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [nutrientValues, setNutrientValues] = useState<NutrientValue>({});
  const [loading, setLoading] = useState(false);
  const [fetchingNutrients, setFetchingNutrients] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  // Fetch available nutrients on component mount
  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);
        if (!response.ok) throw new Error('Failed to fetch nutrients');
        const data = await response.json();
        setNutrients(data.nutrients);
      } catch (err) {
        console.error('Error fetching nutrients:', err);
      } finally {
        setFetchingNutrients(false);
      }
    };

    fetchNutrients();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && existingItem) {
      setItemName(existingItem.item_name || '');
      setBrand(existingItem.brand || '');
      setCategory(existingItem.category || '');
      setCost(existingItem.cost ? existingItem.cost.toFixed(2) : '0.00');

      // Populate nutrient values
      const nutrientVals: NutrientValue = {};
      existingItem.foodItemNutrients.forEach((fin) => {
        nutrientVals[fin.nutrient.id] = fin.quantity.toString();
      });
      setNutrientValues(nutrientVals);
    }
  }, [mode, existingItem]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form (won't be visible during slide-out animation)
    setItemName('');
    setBrand('');
    setCategory('');
    setCost('0.00');
    setNutrientValues({});
    // Trigger parent to set visible=false, which will start the slide-out animation
    onHide();
  };

  const handleCategorySelect = (categoryValue: string) => {
    setCategory(categoryValue === category ? '' : categoryValue);
  };

  const handleNutrientChange = (nutrientId: string, value: string) => {
    setNutrientValues(prev => ({
      ...prev,
      [nutrientId]: value
    }));
  };

  const focusNutrientInput = (nutrientId: string) => {
    const input = inputRefs.current[nutrientId];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build nutrients array from nutrientValues
      const foodItemNutrients = Object.entries(nutrientValues)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([nutrientId, value]) => {
          const nutrient = nutrients.find(n => n.id === nutrientId);
          const unit = nutrient ? getNutrientUnit(nutrient) : 'g';

          return {
            nutrient_id: nutrientId,
            quantity: parseFloat(value),
            unit
          };
        });

      const payload = {
        item_name: itemName,
        brand: brand || undefined,
        category: category || undefined,
        cost: parseFloat(cost) || undefined,
        auth0_sub: auth0Sub,
        nutrients: foodItemNutrients
      };

      const url = mode === 'edit' && existingItem
        ? `${API_URL}/api/food-items/${existingItem.id}`
        : `${API_URL}/api/food-items`;

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${mode} food item`);
      }

      // Success - trigger refetch and close
      onCreate();
      handleClose();

    } catch (err) {
      console.error(`Error ${mode}ing food item:`, err);
      alert('Failed to load - please try again in a few minutes');
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`food-item-modal-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="food-item-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <p className="modal-header-label">{mode === 'edit' ? 'Edit' : 'Create New'}</p>
            <h2 className="modal-header-title">Food Item</h2>
          </div>
          <button className="modal-close-button" onClick={handleClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">

            {/* Item Name */}
            <div className="form-section">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                placeholder="e.g., Banana, Energy Gel"
                className="input-field"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="form-section">
              <label className="form-label">Category</label>
              <div className="category-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-pill ${category === cat.value ? 'selected' : ''}`}
                    style={{
                      background: `${cat.color}20`,
                      color: cat.color
                    }}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div className="form-section">
              <label className="form-label">
                Brand <span className="form-label-optional">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., SIS, Maurten, Clif"
                className="input-field"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            {/* Cost Per Serving */}
            <div className="form-section">
              <label className="form-label">Cost Per Serving</label>
              <div className="cost-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  className="input-field"
                  value={cost}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      setCost(value);
                    }
                  }}
                  onBlur={() => {
                    // Format to 2 decimal places on blur
                    const num = parseFloat(cost) || 0;
                    setCost(num.toFixed(2));
                  }}
                />
              </div>
            </div>

            {/* Nutrients Section */}
            <div className="form-section">
              <label className="form-label">
                Nutrients <span className="form-label-optional">(tap to add)</span>
              </label>

              {fetchingNutrients ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading nutrients...</p>
              ) : (
                <div className="nutrient-grid">
                  {nutrients.map((nutrient) => {
                    const unit = getNutrientUnit(nutrient);

                    return (
                      <div
                        key={nutrient.id}
                        className="nutrient-card"
                        onClick={() => focusNutrientInput(nutrient.id)}
                      >
                        <div className="nutrient-card-header">
                          <span className="nutrient-card-label">{nutrient.nutrient_name}</span>
                          <span className="nutrient-card-unit">{unit}</span>
                        </div>
                        <input
                          ref={(el) => { inputRefs.current[nutrient.id] = el; }}
                          type="text"
                          placeholder="—"
                          value={nutrientValues[nutrient.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and decimal point
                            if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                              handleNutrientChange(nutrient.id, value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !itemName.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {loading
                ? (mode === 'edit' ? 'Saving...' : 'Creating...')
                : (mode === 'edit' ? 'Save Changes' : 'Create Item')
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
