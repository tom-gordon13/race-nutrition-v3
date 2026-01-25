import { useState, useEffect } from 'react';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import '../shared/ModalSheet.css';

export type ItemFilterMode = 'my_items' | 'favorites' | 'all_items';

export interface RepeatConfig {
  enabled: boolean;
  cadenceMinutes: number;
  endTime: number | null;
}

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
  onRepeat?: (foodItemId: string, startTime: number, servings: number, repeatConfig: RepeatConfig) => void;
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
  onRepeat,
  onCategoryFilterChange,
  onMyItemsOnlyChange,
  onItemFilterModeChange,
  categoryColors
}: FoodItemSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [servings, setServings] = useState<number | string>(1);
  const [editedTime, setEditedTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Repeat functionality state
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [cadenceMinutes, setCadenceMinutes] = useState<number>(15);
  const [cadenceInput, setCadenceInput] = useState<string>('15');
  const [endTimeInput, setEndTimeInput] = useState<string>('');
  const [showRepeatPreview, setShowRepeatPreview] = useState(false);

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
      setRepeatEnabled(false);
      setCadenceMinutes(15);
      setCadenceInput('15');
      setEndTimeInput('');
      setShowRepeatPreview(false);
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

  const calculateRepeatInstances = () => {
    if (!repeatEnabled) return [];

    const timeSeconds = parseTimeHHMM(editedTime);
    const endTime = endTimeInput ? parseTimeHHMM(endTimeInput) : eventDuration;
    const cadenceSeconds = cadenceMinutes * 60;

    const instances = [];
    let currentTime = timeSeconds;

    while (currentTime <= endTime && currentTime <= eventDuration) {
      instances.push({
        time: currentTime,
        timeFormatted: formatTimeHHMM(currentTime),
        servings: typeof servings === 'string' ? parseFloat(servings) : servings,
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

  const handleAddToTimeline = () => {
    // Don't allow click if repeat is enabled but cadence is invalid
    if (isRepeatButtonDisabled()) {
      return;
    }

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

    onSelect(selectedItemId, servingsNum, timeSeconds);
    setSelectedItemId(null);
    setError(null);
  };

  const handleConfirmRepeat = async () => {
    if (!selectedItemId || !onRepeat) return;

    const timeSeconds = parseTimeHHMM(editedTime);
    const endTime = endTimeInput ? parseTimeHHMM(endTimeInput) : null;
    const servingsNum = typeof servings === 'string' ? parseFloat(servings) : servings;

    try {
      await onRepeat(selectedItemId, timeSeconds, servingsNum, {
        enabled: true,
        cadenceMinutes,
        endTime,
      });
      setSelectedItemId(null);
      setError(null);
      setShowRepeatPreview(false);
      onClose();
    } catch (err) {
      setError('Failed to create repeated instances');
      setShowRepeatPreview(false);
    }
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

          {/* Repeat Functionality Section */}
          {onRepeat && (
            <div style={{ padding: '0 1.25rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>REPEAT ITEM</label>
                <InputSwitch
                  checked={repeatEnabled}
                  onChange={(e) => {
                    setRepeatEnabled(e.value);
                    setError(null);
                  }}
                  style={{ transform: 'scale(0.8)' }}
                />
              </div>

              {repeatEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Cadence Input */}
                  <div style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Repeat every</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>minutes</span>
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
                  <div style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>End time (optional)</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>HH:MM</span>
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
                      `Will repeat from ${editedTime} to ${endTimeInput} every ${cadenceMinutes} minutes`
                    ) : (
                      `Will repeat from ${editedTime} until end of event every ${cadenceMinutes} minutes`
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
          <button
            onClick={handleAddToTimeline}
            className="add-to-timeline-btn"
            disabled={isRepeatButtonDisabled()}
            style={{
              opacity: isRepeatButtonDisabled() ? 0.5 : 1,
              cursor: isRepeatButtonDisabled() ? 'not-allowed' : 'pointer'
            }}
          >
            <i className="pi pi-check"></i>
            <span>{repeatEnabled ? 'Preview Repeat' : 'Add to Timeline'}</span>
          </button>
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
                  {selectedItemId && foodItems.find(item => item.id === selectedItemId)?.item_name}
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
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={() => setShowRepeatPreview(false)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    borderRadius: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRepeat}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    borderRadius: '0.75rem',
                    backgroundColor: '#6366f1',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5558e3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6366f1';
                  }}
                >
                  Create {calculateRepeatInstances().length} Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
