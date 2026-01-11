import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import './FoodItems.css';
import { API_URL } from './config/api';
import LoadingSpinner from './LoadingSpinner';
import { CreateFoodItemDialog } from './components/food-items/CreateFoodItemDialog';

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
  const [favoriteFoodItemIds, setFavoriteFoodItemIds] = useState<Set<string>>(new Set());
  const [favoriteFoodItems, setFavoriteFoodItems] = useState<FoodItem[]>([]);
  const [colorPreferences, setColorPreferences] = useState<Map<string, string>>(new Map());

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

  // Open edit dialog (without navigation) - internal function
  const openEditDialog = useCallback((rowData: FoodItem) => {
    setEditingItem(rowData);
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

  // Handle food item updated (called after successful edit)
  const handleFoodItemUpdated = async () => {
    // Close dialog and reset state
    setShowEditDialog(false);
    setEditingItem(null);

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
  };

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setShowEditDialog(false);
    setEditingItem(null);

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
    const searchTerm = nutrientName.toLowerCase();

    // First, try exact match
    let nutrient = foodItem.foodItemNutrients.find(
      n => n.nutrient.nutrient_name.toLowerCase() === searchTerm ||
           n.nutrient.nutrient_abbreviation.toLowerCase() === searchTerm
    );

    // If no exact match, try partial match (contains)
    if (!nutrient) {
      nutrient = foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes(searchTerm) ||
             n.nutrient.nutrient_abbreviation.toLowerCase().includes(searchTerm)
      );
    }

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
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view your food items.</div>;
  }

  return (
    <div className="food-items-page">
      {/* Header Section with Create Button */}
      <div className="food-items-header">
        <Button
          label="Create New Item"
          icon="pi pi-plus"
          className="create-button"
          onClick={onCreateClick}
        />
      </div>

      {/* Tab Navigation */}
      <div className="food-items-tabs-wrapper">
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
          <div className={`tab-indicator tab-indicator-${viewMode}`} />
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-filter-section">
        <div className="search-input-wrapper">
          <i className="pi pi-search search-icon"></i>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="search-input"
          />
        </div>
        <Dropdown
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.value)}
          options={[
            { label: 'All', value: 'ALL' },
            ...FOOD_CATEGORIES.map((cat) => ({
              label: CATEGORY_DISPLAY_NAMES[cat] || cat,
              value: cat
            }))
          ]}
          placeholder="All"
          className="filter-dropdown"
          valueTemplate={(option) => {
            if (!option) return <span><i className="pi pi-filter"></i> All</span>;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="pi pi-filter"></i>
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

      {/* Item Count */}
      <div className="items-count">
        {filteredFoodItems.length} item{filteredFoodItems.length !== 1 ? 's' : ''}
      </div>

      {/* Food Items List */}
      {filteredFoodItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', backgroundColor: '#ffffff' }}>
          {foodItems.length === 0 ? 'No food items found. Create your first food item above!' : 'No items match your search criteria.'}
        </p>
      ) : (
        <div className="food-items-list">
          {filteredFoodItems.map((item) => {
            const categoryColor = getCategoryColor(item.category);
            const categoryName = item.category ? CATEGORY_DISPLAY_NAMES[item.category] : 'Other';
            const isFavorite = favoriteFoodItemIds.has(item.id);
            const carbsValue = getNutrientValue(item, 'Carbohydrates');
            const sodiumValue = getNutrientValue(item, 'Sodium');

            return (
              <div
                key={item.id}
                className="food-item-card"
                onClick={() => handleCardClick(item)}
              >
                {/* Left colored border */}
                <div className="card-left-border" style={{ backgroundColor: categoryColor }}></div>

                {/* Card content */}
                <div className="card-content">
                  {/* Top row: Name + Star + Price */}
                  <div className="card-top-row">
                    <h3 className="item-name">{item.item_name}</h3>
                    <div className="card-right-section">
                      <i
                        className={isFavorite ? "pi pi-star-fill" : "pi pi-star"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        style={{
                          fontSize: '1.25rem',
                          color: isFavorite ? '#fbbf24' : '#d1d5db',
                          cursor: 'pointer'
                        }}
                      />
                      <span className="item-price">
                        {item.cost !== null && item.cost !== undefined
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(item.cost)
                          : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: Category badge + Nutrition info */}
                  <div className="card-bottom-row">
                    <span className={`category-badge category-${item.category?.toLowerCase() || 'other'}`}>
                      {categoryName}
                    </span>
                    <span className="nutrition-info">{carbsValue} carbs • {sodiumValue} sodium</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {user?.sub && editingItem && (
        <CreateFoodItemDialog
          visible={showEditDialog}
          onHide={handleEditCancel}
          onCreate={handleFoodItemUpdated}
          auth0Sub={user.sub}
          mode="edit"
          existingItem={editingItem}
        />
      )}
    </div>
  );
};

export default FoodItems;
