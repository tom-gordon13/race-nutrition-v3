import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { API_URL } from './config/api';
import '../src/components/shared/ModalSheet.css';

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface NutrientValue {
  [nutrientId: string]: string;
}

interface CreateFoodItemProps {
  visible: boolean;
  onHide: () => void;
  onFoodItemCreated?: () => void;
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

const CreateFoodItem = ({ visible, onHide, onFoodItemCreated }: CreateFoodItemProps) => {
  const { user } = useAuth0();
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('0.00');
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [nutrientValues, setNutrientValues] = useState<NutrientValue>({});
  const [loading, setLoading] = useState(false);
  const [fetchingNutrients, setFetchingNutrients] = useState(true);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setItemName('');
    setBrand('');
    setCategory('');
    setCost('0.00');
    setNutrientValues({});
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
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }

      // Build nutrients array from nutrientValues
      const foodItemNutrients = Object.entries(nutrientValues)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([nutrientId, value]) => {
          const nutrient = nutrients.find(n => n.id === nutrientId);
          const unit = nutrient?.nutrient_abbreviation.toLowerCase().includes('sodium') ||
                       nutrient?.nutrient_abbreviation.toLowerCase().includes('caffeine')
                       ? 'mg'
                       : 'g';

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
        auth0_sub: user.sub,
        nutrients: foodItemNutrients
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

      // Success - trigger refetch and close
      if (onFoodItemCreated) {
        onFoodItemCreated();
      }
      handleClose();

    } catch (err) {
      console.error('Error creating food item:', err);
      alert(err instanceof Error ? err.message : 'Failed to create food item');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.sub) {
    return null;
  }

  return (
    <div
      className={`modal-overlay ${visible ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <p className="modal-header-label">Create New</p>
            <h2 className="modal-header-title">Food Item</h2>
          </div>
          <button className="modal-close-button" onClick={handleClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
                    const unit = nutrient.nutrient_abbreviation.toLowerCase().includes('sodium') ||
                                 nutrient.nutrient_abbreviation.toLowerCase().includes('caffeine')
                                 ? 'mg'
                                 : 'g';

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
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateFoodItem;
