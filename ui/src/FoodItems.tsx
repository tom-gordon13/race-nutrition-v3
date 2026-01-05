import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { API_URL } from './config/api';

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

// Map nutrient names to their standard units
const getNutrientUnit = (nutrientName: string): string => {
  const name = nutrientName.toLowerCase();

  // Milligram nutrients
  if (name.includes('sodium') ||
      name.includes('potassium') ||
      name.includes('caffeine') ||
      name.includes('calcium') ||
      name.includes('iron') ||
      name.includes('magnesium') ||
      name.includes('zinc') ||
      name.includes('vitamin')) {
    return 'mg';
  }

  // Gram nutrients (default for most macros)
  return 'g';
};

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

type ViewMode = 'my_items' | 'all_items' | 'favorites';

const FoodItems = ({ refreshTrigger }: FoodItemsProps) => {
  const { user } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('my_items');
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
  const [favoriteFoodItems, setFavoriteFoodItems] = useState<FoodItem[]>([]);

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
        const favoriteIds = new Set<string>(data.favorites.map((fav: any) => fav.food_item_id as string));
        const favItems: FoodItem[] = data.favorites.map((fav: any) => fav.foodItem);
        setFavoriteFoodItemIds(favoriteIds);
        setFavoriteFoodItems(favItems);
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

      // If we're in favorites mode, use the favorited items instead
      if (viewMode === 'favorites') {
        setFoodItems(favoriteFoodItems);
        setLoading(false);
        return;
      }

      try {
        const myItemsOnly = viewMode === 'my_items';
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
  }, [user, refreshTrigger, viewMode, favoriteFoodItems]);

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
      return false;
    }
    const isOwned = String(currentUserId) === String(rowData.created_by);
    return isOwned;
  };

  // Open edit dialog (without navigation) - internal function
  const openEditDialog = useCallback((rowData: FoodItem) => {
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
    setEditedNutrients(existingNutrients.length > 0 ? existingNutrients : [{ nutrient_id: '', quantity: '', unit: '' }]);
    setIsEditingCost(false);
    setShowEditDialog(true);
  }, []);

  // Handle edit start (with navigation) - called from UI
  const handleEditStart = useCallback((rowData: FoodItem) => {
    openEditDialog(rowData);
    // Update URL to include the food item ID
    navigate(`/food-items/${rowData.id}`, { replace: true });
  }, [navigate, openEditDialog]);

  // Handle URL parameter for opening specific food item
  useEffect(() => {
    if (!id || !user || !user.sub || showEditDialog) return;

    const fetchAndOpenFoodItem = async () => {
      try {
        // Fetch the specific food item by ID
        const response = await fetch(
          `${API_URL}/api/food-items/${id}?auth0_sub=${encodeURIComponent(user.sub!)}`
        );

        if (response.ok) {
          const data = await response.json();
          const foodItem = data.foodItem;

          // Open the edit dialog for this food item (without navigating again)
          openEditDialog(foodItem);
        } else if (response.status === 404) {
          // Food item not found, redirect to /food-items
          navigate('/food-items', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching food item by ID:', err);
        navigate('/food-items', { replace: true });
      }
    };

    fetchAndOpenFoodItem();
  }, [id, user, openEditDialog, navigate]);

  // Nutrient management functions
  const addNutrientRow = () => {
    setEditedNutrients([...editedNutrients, { nutrient_id: '', quantity: '', unit: '' }]);
  };

  const removeNutrientRow = (index: number) => {
    const updated = editedNutrients.filter((_, i) => i !== index);
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

      // Navigate back to /food-items
      navigate('/food-items', { replace: true });

      // Trigger a re-fetch
      if (viewMode === 'favorites') {
        // Re-fetch favorites
        const favResponse = await fetch(
          `${API_URL}/api/favorite-food-items?auth0_sub=${encodeURIComponent(user!.sub!)}`
        );
        const favData = await favResponse.json();
        const favItems: FoodItem[] = favData.favorites.map((fav: any) => fav.foodItem);
        setFavoriteFoodItems(favItems);
        setFoodItems(favItems);
      } else {
        const myItemsOnly = viewMode === 'my_items';
        const fetchResponse = await fetch(
          `${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user!.sub!)}&my_items_only=${myItemsOnly}`
        );
        const data = await fetchResponse.json();
        setFoodItems(data.foodItems);
      }
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

    // Navigate back to /food-items when closing the dialog
    navigate('/food-items', { replace: true });
  }, [navigate]);

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

  // Handle row click to open edit dialog
  const handleRowClick = (e: any) => {
    const rowData = e.data as FoodItem;
    handleEditStart(rowData);
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
          {viewMode === 'my_items' ? 'My Food Items' : viewMode === 'all_items' ? 'All Food Items' : 'Favorite Food Items'}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('my_items')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'my_items' ? '#646cff' : 'rgba(0, 0, 0, 0.1)',
              color: viewMode === 'my_items' ? 'white' : '#646cff',
              border: `1px solid #646cff`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: viewMode === 'my_items' ? 600 : 400
            }}
          >
            My Items
          </button>
          <button
            onClick={() => setViewMode('all_items')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'all_items' ? '#646cff' : 'rgba(0, 0, 0, 0.1)',
              color: viewMode === 'all_items' ? 'white' : '#646cff',
              border: `1px solid #646cff`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: viewMode === 'all_items' ? 600 : 400
            }}
          >
            All Items
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'favorites' ? '#646cff' : 'rgba(0, 0, 0, 0.1)',
              color: viewMode === 'favorites' ? 'white' : '#646cff',
              border: `1px solid #646cff`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: viewMode === 'favorites' ? 600 : 400
            }}
          >
            Favorites
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      header={headerContent}
      className="food-items-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', borderRadius: '0', border: 'none' }}
      pt={{
        header: { style: { textAlign: 'left', padding: '1rem 2rem', backgroundColor: 'transparent', borderBottom: 'none' } },
        body: { style: { flex: 1, overflow: 'auto', padding: 0, backgroundColor: 'white' } },
        content: { style: { padding: '0 2rem 2rem 2rem' } }
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
          onRowClick={handleRowClick}
          selectionMode="single"
          style={{ cursor: 'pointer' }}
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
                {editingItem && isOwnedByUser(editingItem) ? 'EDITING' : 'VIEWING'}
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
              disabled={!editingItem || !isOwnedByUser(editingItem)}
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
                  disabled={!editingItem || !isOwnedByUser(editingItem)}
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
                  disabled={!editingItem || !isOwnedByUser(editingItem)}
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
              {editingItem && isOwnedByUser(editingItem) && (
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
              )}
            </div>
          </div>

          {/* NUTRIENTS Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0.5rem',
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
              {editingItem && isOwnedByUser(editingItem) && (
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
              )}
            </div>

            {/* Nutrient List */}
            {editedNutrients.map((nutrient, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}
                >
                  {/* Nutrient Info */}
                  <div style={{ flex: 2, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    <Dropdown
                      value={availableNutrients.find(n => n.id === nutrient.nutrient_id) || null}
                      onChange={(e) => {
                        if (e.value && e.value.id) {
                          const unit = getNutrientUnit(e.value.nutrient_name);
                          const updated = [...editedNutrients];
                          updated[index] = {
                            ...updated[index],
                            nutrient_id: e.value.id,
                            unit: unit
                          };
                          setEditedNutrients(updated);
                        }
                      }}
                      options={availableNutrients}
                      optionLabel="nutrient_name"
                      placeholder="Select nutrient"
                      disabled={!editingItem || !isOwnedByUser(editingItem)}
                      style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}
                    />
                  </div>

                  {/* Quantity with unit label */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flex: 1,
                    justifyContent: 'flex-end'
                  }}>
                    <InputNumber
                      value={typeof nutrient.quantity === 'string' ? parseFloat(nutrient.quantity) || null : (nutrient.quantity || null)}
                      onValueChange={(e) => {
                        const updated = [...editedNutrients];
                        updated[index] = {
                          ...updated[index],
                          quantity: e.value ?? ''
                        };
                        setEditedNutrients(updated);
                      }}
                      placeholder="0"
                      minFractionDigits={0}
                      maxFractionDigits={2}
                      min={0}
                      disabled={!editingItem || !isOwnedByUser(editingItem)}
                      inputStyle={{
                        width: '45px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textAlign: 'right',
                        padding: '0.25rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#6b7280',
                      minWidth: '30px'
                    }}>
                      {nutrient.unit || '-'}
                    </span>
                  </div>

                  {/* Delete Button */}
                  {editingItem && isOwnedByUser(editingItem) && (
                    <Button
                      icon="pi pi-trash"
                      onClick={() => removeNutrientRow(index)}
                      text
                      rounded
                      severity="danger"
                      style={{
                        color: '#ef4444',
                        flexShrink: 0,
                        padding: 0,
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
            {editingItem && isOwnedByUser(editingItem) ? (
              <>
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
              </>
            ) : (
              <Button
                label="Close"
                onClick={handleEditCancel}
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
            )}
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default FoodItems;
