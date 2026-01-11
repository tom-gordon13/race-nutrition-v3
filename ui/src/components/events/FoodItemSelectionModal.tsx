import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from 'primereact/message';
import '../shared/ModalSheet.css';

export type ItemFilterMode = 'my_items' | 'favorites' | 'all_items';

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
  foodItemNutrients: FoodItemNutrient[];
}

interface FoodItemSelectionModalProps {
  isOpen: boolean;
  foodItems: FoodItem[];
  timeInSeconds: number;
  eventDuration: number;
  categoryFilter: string;
  myItemsOnly: boolean;
  itemFilterMode: ItemFilterMode;
  onClose: () => void;
  onSelect: (foodItemId: string, servings: number, timeInSeconds: number) => void;
  onCategoryFilterChange: (category: string) => void;
  onMyItemsOnlyChange: (myItemsOnly: boolean) => void;
  onItemFilterModeChange: (mode: ItemFilterMode) => void;
  categoryColors?: Map<string, string>;
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

export const FoodItemSelectionModal = ({
  isOpen,
  foodItems,
  timeInSeconds,
  eventDuration,
  categoryFilter,
  myItemsOnly: _myItemsOnly,
  itemFilterMode,
  onClose,
  onSelect,
  onCategoryFilterChange,
  onMyItemsOnlyChange,
  onItemFilterModeChange,
  categoryColors
}: FoodItemSelectionModalProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [servings, setServings] = useState(1);
  const [editedTime, setEditedTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // Initialize editedTime when modal opens or timeInSeconds changes
  useEffect(() => {
    if (isOpen) {
      setEditedTime(formatTimeHHMM(timeInSeconds));
      setError(null);
    }
  }, [isOpen, timeInSeconds]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setServings(1);
      setEditedTime('');
      setError(null);
    }
  }, [isOpen]);

  // Get unique categories from food items
  const categories = Array.from(new Set(foodItems.map(item => item.category).filter(Boolean)));

  // Filter food items based on search term and category
  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleSelect = (foodItemId: string) => {
    // Clear any previous errors
    setError(null);

    if (!servings || servings <= 0) {
      setError('Please enter valid servings');
      return;
    }

    const timeSeconds = parseTimeHHMM(editedTime);
    if (isNaN(timeSeconds)) {
      setError('Please enter valid time in HH:MM format');
      return;
    }

    // Validate time is within plan bounds
    if (timeSeconds < 0) {
      setError('Time cannot be negative. Please enter a time of 0:00 or later.');
      return;
    }

    if (timeSeconds > eventDuration) {
      const maxTime = formatTimeHHMM(eventDuration);
      setError(`Time cannot exceed plan duration of ${maxTime}. Please enter a time between 0:00 and ${maxTime}.`);
      return;
    }

    onSelect(foodItemId, servings, timeSeconds);
    setError(null);
  };

  const handleCreateNewFoodItem = () => {
    navigate('/food-items');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
            <p className="modal-header-label">ADD FOOD ITEM</p>
            <h2 className="modal-header-title">Select Item</h2>
          </div>
          <button
            onClick={onClose}
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

          {/* Time Input Section */}
          <div className="form-section">
            <label className="form-label">TIME (HH:MM)</label>
            <input
              type="text"
              className="form-input"
              value={editedTime}
              onChange={(e) => {
                setEditedTime(e.target.value);
                setError(null);
              }}
              placeholder="HH:MM"
            />
          </div>

          {/* Servings Input Section */}
          <div className="form-section">
            <label className="form-label">SERVINGS</label>
            <input
              type="number"
              className="form-input"
              value={servings}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setServings(isNaN(value) ? 1 : value);
                setError(null);
              }}
              min={0.1}
              step={0.1}
              placeholder="1.0"
            />
          </div>

          {/* Search Section */}
          <div className="form-section">
            <label className="form-label">SEARCH FOOD ITEMS</label>
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search food items..."
            />
          </div>

          {/* Filters Section */}
          <div className="form-section">
            <label className="form-label">FILTERS</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', color: '#374151' }}>
                <input
                  type="radio"
                  name="item-filter"
                  checked={itemFilterMode === 'my_items'}
                  onChange={() => {
                    onItemFilterModeChange('my_items');
                    onMyItemsOnlyChange(true);
                  }}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <span>My Items</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', color: '#374151' }}>
                <input
                  type="radio"
                  name="item-filter"
                  checked={itemFilterMode === 'favorites'}
                  onChange={() => {
                    onItemFilterModeChange('favorites');
                    onMyItemsOnlyChange(false);
                  }}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <span>Favorites</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', color: '#374151' }}>
                <input
                  type="radio"
                  name="item-filter"
                  checked={itemFilterMode === 'all_items'}
                  onChange={() => {
                    onItemFilterModeChange('all_items');
                    onMyItemsOnlyChange(false);
                  }}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <span>All Items</span>
              </label>

              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category?.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Food Items List Section */}
          <div className="form-section" style={{ maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <label className="form-label">SELECT FOOD ITEM</label>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#6b7280',
                  fontSize: '1rem'
                }}>
                  No food items found. Try a different search term.
                </div>
              ) : (
                filteredItems.map((item) => {
                  // Get color for this category
                  const categoryColor = item.category && categoryColors
                    ? categoryColors.get(item.category)
                    : undefined;

                  // Determine background and border color
                  const backgroundColor = categoryColor
                    ? `${categoryColor}1A`  // Add 1A for 10% opacity (hex for ~0.1 alpha)
                    : '#f9fafb';

                  const borderLeftColor = categoryColor
                    ? categoryColor
                    : '#e5e7eb';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      style={{
                        backgroundColor,
                        borderLeftColor,
                        borderLeftWidth: '4px',
                        borderLeftStyle: 'solid',
                        padding: '0.875rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                            {item.item_name}
                          </div>
                          {item.brand && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              {item.brand}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.category && (
                        <div style={{
                          fontSize: '0.8125rem',
                          color: '#9ca3af',
                          fontWeight: 500,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          {item.category.replace(/_/g, ' ')}
                        </div>
                      )}
                      {item.foodItemNutrients && item.foodItemNutrients.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {item.foodItemNutrients.slice(0, 3).map((nutrient) => (
                            <span
                              key={nutrient.id}
                              style={{
                                display: 'inline-block',
                                padding: '0.375rem 0.625rem',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: '#4f46e5',
                                borderRadius: '0.375rem',
                                fontSize: '0.8125rem',
                                fontWeight: 500
                              }}
                            >
                              {nutrient.nutrient.nutrient_abbreviation}: {nutrient.quantity} {nutrient.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <button
                onClick={handleCreateNewFoodItem}
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#6366f1',
                  border: '2px dashed #d1d5db',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                + Create New Food Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
