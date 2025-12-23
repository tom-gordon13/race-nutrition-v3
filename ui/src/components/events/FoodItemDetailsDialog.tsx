import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import './FoodItemDetailsDialog.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!foodItem) return null;

  const categoryColor = foodItem.category && categoryColors
    ? categoryColors.get(foodItem.category)
    : undefined;

  const borderColor = categoryColor || '#646cff';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header=""
      className="food-item-details-dialog"
      style={{
        width: isMobile ? '100%' : '600px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
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
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#9ca3af',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem'
            }}>
              FOOD ITEM DETAILS
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              {foodItem.item_name}
            </div>
          </div>
          <button
            onClick={onHide}
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

        {/* BASIC INFO Section */}
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
            BASIC INFO
          </div>

          {/* Category and Brand */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {foodItem.category && (
              <div style={{ flex: 1, minWidth: '150px' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Category
                </div>
                <div style={{
                  padding: '0.625rem',
                  backgroundColor: categoryColor ? `${categoryColor}1A` : '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#000',
                  borderLeft: `4px solid ${borderColor}`
                }}>
                  {CATEGORY_DISPLAY_NAMES[foodItem.category] || foodItem.category}
                </div>
              </div>
            )}

            {foodItem.brand && (
              <div style={{ flex: 1, minWidth: '150px' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Brand
                </div>
                <div style={{
                  padding: '0.625rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#000'
                }}>
                  {foodItem.brand}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COST PER SERVING Section */}
        {foodItem.cost !== null && foodItem.cost !== undefined && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.1em'
            }}>
              COST PER SERVING
            </div>

            <div style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: '#000'
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.1em'
            }}>
              NUTRIENTS (PER SERVING)
            </div>

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
                    borderRadius: '8px'
                  }}
                >
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#000'
                  }}>
                    {nutrient.nutrient.nutrient_name}
                  </span>
                  <span style={{
                    fontSize: '1rem',
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
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={onHide}
            style={{
              width: '100%',
              backgroundColor: '#1f2937',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
};
