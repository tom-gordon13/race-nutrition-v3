import { useState, type DragEvent } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

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

  const categoryOptions = FOOD_CATEGORIES.map((category) => ({
    label: category === 'ALL' ? 'All Categories' : category.toLowerCase().replace(/_/g, ' '),
    value: category
  }));

  return (
    <>
      <div className="food-filters-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div className="my-items-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            inputId="my-items-checkbox"
            checked={myItemsOnly}
            onChange={(e) => onMyItemsOnlyChange(e.checked || false)}
          />
          <label htmlFor="my-items-checkbox" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 500 }}>
            My items only
          </label>
        </div>

        <div className="category-filter-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="category-filter" style={{ color: '#646cff', fontWeight: 500 }}>Category:</label>
          <Dropdown
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.value)}
            options={categoryOptions}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Tag value={`Total Food Items: ${filteredItems.length}`} severity="info" />
      </div>

      {loadingFoodItems ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '1rem' }}>No food items found.</p>
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
