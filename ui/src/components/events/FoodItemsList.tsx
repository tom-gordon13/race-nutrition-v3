import { useState, type DragEvent } from 'react';

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

interface FoodItemsListProps {
  foodItems: FoodItem[];
  categoryFilter: string;
  myItemsOnly: boolean;
  loadingFoodItems: boolean;
  onCategoryFilterChange: (category: string) => void;
  onMyItemsOnlyChange: (checked: boolean) => void;
  onFoodItemDragStart: (e: DragEvent, foodItemId: string) => void;
  onFoodItemDragEnd: () => void;
}

const FOOD_CATEGORIES = [
  'ALL',
  'ENERGY_GEL',
  'ENERGY_BAR',
  'SPORTS_DRINK',
  'FRUIT',
  'SNACK',
  'OTHER'
] as const;

export const FoodItemsList = ({
  foodItems,
  categoryFilter,
  myItemsOnly,
  loadingFoodItems,
  onCategoryFilterChange,
  onMyItemsOnlyChange,
  onFoodItemDragStart,
  onFoodItemDragEnd
}: FoodItemsListProps) => {
  const [hoveredFoodItemId, setHoveredFoodItemId] = useState<string | null>(null);

  const filteredItems = categoryFilter === 'ALL'
    ? foodItems
    : foodItems.filter(item => item.category === categoryFilter);

  return (
    <>
      <div className="food-filters-container">
        <div className="my-items-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={myItemsOnly}
              onChange={(e) => onMyItemsOnlyChange(e.target.checked)}
            />
            <span className="checkbox-text">My items only</span>
          </label>
        </div>

        <div className="category-filter-container">
          <label htmlFor="category-filter" className="category-filter-label">Category:</label>
          <select
            id="category-filter"
            className="category-filter-select"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
          >
            {FOOD_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category === 'ALL' ? 'All Categories' : category.toLowerCase().replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p>Total Food Items: {filteredItems.length}</p>

      {loadingFoodItems ? (
        <p>Loading food items...</p>
      ) : filteredItems.length === 0 ? (
        <p>No food items found.</p>
      ) : (
        <div className="food-items-grid">
          {filteredItems.map((item) => {
            // Find carbohydrates and sodium
            const carbs = item.foodItemNutrients.find(
              fin => fin.nutrient.nutrient_name.toLowerCase().includes('carbohydrate')
            );
            const sodium = item.foodItemNutrients.find(
              fin => fin.nutrient.nutrient_name.toLowerCase().includes('sodium')
            );

            return (
              <div
                key={item.id}
                className="draggable-food-item"
                draggable
                onDragStart={(e) => onFoodItemDragStart(e, item.id)}
                onDragEnd={onFoodItemDragEnd}
                onMouseEnter={() => setHoveredFoodItemId(item.id)}
                onMouseLeave={() => setHoveredFoodItemId(null)}
              >
                <div className="food-item-content">
                  <div className="drag-handle">⋮⋮</div>
                  <div className="food-item-name">
                    {item.item_name}{item.brand && ` - ${item.brand}`}
                  </div>

                  <div className="food-item-nutrients">
                    {carbs && (
                      <div className="food-item-nutrient">
                        Carbs: {carbs.quantity}{carbs.unit}
                      </div>
                    )}
                    {sodium && (
                      <div className="food-item-nutrient">
                        Sodium: {sodium.quantity}{sodium.unit}
                      </div>
                    )}
                  </div>
                </div>

                {hoveredFoodItemId === item.id && (
                  <div className="food-instance-tooltip" style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '0.5rem' }}>
                    <div className="tooltip-header">
                      <strong>{item.item_name}</strong>
                      {item.brand && <div className="tooltip-brand">{item.brand}</div>}
                      {item.category && <div className="tooltip-category">{item.category.toLowerCase().replace(/_/g, ' ')}</div>}
                    </div>

                    <div className="tooltip-nutrients">
                      <div className="tooltip-section-title">Nutrients (per serving)</div>
                      {item.foodItemNutrients.map((fin) => (
                        <div key={fin.id} className="tooltip-nutrient-row">
                          <span className="nutrient-name">{fin.nutrient.nutrient_name}</span>
                          <span className="nutrient-amount">
                            {fin.quantity} {fin.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
