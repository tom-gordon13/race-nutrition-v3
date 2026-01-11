import { useState, useEffect } from 'react';
import '../shared/ModalSheet.css';

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

interface FoodItemDetailsDialogProps {
  visible: boolean;
  foodItem: FoodItem | null;
  onHide: () => void;
  categoryColors?: Map<string, string>;
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ENERGY_GEL': 'Gel',
  'ENERGY_BAR': 'Bar',
  'SPORTS_DRINK': 'Drink',
  'FRUIT': 'Fruit',
  'SNACK': 'Snack',
  'OTHER': 'Other'
};

export const FoodItemDetailsDialog = ({
  visible,
  foodItem,
  onHide,
  categoryColors
}: FoodItemDetailsDialogProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing for smooth slide-up and slide-down
  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
    }
  };

  if (!foodItem || !shouldRender) return null;

  const categoryColor = foodItem.category && categoryColors
    ? categoryColors.get(foodItem.category)
    : undefined;

  const borderColor = categoryColor || '#646cff';

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
            <p className="modal-header-label">FOOD ITEM DETAILS</p>
            <h2 className="modal-header-title">{foodItem.item_name}</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* BASIC INFO Section */}
          <div className="form-section">
            <label className="form-label">BASIC INFO</label>

            {/* Category and Brand */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {foodItem.category && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#9ca3af',
                    marginBottom: '0.5rem',
                    fontWeight: 500
                  }}>
                    Category
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: categoryColor ? `${categoryColor}1A` : '#f3f4f6',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                    borderLeft: `4px solid ${borderColor}`
                  }}>
                    {CATEGORY_DISPLAY_NAMES[foodItem.category] || foodItem.category}
                  </div>
                </div>
              )}

              {foodItem.brand && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#9ca3af',
                    marginBottom: '0.5rem',
                    fontWeight: 500
                  }}>
                    Brand
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {foodItem.brand}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COST PER SERVING Section */}
          {foodItem.cost !== null && foodItem.cost !== undefined && (
            <div className="form-section">
              <label className="form-label">COST PER SERVING</label>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#111827'
              }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(foodItem.cost)}
              </div>
            </div>
          )}

          {/* NUTRIENTS Section */}
          {foodItem.foodItemNutrients && foodItem.foodItemNutrients.length > 0 && (
            <div className="form-section">
              <label className="form-label">NUTRIENTS (PER SERVING)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {foodItem.foodItemNutrients.map((nutrient) => (
                  <div
                    key={nutrient.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #f3f4f6'
                    }}
                  >
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#111827'
                    }}>
                      {nutrient.nutrient.nutrient_name}
                    </span>
                    <span style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: borderColor
                    }}>
                      {nutrient.quantity} {nutrient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onHide}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '1rem',
              borderRadius: '0.75rem',
              fontSize: '1.0625rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111827';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
