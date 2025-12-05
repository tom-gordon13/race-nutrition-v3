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
  cost?: number | null;
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

  useEffect(() => {
    const fetchFoodItems = async () => {
      if (!user || !user.sub) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user.sub)}`);

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
  }, [user, refreshTrigger]);

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
      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>My Food Items</h3>
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
          <Column field="item_name" header="Food Item" sortable style={{ minWidth: '200px' }} />
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
    </Card>
  );
};

export default FoodItems;
