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
  cost?: number;
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
  const [servings, setServings] = useState<number | string>(1);
  const [editedTime, setEditedTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
      setSelectedItemId(null);
      setShowCategoryDropdown(false);
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

  const handleItemClick = (foodItemId: string) => {
    setSelectedItemId(foodItemId);
  };

  const handleAddToTimeline = () => {
    // Clear any previous errors
    setError(null);

    if (!selectedItemId) {
      setError('Please select a food item');
      return;
    }

    const servingsNum = typeof servings === 'string' ? parseFloat(servings) : servings;
    if (!servingsNum || isNaN(servingsNum) || servingsNum <= 0) {
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

    onSelect(selectedItemId, servingsNum, timeSeconds);
    setSelectedItemId(null);
    setError(null);
  };

  const incrementServings = () => {
    setServings(prev => {
      const current = typeof prev === 'string' ? parseFloat(prev) || 1 : prev;
      return Math.round((current + 0.5) * 10) / 10;
    });
  };

  const decrementServings = () => {
    setServings(prev => {
      const current = typeof prev === 'string' ? parseFloat(prev) || 1 : prev;
      return Math.max(0.5, Math.round((current - 0.5) * 10) / 10);
    });
  };


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showCategoryDropdown && !target.closest('.category-filter-dropdown-wrapper')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

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

        <div className="modal-content">

          {/* Error Message */}
          {error && (
            <div style={{ padding: '0 1.25rem', paddingTop: '0.75rem' }}>
              <Message severity="error" text={error} style={{ width: '100%' }} />
            </div>
          )}

          {/* Time & Servings Row */}
          <div className="time-servings-section">
            <div className="time-input-container-equal">
              <label className="form-label">TIME</label>
              <div className="time-input-wrapper">
                <i className="pi pi-clock time-icon"></i>
                <input
                  type="text"
                  className="time-input-field"
                  value={editedTime}
                  onChange={(e) => {
                    setEditedTime(e.target.value);
                    setError(null);
                  }}
                  placeholder="0:00"
                />
              </div>
            </div>
            <div className="servings-input-container-equal">
              <label className="form-label">SERVINGS</label>
              <div className="servings-control">
                <button onClick={decrementServings} className="servings-btn">
                  <i className="pi pi-minus"></i>
                </button>
                <input
                  type="text"
                  className="servings-value"
                  value={servings}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Allow empty string
                    if (input === '') {
                      setServings('');
                      return;
                    }
                    // Allow any valid decimal number format (including partial like "1." or ".5")
                    // This regex allows: optional digits, optional decimal, optional digits
                    if (/^\d*\.?\d*$/.test(input)) {
                      setServings(input);
                      setError(null);
                    }
                  }}
                  onBlur={(e) => {
                    // On blur, ensure we have a valid number
                    const input = e.target.value;
                    const value = parseFloat(input);
                    if (isNaN(value) || value <= 0 || input === '' || input === '.') {
                      setServings(1);
                    } else {
                      // Clean up the value (e.g., "1." becomes "1", ".5" becomes "0.5")
                      setServings(value);
                    }
                  }}
                  inputMode="decimal"
                />
                <button onClick={incrementServings} className="servings-btn">
                  <i className="pi pi-plus"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar with Filter */}
          <div className="search-section">
            <div className="search-with-filter-row">
              <div className="search-input-container-with-filter">
                <i className="pi pi-search search-icon-new"></i>
                <input
                  type="text"
                  className="search-input-new"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search food items..."
                />
              </div>

              {/* Category Filter Dropdown */}
              <div className="category-filter-dropdown-wrapper">
                <button
                  className="filter-dropdown-btn"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <i className="pi pi-filter"></i>
                  <span>Filter</span>
                  <i className={`pi pi-chevron-${showCategoryDropdown ? 'up' : 'down'}`} style={{ fontSize: '0.625rem' }}></i>
                </button>
                {showCategoryDropdown && (
                  <div className="category-dropdown-menu">
                    <button
                      className={`category-dropdown-item ${categoryFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => {
                        onCategoryFilterChange('ALL');
                        setShowCategoryDropdown(false);
                      }}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => {
                      const color = categoryColors?.get(category!) || '#6366f1';
                      return (
                        <button
                          key={category}
                          className={`category-dropdown-item ${categoryFilter === category ? 'active' : ''}`}
                          onClick={() => {
                            onCategoryFilterChange(category!);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <span className="category-dot" style={{ backgroundColor: color }}></span>
                          <span>{category!.charAt(0) + category!.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills-section">
            <button
              className={`filter-pill-btn ${itemFilterMode === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                onItemFilterModeChange('favorites');
                onMyItemsOnlyChange(false);
              }}
            >
              <i className="pi pi-star-fill" style={{ fontSize: '0.75rem' }}></i>
              <span>Favorites</span>
            </button>
            <button
              className={`filter-pill-btn ${itemFilterMode === 'my_items' ? 'active' : ''}`}
              onClick={() => {
                onItemFilterModeChange('my_items');
                onMyItemsOnlyChange(true);
              }}
            >
              My Items
            </button>
            <button
              className={`filter-pill-btn ${itemFilterMode === 'all_items' ? 'active' : ''}`}
              onClick={() => {
                onItemFilterModeChange('all_items');
                onMyItemsOnlyChange(false);
              }}
            >
              All Items
            </button>
          </div>

          {/* Results Count */}
          <div className="results-count-section">
            <span className="results-count">{filteredItems.length} items</span>
          </div>

          {/* Food Items List */}
          <div className="food-items-list-new">
            {filteredItems.length === 0 ? (
              <div className="no-results-message">
                No food items found. Try a different search term.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const categoryColor = item.category && categoryColors
                  ? categoryColors.get(item.category)
                  : '#e5e7eb';

                // Get primary nutrients to display
                const carbsNutrient = item.foodItemNutrients.find(n =>
                  n.nutrient.nutrient_name.toLowerCase().includes('carb')
                );
                const sodiumNutrient = item.foodItemNutrients.find(n =>
                  n.nutrient.nutrient_name.toLowerCase() === 'sodium'
                );

                const nutrientParts = [];
                if (carbsNutrient) {
                  nutrientParts.push(`${Math.round(carbsNutrient.quantity)}g carbs`);
                }
                if (sodiumNutrient) {
                  const sodiumValue = sodiumNutrient.unit === 'g'
                    ? Math.round(sodiumNutrient.quantity * 1000)
                    : Math.round(sodiumNutrient.quantity);
                  nutrientParts.push(`${sodiumValue}mg sodium`);
                }
                const nutrientText = nutrientParts.join(' • ');

                return (
                  <div
                    key={item.id}
                    className={`food-item-new ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <div className="food-item-color-bar" style={{ backgroundColor: categoryColor }}></div>
                    <div className="food-item-content-new">
                      <div className="food-item-header-new">
                        <h3 className="food-item-name-new">{item.item_name}</h3>
                        <div className="food-item-price-section">
                          <i className="pi pi-star-fill" style={{ fontSize: '0.875rem', color: '#fbbf24' }}></i>
                          <span className="food-item-price">${(item.cost || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="food-item-details-new">
                        {item.category && (
                          <span
                            className="food-item-category-badge"
                            style={{
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor
                            }}
                          >
                            {item.category.charAt(0) + item.category.slice(1).toLowerCase().replace(/_/g, ' ')}
                          </span>
                        )}
                        {nutrientText && (
                          <span className="food-item-nutrients-text">{nutrientText}</span>
                        )}
                      </div>
                    </div>
                    <div className="food-item-check-container">
                      {isSelected && (
                        <div className="food-item-checkmark">
                          <i className="pi pi-check"></i>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Footer Button */}
        <div className="modal-footer-sticky">
          <button onClick={handleAddToTimeline} className="add-to-timeline-btn">
            <i className="pi pi-check"></i>
            <span>Add to Timeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
