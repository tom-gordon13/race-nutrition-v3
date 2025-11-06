import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  created_at: string;
  updated_at: string;
  foodItemNutrients: FoodItemNutrient[];
}

const FoodItems = () => {
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
  }, [user]);

  if (loading) {
    return <div>Loading food items...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view your food items.</div>;
  }

  return (
    <div>
      <h2>My Food Items</h2>
      <p>Total: {foodItems.length}</p>

      {foodItems.length === 0 ? (
        <p>No food items found. Create your first food item above!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Food Item</th>
              <th>Nutrients</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((foodItem) => (
              <tr key={foodItem.id}>
                <td>{foodItem.item_name}</td>
                <td>
                  {foodItem.foodItemNutrients.length === 0 ? (
                    <span>No nutrients</span>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {foodItem.foodItemNutrients.map((fin) => (
                        <li key={fin.id}>
                          {fin.nutrient.nutrient_name}: {fin.quantity} {fin.unit}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{new Date(foodItem.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FoodItems;
