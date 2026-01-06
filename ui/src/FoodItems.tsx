import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface UserColorPreference {
  id: string;
  user_id: string;
  food_category: string;
  color_id: string;
  color: {
    id: string;
    hex: string;
    color_name: string;
  };
  foodCategory: {
    id: string;
    category_name: string;
  };
}

interface FoodItemsProps {
  refreshTrigger?: number;
  onCreateClick?: () => void;
}

type ViewMode = 'my_items' | 'all_items' | 'favorites';

const FoodItems = ({ refreshTrigger, onCreateClick }: FoodItemsProps) => {
  const { user } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('my_items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
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
  const [colorPreferences, setColorPreferences] = useState<Map<string, string>>(new Map());

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

  // Fetch user color preferences
  useEffect(() => {
    const fetchColorPreferences = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(
          `${API_URL}/api/preferences/user-colors?auth0_sub=${encodeURIComponent(user.sub)}`
        );
        if (!response.ok) return;

        const data = await response.json();
        const prefsMap = new Map<string, string>();

        // Map category names to colors (not IDs)
        data.preferences.forEach((pref: UserColorPreference) => {
          if (pref.foodCategory && pref.foodCategory.category_name) {
            prefsMap.set(pref.foodCategory.category_name, pref.color.hex);
          }
        });

        setColorPreferences(prefsMap);
      } catch (err) {
        console.error('Error fetching color preferences:', err);
      }
    };

    fetchColorPreferences();
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

  // Get category color from user preferences
  const getCategoryColor = (categoryName: string | null | undefined): string => {
    if (!categoryName) return '#9ca3af'; // Default gray
    const color = colorPreferences.get(categoryName);
    return color || '#9ca3af'; // Return user preference or default gray
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

        // If in favorites view mode, also remove from the displayed list
        if (viewMode === 'favorites') {
          setFavoriteFoodItems(prev => prev.filter(item => item.id !== foodItemId));
        }
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

        // If in favorites view mode, re-fetch to get the newly added favorite item
        if (viewMode === 'favorites') {
          const favResponse = await fetch(
            `${API_URL}/api/favorite-food-items?auth0_sub=${encodeURIComponent(user.sub)}`
          );
          if (favResponse.ok) {
            const favData = await favResponse.json();
            const favItems: FoodItem[] = favData.favorites.map((fav: any) => fav.foodItem);
            setFavoriteFoodItems(favItems);
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  // Handle card click to open edit dialog
  const handleCardClick = (foodItem: FoodItem) => {
    handleEditStart(foodItem);
  };

  // Get nutrient value helper
  const getNutrientValue = (foodItem: FoodItem, nutrientName: string): string => {
    const nutrient = foodItem.foodItemNutrients.find(
      n => n.nutrient.nutrient_name.toLowerCase() === nutrientName.toLowerCase()
    );
    return nutrient ? `${nutrient.quantity}${nutrient.unit}` : '0mg';
  };

  // Filter food items based on search term and category
  const filteredFoodItems = foodItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="food-items-page">
      {/* Header */}
      <div className="food-items-header">
        <div className="food-items-title-section">
          <h1 className="food-items-title">Food Items</h1>
          <span className="food-items-count">
            {filteredFoodItems.length}{filteredFoodItems.length !== foodItems.length && ` of ${foodItems.length}`} items
          </span>
        </div>
        <Button
          label="Create New Item"
          icon="pi pi-plus"
          className="add-item-button"
          onClick={onCreateClick}
        />
      </div>

      {/* Tab Navigation */}
      <div className="food-items-tabs">
        <button
          onClick={() => setViewMode('my_items')}
          className={`tab-button ${viewMode === 'my_items' ? 'active' : ''}`}
        >
          My Items
        </button>
        <button
          onClick={() => setViewMode('all_items')}
          className={`tab-button ${viewMode === 'all_items' ? 'active' : ''}`}
        >
          All Items
        </button>
        <button
          onClick={() => setViewMode('favorites')}
          className={`tab-button ${viewMode === 'favorites' ? 'active' : ''}`}
        >
          Favorites
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1.5rem',
        backgroundColor: 'white',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ flex: 1 }}>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food items..."
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          />
        </div>
        <div style={{ width: isMobile ? '100%' : '200px' }}>
          <Dropdown
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.value)}
            options={[
              { label: 'All Categories', value: 'ALL' },
              ...FOOD_CATEGORIES.map((cat) => ({
                label: CATEGORY_DISPLAY_NAMES[cat] || cat,
                value: cat
              }))
            ]}
            placeholder="Category"
            style={{
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
            pt={{
              input: { style: { fontSize: '0.9375rem', padding: '0.75rem' } }
            }}
            valueTemplate={(option) => {
              if (!option) return 'Category';
              if (option.value === 'ALL') return option.label;
              const color = getCategoryColor(option.value);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0
                    }}
                  />
                  <span>{option.label}</span>
                </div>
              );
            }}
            itemTemplate={(option) => {
              if (option.value === 'ALL') return option.label;
              const color = getCategoryColor(option.value);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0
                    }}
                  />
                  <span>{option.label}</span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Desktop: Table Header (hidden on mobile) */}
      {!isMobile && filteredFoodItems.length > 0 && (
        <div className="food-items-table-header">
          <div className="table-header-cell food-item-col">FOOD ITEM</div>
          <div className="table-header-cell category-col">CATEGORY</div>
          <div className="table-header-cell carbs-col">CARBS</div>
          <div className="table-header-cell sodium-col">SODIUM</div>
          <div className="table-header-cell caffeine-col">CAFFEINE</div>
          <div className="table-header-cell cost-col">COST</div>
          <div className="table-header-cell actions-col"></div>
        </div>
      )}

      {/* Food Items List */}
      {filteredFoodItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', padding: '2rem' }}>
          {foodItems.length === 0 ? 'No food items found. Create your first food item above!' : 'No items match your search criteria.'}
        </p>
      ) : (
        <div className="food-items-list">
          {filteredFoodItems.map((item) => {
            const categoryColor = getCategoryColor(item.category);
            const categoryName = item.category ? CATEGORY_DISPLAY_NAMES[item.category] : 'N/A';

            if (isMobile) {
              // Mobile: Card layout
              const isFavorite = favoriteFoodItemIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="food-item-card-mobile"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="food-item-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <h3 className="food-item-name">{item.item_name}</h3>
                      <i
                        className={isFavorite ? "pi pi-star-fill" : "pi pi-star"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        style={{
                          fontSize: '1.25rem',
                          color: isFavorite ? '#fbbf24' : '#9ca3af',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <span className="food-item-cost">
                      {item.cost !== null && item.cost !== undefined
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(item.cost)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="food-item-category">
                    <span
                      className="category-dot"
                      style={{ backgroundColor: categoryColor }}
                    ></span>
                    <span className="category-name">{categoryName}</span>
                  </div>
                </div>
              );
            } else {
              // Desktop: Table row layout
              const isFavorite = favoriteFoodItemIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="food-item-row"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="table-cell food-item-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="food-item-name-desktop">{item.item_name}</span>
                      <i
                        className={isFavorite ? "pi pi-star-fill" : "pi pi-star"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        style={{
                          fontSize: '1rem',
                          color: isFavorite ? '#fbbf24' : '#9ca3af',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                  <div className="table-cell category-col">
                    <span
                      className="category-dot"
                      style={{ backgroundColor: categoryColor }}
                    ></span>
                    <span className="category-name">{categoryName}</span>
                  </div>
                  <div className="table-cell carbs-col">
                    {getNutrientValue(item, 'Carbohydrates')}
                  </div>
                  <div className="table-cell sodium-col">
                    {getNutrientValue(item, 'Sodium')}
                  </div>
                  <div className="table-cell caffeine-col">
                    {getNutrientValue(item, 'Caffeine')}
                  </div>
                  <div className="table-cell cost-col">
                    {item.cost !== null && item.cost !== undefined
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(item.cost)
                      : 'N/A'}
                  </div>
                  <div className="table-cell actions-col">
                    <Button
                      icon="pi pi-ellipsis-v"
                      text
                      rounded
                      className="row-menu-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(item);
                      }}
                    />
                  </div>
                </div>
              );
            }
          })}
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
    </div>
  );
};

export default FoodItems;
