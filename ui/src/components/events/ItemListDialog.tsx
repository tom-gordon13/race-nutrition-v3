import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import './ItemListDialog.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [itemCounts, setItemCounts] = useState<ItemCount[]>([]);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const headerContent = (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      backgroundColor: '#f3f4f6',
      borderBottom: '1px solid #d1d5db'
    }}>
      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#000000' }}>
        Item List
      </h3>
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
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={headerContent}
      className="item-list-dialog"
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
        header: { style: { padding: 0, border: 'none' } },
        content: { style: { padding: '1rem 1.5rem', maxHeight: '70vh', overflowY: 'auto' } }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {itemCounts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No items added to this event yet.
          </div>
        ) : (
          <>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Total: {itemCounts.length} unique item{itemCounts.length !== 1 ? 's' : ''}
            </div>

            {itemCounts.map((item) => {
              // Get color for this category
              const categoryColor = item.foodItem.category && categoryColors
                ? categoryColors.get(item.foodItem.category)
                : undefined;

              const backgroundColor = categoryColor
                ? `${categoryColor}1A`
                : 'rgba(100, 108, 255, 0.1)';

              const borderLeftColor = categoryColor || '#646cff';

              return (
                <div
                  key={item.foodItem.id}
                  onClick={() => onItemClick(item.foodItem)}
                  style={{
                    padding: '1rem',
                    backgroundColor,
                    borderLeft: `4px solid ${borderLeftColor}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = categoryColor
                      ? `${categoryColor}33`
                      : 'rgba(100, 108, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = backgroundColor;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#000', marginBottom: '0.25rem' }}>
                      {item.foodItem.item_name}
                    </div>
                    {item.foodItem.brand && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {item.foodItem.brand}
                      </div>
                    )}
                    {item.foodItem.category && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {item.foodItem.category.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: borderLeftColor
                    }}>
                      {item.totalServings}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.totalServings === 1 ? 'serving' : 'servings'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      ({item.count} {item.count === 1 ? 'instance' : 'instances'})
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Dialog>
  );
};
