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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editedData, setEditedData] = useState<Partial<FoodItem>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch current user's UUID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user || !user.sub) return;

      try {
        const response = await fetch(`${API_URL}/api/users?auth0_sub=${encodeURIComponent(user.sub)}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched current user:', data.user);
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
    if (!currentUserId) return false;
    const isOwned = String(currentUserId) === String(rowData.created_by);
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
    setShowEditDialog(true);
  }, []);

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/food-items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update food item');
      }

      // Close dialog and reset state
      setShowEditDialog(false);
      setEditingItem(null);
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
    } finally {
      setSaving(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setShowEditDialog(false);
    setEditingItem(null);
    setEditedData({});
  }, []);

  // Template for brand column
  const brandBodyTemplate = (rowData: FoodItem) => {
    return rowData.brand || <Tag severity="secondary" value="N/A" />;
  };

  // Template for category column
  const categoryBodyTemplate = (rowData: FoodItem) => {
    return rowData.category || <Tag severity="secondary" value="N/A" />;
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

  // Template for actions column
  const actionsBodyTemplate = (rowData: FoodItem) => {
    if (!isOwnedByUser(rowData)) {
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

      {/* Edit Dialog */}
      <Dialog
        header="Edit Food Item"
        visible={showEditDialog}
        style={{ width: '500px' }}
        onHide={handleEditCancel}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={handleEditCancel}
              severity="secondary"
              outlined
            />
            <Button
              label="Save"
              icon="pi pi-check"
              onClick={handleEditSave}
              loading={saving}
              disabled={!editedData.item_name}
              style={{ backgroundColor: '#646cff', borderColor: '#646cff' }}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="edit-item-name" style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
              Food Item Name *
            </label>
            <InputText
              id="edit-item-name"
              value={editedData.item_name || ''}
              onChange={(e) => setEditedData({ ...editedData, item_name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="edit-brand" style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
              Brand
            </label>
            <InputText
              id="edit-brand"
              value={editedData.brand || ''}
              onChange={(e) => setEditedData({ ...editedData, brand: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="edit-category" style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
              Category
            </label>
            <InputText
              id="edit-category"
              value={editedData.category || ''}
              onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="edit-cost" style={{ display: 'block', marginBottom: '0.5rem', color: '#646cff', fontWeight: 500 }}>
              Cost
            </label>
            <InputNumber
              id="edit-cost"
              value={editedData.cost || 0}
              onValueChange={(e) => setEditedData({ ...editedData, cost: e.value || 0 })}
              mode="currency"
              currency="USD"
              locale="en-US"
              inputStyle={{ width: '100%' }}
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default FoodItems;
