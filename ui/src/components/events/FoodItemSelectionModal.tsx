import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type ItemFilterMode = 'my_items' | 'favorites';

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
  categoryFilter,
  myItemsOnly,
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
  const [servings, setServings] = useState('1');
  const [editedTime, setEditedTime] = useState('');

  // Initialize editedTime when modal opens or timeInSeconds changes
  useEffect(() => {
    if (isOpen) {
      setEditedTime(formatTimeHHMM(timeInSeconds));
    }
  }, [isOpen, timeInSeconds]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setServings('1');
      setEditedTime('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    const servingsNum = parseFloat(servings);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      alert('Please enter valid servings');
      return;
    }

    const timeSeconds = parseTimeHHMM(editedTime);
    if (isNaN(timeSeconds)) {
      alert('Please enter valid time in HH:MM format');
      return;
    }

    onSelect(foodItemId, servingsNum, timeSeconds);
  };

  const handleCreateNewFoodItem = () => {
    navigate('/food-items');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Food Item</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-search-section">
            {/* Time input at the top */}
            <div className="modal-time-input-wrapper">
              <label>Time (HH:MM):</label>
              <input
                type="text"
                className="modal-time-input"
                value={editedTime}
                onChange={(e) => setEditedTime(e.target.value)}
                placeholder="HH:MM"
              />
            </div>

            <input
              type="text"
              className="modal-search-input"
              placeholder="Search food items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />

            {/* Filter section */}
            <div className="modal-filters">
              <div className="my-items-filter">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    className="checkbox-input"
                    name="item-filter"
                    checked={itemFilterMode === 'my_items'}
                    onChange={() => {
                      onItemFilterModeChange('my_items');
                      onMyItemsOnlyChange(true);
                    }}
                  />
                  <span className="checkbox-text">My Items Only</span>
                </label>
                <label className="checkbox-label" style={{ marginLeft: '1rem' }}>
                  <input
                    type="radio"
                    className="checkbox-input"
                    name="item-filter"
                    checked={itemFilterMode === 'favorites'}
                    onChange={() => {
                      onItemFilterModeChange('favorites');
                      onMyItemsOnlyChange(false);
                    }}
                  />
                  <span className="checkbox-text">Favorited Items</span>
                </label>
              </div>

              <div className="category-filter-container">
                <label className="category-filter-label">Category:</label>
                <select
                  className="category-filter-select"
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

            <div className="modal-servings-input-wrapper">
              <label>Servings:</label>
              <input
                type="number"
                className="modal-servings-input"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                step="0.5"
                min="0.5"
              />
            </div>
          </div>

          <div className="modal-food-items-list">
            {filteredItems.length === 0 ? (
              <div className="modal-no-results">
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
                  : undefined;

                const borderLeftColor = categoryColor
                  ? categoryColor
                  : undefined;

                return (
                  <div
                    key={item.id}
                    className="modal-food-item"
                    onClick={() => handleSelect(item.id)}
                    style={{
                      backgroundColor,
                      borderLeftColor,
                      borderLeftWidth: borderLeftColor ? '4px' : undefined,
                      borderLeftStyle: borderLeftColor ? 'solid' : undefined
                    }}
                  >
                    <div className="modal-food-item-header">
                      <strong>{item.item_name}</strong>
                      {item.brand && <span className="modal-food-item-brand">{item.brand}</span>}
                    </div>
                    {item.category && (
                      <div className="modal-food-item-category">
                        {item.category.replace(/_/g, ' ')}
                      </div>
                    )}
                    {item.foodItemNutrients && item.foodItemNutrients.length > 0 && (
                      <div className="modal-food-item-nutrients">
                        {item.foodItemNutrients.slice(0, 3).map((nutrient) => (
                          <span key={nutrient.id} className="modal-nutrient-badge">
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
              className="modal-create-food-item-btn"
              onClick={handleCreateNewFoodItem}
            >
              + Create New Food Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
