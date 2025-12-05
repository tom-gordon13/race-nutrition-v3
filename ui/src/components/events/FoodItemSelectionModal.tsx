import { useState } from 'react';

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
  onClose: () => void;
  onSelect: (foodItemId: string, servings: number) => void;
  onCategoryFilterChange: (category: string) => void;
  onMyItemsOnlyChange: (myItemsOnly: boolean) => void;
}

const formatTimeHHMM = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const FoodItemSelectionModal = ({
  isOpen,
  foodItems,
  timeInSeconds,
  categoryFilter,
  myItemsOnly,
  onClose,
  onSelect,
  onCategoryFilterChange,
  onMyItemsOnlyChange
}: FoodItemSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [servings, setServings] = useState('1');

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
    onSelect(foodItemId, servingsNum);
    setSearchTerm('');
    setServings('1');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Food Item at {formatTimeHHMM(timeInSeconds)}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-search-section">
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
                    type="checkbox"
                    className="checkbox-input"
                    checked={myItemsOnly}
                    onChange={(e) => onMyItemsOnlyChange(e.target.checked)}
                  />
                  <span className="checkbox-text">My Items Only</span>
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
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="modal-food-item"
                  onClick={() => handleSelect(item.id)}
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
