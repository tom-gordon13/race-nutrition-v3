import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <Dialog
      header=""
      visible={isOpen}
      style={{
        width: isMobile ? '100%' : '600px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onClose}
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
        borderRadius: '20px',
        maxHeight: '85vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#9ca3af',
            letterSpacing: '0.1em'
          }}>
            ADD FOOD ITEM
          </div>
          <button
            onClick={onClose}
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
            TIME (HH:MM)
          </div>
          <InputText
            value={editedTime}
            onChange={(e) => {
              setEditedTime(e.target.value);
              setError(null);
            }}
            placeholder="HH:MM"
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
        </div>

        {/* Servings Input Section */}
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
            SERVINGS
          </div>
          <InputNumber
            value={servings}
            onValueChange={(e) => {
              setServings(e.value || 1);
              setError(null);
            }}
            min={0.1}
            step={0.1}
            minFractionDigits={1}
            maxFractionDigits={2}
            style={{
              width: '100%'
            }}
            inputStyle={{
              fontSize: '1.125rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: '2px solid #e5e7eb',
              borderRadius: 0,
              padding: '0.375rem 0',
              outline: 'none'
            }}
          />
        </div>

        {/* Search Section */}
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
            SEARCH FOOD ITEMS
          </div>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food items..."
            style={{
              width: '100%',
              fontSize: '1rem',
              border: 'none',
              borderBottom: '2px solid #e5e7eb',
              borderRadius: 0,
              padding: '0.375rem 0',
              outline: 'none'
            }}
          />

        </div>

        {/* Filters Section */}
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
            FILTERS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="item-filter"
                checked={itemFilterMode === 'my_items'}
                onChange={() => {
                  onItemFilterModeChange('my_items');
                  onMyItemsOnlyChange(true);
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem' }}>My Items</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="item-filter"
                checked={itemFilterMode === 'favorites'}
                onChange={() => {
                  onItemFilterModeChange('favorites');
                  onMyItemsOnlyChange(false);
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Favorites</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="item-filter"
                checked={itemFilterMode === 'all_items'}
                onChange={() => {
                  onItemFilterModeChange('all_items');
                  onMyItemsOnlyChange(false);
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem' }}>All Items</span>
            </label>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
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
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: isMobile ? '50vh' : '400px',
          overflow: 'auto'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#9ca3af',
            letterSpacing: '0.1em'
          }}>
            SELECT FOOD ITEM
          </div>

          {filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: '#6b7280',
              fontSize: '0.875rem'
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
                    borderRadius: '6px',
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
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9375rem' }}>
                        {item.item_name}
                      </div>
                      {item.brand && (
                        <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          {item.brand}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.category && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontWeight: 500,
                      letterSpacing: '0.05em'
                    }}>
                      {item.category.replace(/_/g, ' ')}
                    </div>
                  )}
                  {item.foodItemNutrients && item.foodItemNutrients.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                      {item.foodItemNutrients.slice(0, 3).map((nutrient) => (
                        <span
                          key={nutrient.id}
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: '#4f46e5',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
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

          <Button
            label="+ Create New Food Item"
            onClick={handleCreateNewFoodItem}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              backgroundColor: 'transparent',
              color: '#6366F1',
              border: '2px dashed #d1d5db',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.75rem'
            }}
            className="p-button-text"
          />
        </div>
      </div>
    </Dialog>
  );
};
