import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './FoodItems.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const FOOD_CATEGORIES = [
  'ENERGY_GEL',
  'ENERGY_BAR',
  'SPORTS_DRINK',
  'FRUIT',
  'SNACK',
  'OTHER'
] as const;

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ENERGY_GEL': 'Gel',
  'ENERGY_BAR': 'Bar',
  'SPORTS_DRINK': 'Drink',
  'FRUIT': 'Fruit',
  'SNACK': 'Snack',
  'OTHER': 'Other'
};

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface EditableFoodItemNutrient {
  id?: string;
  nutrient_id: string;
  quantity: number | string;
  unit: string;
}

interface FoodItemNutrient {
  id: string;
  quantity: number;
  unit: string;
  nutrient: Nutrient;
}

interface FoodItem {
  id: string;
  item_name: string;
  brand?: string | null;
  category?: string | null;
  cost?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  foodItemNutrients: FoodItemNutrient[];
}

interface FoodItemsProps {
  refreshTrigger?: number;
}

const FoodItems = ({ refreshTrigger }: FoodItemsProps) => {
  const { user } = useAuth0();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myItemsOnly, setMyItemsOnly] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editedData, setEditedData] = useState<Partial<FoodItem>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [availableNutrients, setAvailableNutrients] = useState<Nutrient[]>([]);
  const [editedNutrients, setEditedNutrients] = useState<EditableFoodItemNutrient[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [favoriteFoodItemIds, setFavoriteFoodItemIds] = useState<Set<string>>(new Set());

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch available nutrients
  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);
        if (!response.ok) throw new Error('Failed to fetch nutrients');
        const data = await response.json();
        setAvailableNutrients(data.nutrients);
      } catch (err) {
        console.error('Error fetching nutrients:', err);
      }
    };

    fetchNutrients();
  }, []);

  // Fetch current user's UUID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(`${API_URL}/api/users?auth0_sub=${encodeURIComponent(user.sub)}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        } else {
          console.error('Failed to fetch current user:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, [user]);

  // Fetch favorite food items
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(
          `${API_URL}/api/favorite-food-items?auth0_sub=${encodeURIComponent(user.sub)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        const favoriteIds = new Set(data.favorites.map((fav: any) => fav.food_item_id));
        setFavoriteFoodItemIds(favoriteIds);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };

    fetchFavorites();
  }, [user, refreshTrigger]);

  useEffect(() => {
    const fetchFoodItems = async () => {
      if (!user || !user.sub) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user.sub)}&my_items_only=${myItemsOnly}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch food items');
        }

        const data = await response.json();
        setFoodItems(data.foodItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching food items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, [user, refreshTrigger, myItemsOnly]);

  // Template for nutrients column
  const nutrientsBodyTemplate = (rowData: FoodItem) => {
    if (rowData.foodItemNutrients.length === 0) {
      return <Tag severity="secondary" value="No nutrients" />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {rowData.foodItemNutrients.map((fin) => (
          <div key={fin.id} style={{ fontSize: '0.9rem' }}>
            <strong>{fin.nutrient.nutrient_name}</strong>: {fin.quantity} {fin.unit}
          </div>
        ))}
      </div>
    );
  };

  // Check if user owns this food item
  const isOwnedByUser = (rowData: FoodItem) => {
    if (!currentUserId) {
      console.log('No currentUserId');
      return false;
    }
    const isOwned = String(currentUserId) === String(rowData.created_by);
    console.log('Ownership check:', { currentUserId, created_by: rowData.created_by, isOwned });
    return isOwned;
  };

  // Handle edit start
  const handleEditStart = useCallback((rowData: FoodItem) => {
    console.log('Opening edit dialog for:', rowData.item_name);
    setEditingItem(rowData);
    setEditedData({
      item_name: rowData.item_name,
      brand: rowData.brand || '',
      category: rowData.category || '',
      cost: rowData.cost || 0
    });

    // Convert existing nutrients to editable format
    const existingNutrients: EditableFoodItemNutrient[] = rowData.foodItemNutrients.map(fin => ({
      id: fin.id,
      nutrient_id: fin.nutrient.id,
      quantity: fin.quantity,
      unit: fin.unit || 'g'
    }));

    // If no nutrients exist, add an empty row
    setEditedNutrients(existingNutrients.length > 0 ? existingNutrients : [{ nutrient_id: '', quantity: '', unit: 'g' }]);
    setIsEditingCost(false);
    setShowEditDialog(true);
  }, []);

  // Nutrient management functions
  const addNutrientRow = () => {
    setEditedNutrients([...editedNutrients, { nutrient_id: '', quantity: '', unit: 'g' }]);
  };

  const removeNutrientRow = (index: number) => {
    const updated = editedNutrients.filter((_, i) => i !== index);
    setEditedNutrients(updated);
  };

  const updateNutrient = (index: number, field: keyof EditableFoodItemNutrient, value: string | number) => {
    const updated = [...editedNutrients];
    updated[index] = { ...updated[index], [field]: value };
    setEditedNutrients(updated);
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      // Filter out empty nutrient rows
      const validNutrients = editedNutrients.filter(
        n => n.nutrient_id && n.quantity && n.unit
      ).map(n => ({
        id: n.id,
        nutrient_id: n.nutrient_id,
        quantity: parseFloat(n.quantity.toString()),
        unit: n.unit
      }));

      const payload = {
        ...editedData,
        nutrients: validNutrients
      };

      const response = await fetch(`${API_URL}/api/food-items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update food item');
      }

      // Close dialog and reset state
      setShowEditDialog(false);
      setEditingItem(null);
      setEditedData({});
      setEditedNutrients([]);
      setIsEditingCost(false);

      // Trigger a re-fetch
      const fetchResponse = await fetch(
        `${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user!.sub!)}&my_items_only=${myItemsOnly}`
      );
      const data = await fetchResponse.json();
      setFoodItems(data.foodItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update food item');
      console.error('Error updating food item:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setShowEditDialog(false);
    setEditingItem(null);
    setEditedData({});
    setEditedNutrients([]);
    setIsEditingCost(false);
  }, []);

  // Template for brand column
  const brandBodyTemplate = (rowData: FoodItem) => {
    return rowData.brand || <Tag severity="secondary" value="N/A" />;
  };

  // Template for category column
  const categoryBodyTemplate = (rowData: FoodItem) => {
    if (!rowData.category) {
      return <Tag severity="secondary" value="N/A" />;
    }
    const displayName = CATEGORY_DISPLAY_NAMES[rowData.category] || rowData.category;
    return displayName;
  };

  // Template for cost column
  const costBodyTemplate = (rowData: FoodItem) => {
    if (rowData.cost === null || rowData.cost === undefined) {
      return <Tag severity="secondary" value="N/A" />;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(rowData.cost);
  };

  // Toggle favorite status
  const handleToggleFavorite = async (foodItemId: string) => {
    if (!user || !user.sub) return;

    const isFavorite = favoriteFoodItemIds.has(foodItemId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `${API_URL}/api/favorite-food-items/${foodItemId}?auth0_sub=${encodeURIComponent(user.sub)}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }

        setFavoriteFoodItemIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(foodItemId);
          return newSet;
        });
      } else {
        // Add to favorites
        const response = await fetch(`${API_URL}/api/favorite-food-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth0_sub: user.sub,
            food_item_id: foodItemId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add favorite');
        }

        setFavoriteFoodItemIds(prev => new Set(prev).add(foodItemId));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  // Template for actions column
  const actionsBodyTemplate = (rowData: FoodItem) => {
    // If we're in "My Items" mode, all items are owned by the user
    if (!myItemsOnly && !isOwnedByUser(rowData)) {
      return null;
    }

    return (
      <Button
        label="Edit"
        icon="pi pi-pencil"
        onClick={() => handleEditStart(rowData)}
        size="small"
        style={{ backgroundColor: '#646cff', borderColor: '#646cff' }}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view your food items.</div>;
  }

  const headerContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#000000' }}>
          {myItemsOnly ? 'My Food Items' : 'All Food Items'}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setMyItemsOnly(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: myItemsOnly ? '#646cff' : 'rgba(0, 0, 0, 0.1)',
              color: myItemsOnly ? 'white' : '#646cff',
              border: `1px solid #646cff`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: myItemsOnly ? 600 : 400
            }}
          >
            My Items
          </button>
          <button
            onClick={() => setMyItemsOnly(false)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !myItemsOnly ? '#646cff' : 'rgba(0, 0, 0, 0.1)',
              color: !myItemsOnly ? 'white' : '#646cff',
              border: `1px solid #646cff`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: !myItemsOnly ? 600 : 400
            }}
          >
            All Items
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      header={headerContent}
      className="food-items-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db' }}
      pt={{
        header: { style: { textAlign: 'left', padding: '1rem 1.5rem', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' } },
        body: { style: { flex: 1, overflow: 'auto', padding: 0, backgroundColor: 'white' } },
        content: { style: { padding: '0 1.5rem 1.5rem 1.5rem' } }
      }}
    >
      {foodItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '2rem' }}>
          No food items found. Create your first food item above!
        </p>
      ) : (
        <DataTable
          value={foodItems}
          stripedRows
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage="No food items found."
          scrollable
          scrollHeight="flex"
        >
          <Column
            header="Food Item"
            field="item_name"
            sortable
            sortField="item_name"
            style={{ minWidth: '200px' }}
          />
          <Column
            header="Brand"
            body={brandBodyTemplate}
            sortable
            sortField="brand"
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Category"
            body={categoryBodyTemplate}
            sortable
            sortField="category"
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Cost"
            body={costBodyTemplate}
            sortable
            sortField="cost"
            style={{ minWidth: '100px' }}
          />
          <Column
            header="Nutrients"
            body={nutrientsBodyTemplate}
            style={{ minWidth: '300px' }}
          />
          <Column
            header="Actions"
            body={actionsBodyTemplate}
            style={{ minWidth: '150px' }}
          />
        </DataTable>
      )}

      {foodItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '1rem 0' }}>
          <Tag value={`Total: ${foodItems.length}`} severity="info" />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        header=""
        visible={showEditDialog}
        className="food-item-edit-dialog"
        style={{
          width: isMobile ? '100%' : '700px',
          maxHeight: '90vh',
          borderRadius: '20px'
        }}
        onHide={handleEditCancel}
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
                EDITING
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#000',
                lineHeight: 1.2
              }}>
                {editedData.item_name || 'Food Item'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                icon={editingItem && favoriteFoodItemIds.has(editingItem.id) ? "pi pi-star-fill" : "pi pi-star"}
                onClick={() => editingItem && handleToggleFavorite(editingItem.id)}
                rounded
                text
                style={{
                  width: '40px',
                  height: '40px',
                  color: editingItem && favoriteFoodItemIds.has(editingItem.id) ? '#fbbf24' : '#9ca3af',
                }}
                pt={{
                  icon: { style: { fontSize: '1.25rem' } }
                }}
              />
              <button
                onClick={handleEditCancel}
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

            {/* Food Name */}
            <InputText
              value={editedData.item_name || ''}
              onChange={(e) => setEditedData({ ...editedData, item_name: e.target.value })}
              style={{
                width: '100%',
                fontSize: '1.125rem',
                fontWeight: 700,
                border: 'none',
                borderBottom: '2px solid #e5e7eb',
                borderRadius: 0,
                padding: '0.375rem 0',
                outline: 'none'
              }}
            />

            {/* Category and Brand */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Category
                </div>
                <Dropdown
                  value={editedData.category || ''}
                  onChange={(e) => setEditedData({ ...editedData, category: e.value })}
                  options={FOOD_CATEGORIES.map((cat) => ({
                    label: CATEGORY_DISPLAY_NAMES[cat] || cat,
                    value: cat
                  }))}
                  placeholder="Select category"
                  style={{
                    width: '100%',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                  pt={{
                    input: { style: { fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#f3f4f6' } },
                    trigger: { style: { color: '#000' } }
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Brand
                </div>
                <InputText
                  value={editedData.brand || ''}
                  onChange={(e) => setEditedData({ ...editedData, brand: e.target.value })}
                  placeholder="Add brand"
                  style={{
                    width: '100%',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.625rem',
                    fontSize: '0.875rem',
                    color: editedData.brand ? '#000' : '#9ca3af'
                  }}
                />
              </div>
            </div>
          </div>

          {/* COST PER SERVING Section */}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!isEditingCost ? (
                <div style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: '#000'
                }}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(editedData.cost || 0)}
                </div>
              ) : (
                <InputNumber
                  value={editedData.cost || 0}
                  onValueChange={(e) => setEditedData({ ...editedData, cost: e.value || 0 })}
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  onBlur={() => setIsEditingCost(false)}
                  autoFocus
                  inputStyle={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    border: 'none',
                    borderBottom: '2px solid #6366f1',
                    borderRadius: 0,
                    padding: '0.25rem 0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              )}
              <Button
                label="Edit"
                onClick={() => setIsEditingCost(true)}
                style={{
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  color: '#6b7280',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* NUTRIENTS Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.1em'
              }}>
                NUTRIENTS
              </div>
              <Button
                label="Add"
                icon="pi pi-plus"
                onClick={addNutrientRow}
                style={{
                  backgroundColor: '#6366f1',
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  padding: '0.5rem 0.875rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Nutrient List */}
            {editedNutrients.map((nutrient, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}
                >
                  {/* Nutrient Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    <Dropdown
                      value={nutrient.nutrient_id}
                      onChange={(e) => {
                        updateNutrient(index, 'nutrient_id', e.value);
                        // Default to 'g' if unit not set
                        if (!nutrient.unit) {
                          updateNutrient(index, 'unit', 'g');
                        }
                      }}
                      options={availableNutrients.map((n) => ({
                        label: n.nutrient_name,
                        value: n.id
                      }))}
                      placeholder="Select nutrient"
                      style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}
                      pt={{
                        input: { style: {
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#000',
                          padding: 0,
                          border: 'none'
                        }},
                        trigger: { style: { display: 'none' } }
                      }}
                    />
                  </div>

                  {/* Quantity with unit label */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flexShrink: 0
                  }}>
                    <InputNumber
                      value={typeof nutrient.quantity === 'string' ? parseFloat(nutrient.quantity) || undefined : nutrient.quantity}
                      onValueChange={(e) => {
                        updateNutrient(index, 'quantity', e.value || '');
                        // Ensure unit is set
                        if (!nutrient.unit) {
                          updateNutrient(index, 'unit', 'g');
                        }
                      }}
                      placeholder="0"
                      minFractionDigits={0}
                      maxFractionDigits={2}
                      inputStyle={{
                        width: '50px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textAlign: 'right',
                        padding: '0.4rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#6b7280'
                    }}>
                      g
                    </span>
                  </div>

                  {/* Delete Button */}
                  {editedNutrients.length > 1 && (
                    <Button
                      icon="pi pi-trash"
                      onClick={() => removeNutrientRow(index)}
                      text
                      rounded
                      severity="danger"
                      style={{
                        color: '#ef4444',
                        flexShrink: 0,
                        padding: '0.25rem',
                        margin: 0,
                        minWidth: 'auto',
                        width: '1.5rem',
                        height: '1.5rem'
                      }}
                      pt={{
                        root: { style: { padding: 0, margin: 0 } },
                        icon: { style: { fontSize: '0.875rem' } }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0' }}>
            <Button
              label="Cancel"
              onClick={handleEditCancel}
              style={{
                flex: 1,
                backgroundColor: '#d1d5db',
                border: 'none',
                color: '#6b7280',
                fontWeight: 600,
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.9375rem'
              }}
            />
            <Button
              label="Save Changes"
              onClick={handleEditSave}
              loading={saving}
              disabled={!editedData.item_name}
              style={{
                flex: 1,
                backgroundColor: '#1f2937',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.9375rem'
              }}
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default FoodItems;
