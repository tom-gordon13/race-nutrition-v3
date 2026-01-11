import { useState, useEffect } from 'react';
import './ItemListDialog.css';
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

interface FoodInstance {
  id: string;
  time_elapsed_at_consumption: number;
  servings: number;
  food_item_id: string;
  event_id: string;
  foodItem: FoodItem;
}

interface ItemCount {
  foodItem: FoodItem;
  count: number;
  totalServings: number;
}

interface ItemListDialogProps {
  visible: boolean;
  foodInstances: FoodInstance[];
  onHide: () => void;
  onItemClick: (foodItem: FoodItem) => void;
  categoryColors?: Map<string, string>;
}

export const ItemListDialog = ({
  visible,
  foodInstances,
  onHide,
  onItemClick,
  categoryColors
}: ItemListDialogProps) => {
  const [itemCounts, setItemCounts] = useState<ItemCount[]>([]);
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

  // Calculate item counts when food instances change
  useEffect(() => {
    const countsMap = new Map<string, ItemCount>();

    foodInstances.forEach(instance => {
      const existing = countsMap.get(instance.food_item_id);
      if (existing) {
        existing.count += 1;
        existing.totalServings += instance.servings;
      } else {
        countsMap.set(instance.food_item_id, {
          foodItem: instance.foodItem,
          count: 1,
          totalServings: instance.servings
        });
      }
    });

    // Convert to array and sort by item name
    const countsArray = Array.from(countsMap.values()).sort((a, b) =>
      a.foodItem.item_name.localeCompare(b.foodItem.item_name)
    );

    setItemCounts(countsArray);
  }, [foodInstances]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onHide();
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 1.25rem',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.125rem',
              textAlign: 'left'
            }}>Items</p>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#111827',
              textAlign: 'left',
              margin: 0
            }}>Item List</h2>
          </div>
          <button
            onClick={onHide}
            className="modal-close-button"
          >
            ✕
          </button>
        </div>

        {/* Item Count Summary */}
        <div style={{
          padding: '0.5rem 1.25rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #f3f4f6',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'left', margin: 0 }}>
            Total: <span style={{ fontWeight: 600, color: '#111827' }}>{itemCounts.length} unique item{itemCounts.length !== 1 ? 's' : ''}</span>
          </p>
        </div>

        <div className="modal-content">
          {itemCounts.length === 0 ? (
            <div style={{ padding: '3rem 1.25rem', textAlign: 'center', color: '#6b7280', fontSize: '1rem' }}>
              No items added to this event yet.
            </div>
          ) : (
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>

              {itemCounts.map((item) => {
                // Get color for this category
                const categoryColor = item.foodItem.category && categoryColors
                  ? categoryColors.get(item.foodItem.category)
                  : undefined;

                const accentColor = categoryColor || '#646cff';

                return (
                  <div
                    key={item.foodItem.id}
                    onClick={() => onItemClick(item.foodItem)}
                    className="item-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Left accent bar */}
                    <div style={{
                      width: '6px',
                      alignSelf: 'stretch',
                      backgroundColor: accentColor,
                      flexShrink: 0
                    }} />

                    {/* Content */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      paddingLeft: '14px'
                    }}>
                      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          textAlign: 'left',
                          lineHeight: '1.3',
                          margin: 0,
                          padding: 0
                        }}>
                          {item.foodItem.item_name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '2px',
                          textAlign: 'left'
                        }}>
                          {item.foodItem.brand && (
                            <>
                              <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'left', lineHeight: '1' }}>
                                {item.foodItem.brand}
                              </span>
                              {item.foodItem.category && (
                                <span style={{ color: '#d1d5db', textAlign: 'left', fontSize: '12px', lineHeight: '1' }}>•</span>
                              )}
                            </>
                          )}
                          {item.foodItem.category && (
                            <span style={{
                              borderRadius: '3px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: `${accentColor}20`,
                              color: accentColor,
                              textTransform: 'uppercase',
                              textAlign: 'left',
                              letterSpacing: '0.02em',
                              lineHeight: '1'
                            }}>
                              {item.foodItem.category.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right',
                        flexShrink: 0,
                        marginLeft: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end'
                      }}>
                        <p style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: accentColor,
                          textAlign: 'right',
                          lineHeight: '1',
                          margin: 0,
                          padding: 0
                        }}>
                          {item.totalServings}
                        </p>
                        <p style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          textAlign: 'right',
                          marginTop: '1px',
                          lineHeight: '1',
                          margin: 0,
                          padding: 0,
                          paddingTop: '1px'
                        }}>
                          {item.totalServings === 1 ? 'serving' : 'servings'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom padding for safe area */}
              <div style={{ height: '1.5rem' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
