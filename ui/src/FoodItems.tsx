import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

interface FoodItemsProps {
  refreshTrigger?: number;
}

const FoodItems = ({ refreshTrigger }: FoodItemsProps) => {
  const { user } = useAuth0();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myItemsOnly, setMyItemsOnly] = useState(true);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<FoodItem>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user's UUID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(`${API_URL}/api/users?auth0_sub=${encodeURIComponent(user.sub)}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, [user]);

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
    const isOwned = currentUserId === rowData.created_by;
    console.log(`Item: ${rowData.item_name}, currentUserId: ${currentUserId}, created_by: ${rowData.created_by}, isOwned: ${isOwned}`);
    return isOwned;
  };

  // Handle edit start
  const handleEditStart = (rowData: FoodItem) => {
    setEditingRowId(rowData.id);
    setEditedData({
      item_name: rowData.item_name,
      brand: rowData.brand || '',
      category: rowData.category || '',
      cost: rowData.cost || 0
    });
  };

  // Handle edit save
  const handleEditSave = async (rowData: FoodItem) => {
    try {
      const response = await fetch(`${API_URL}/api/food-items/${rowData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update food item');
      }

      // Refresh the list
      setEditingRowId(null);
      setEditedData({});

      // Trigger a re-fetch
      const fetchResponse = await fetch(
        `${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user!.sub!)}&my_items_only=${myItemsOnly}`
      );
      const data = await fetchResponse.json();
      setFoodItems(data.foodItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update food item');
      console.error('Error updating food item:', err);
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  // Template for item name column (editable for owned items)
  const itemNameBodyTemplate = (rowData: FoodItem) => {
    if (editingRowId === rowData.id) {
      return (
        <input
          type="text"
          value={editedData.item_name || ''}
          onChange={(e) => setEditedData({ ...editedData, item_name: e.target.value })}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      );
    }
    return rowData.item_name;
  };

  // Template for brand column (editable for owned items)
  const brandBodyTemplate = (rowData: FoodItem) => {
    if (editingRowId === rowData.id) {
      return (
        <input
          type="text"
          value={editedData.brand || ''}
          onChange={(e) => setEditedData({ ...editedData, brand: e.target.value })}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      );
    }
    return rowData.brand || <Tag severity="secondary" value="N/A" />;
  };

  // Template for category column (editable for owned items)
  const categoryBodyTemplate = (rowData: FoodItem) => {
    if (editingRowId === rowData.id) {
      return (
        <input
          type="text"
          value={editedData.category || ''}
          onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      );
    }
    return rowData.category || <Tag severity="secondary" value="N/A" />;
  };

  // Template for cost column (editable for owned items)
  const costBodyTemplate = (rowData: FoodItem) => {
    if (editingRowId === rowData.id) {
      return (
        <input
          type="number"
          value={editedData.cost || 0}
          onChange={(e) => setEditedData({ ...editedData, cost: parseFloat(e.target.value) })}
          style={{ width: '100px', padding: '0.5rem' }}
          step="0.01"
          min="0"
        />
      );
    }
    if (rowData.cost === null || rowData.cost === undefined) {
      return <Tag severity="secondary" value="N/A" />;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(rowData.cost);
  };

  // Template for actions column
  const actionsBodyTemplate = (rowData: FoodItem) => {
    if (!isOwnedByUser(rowData)) {
      return null;
    }

    if (editingRowId === rowData.id) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleEditSave(rowData)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
          <button
            onClick={handleEditCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleEditStart(rowData)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#646cff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Edit
      </button>
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
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
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
      <Tag value={`Total: ${foodItems.length}`} severity="info" />
    </div>
  );

  return (
    <Card
      header={headerContent}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f0ff' }}
      pt={{
        header: { style: { textAlign: 'left', color: '#646cff', padding: '1.25rem', backgroundColor: '#f3f0ff' } },
        body: { style: { flex: 1, overflow: 'auto', padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f3f0ff' } },
        content: { style: { padding: 0 } }
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
            body={itemNameBodyTemplate}
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
    </Card>
  );
};

export default FoodItems;
