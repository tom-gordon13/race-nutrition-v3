import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FOOD_CATEGORIES = [
  'ENERGY_GEL',
  'ENERGY_BAR',
  'SPORTS_DRINK',
  'FRUIT',
  'SNACK',
  'OTHER'
] as const;

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface FoodItemNutrient {
  nutrient_id: string;
  quantity: number | string;
  unit: string;
}

const CreateFoodItem = () => {
  const { user } = useAuth0();
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [foodItemNutrients, setFoodItemNutrients] = useState<FoodItemNutrient[]>([
    { nutrient_id: '', quantity: '', unit: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fetchingNutrients, setFetchingNutrients] = useState(true);

  // Fetch available nutrients on component mount
  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);
        if (!response.ok) throw new Error('Failed to fetch nutrients');
        const data = await response.json();
        setNutrients(data.nutrients);
      } catch (err) {
        console.error('Error fetching nutrients:', err);
        setError('Failed to load nutrients');
      } finally {
        setFetchingNutrients(false);
      }
    };

    fetchNutrients();
  }, []);

  const addNutrientRow = () => {
    setFoodItemNutrients([...foodItemNutrients, { nutrient_id: '', quantity: '', unit: '' }]);
  };

  const removeNutrientRow = (index: number) => {
    const updated = foodItemNutrients.filter((_, i) => i !== index);
    setFoodItemNutrients(updated);
  };

  const updateNutrient = (index: number, field: keyof FoodItemNutrient, value: string | number) => {
    const updated = [...foodItemNutrients];
    updated[index] = { ...updated[index], [field]: value };
    setFoodItemNutrients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate user is logged in
      if (!user || !user.sub) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('User object:', user);
      console.log('Auth0 Sub:', user.sub);

      // Filter out empty nutrient rows
      const validNutrients = foodItemNutrients.filter(
        n => n.nutrient_id && n.quantity && n.unit
      ).map(n => ({
        ...n,
        quantity: parseFloat(n.quantity.toString())
      }));

      const payload = {
        item_name: itemName,
        brand: brand || undefined,
        category: category || undefined,
        auth0_sub: user.sub,
        nutrients: validNutrients
      };

      console.log('Sending payload:', payload);

      const response = await fetch(`${API_URL}/api/food-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create food item');
      }

      const data = await response.json();
      setSuccess(`Food item "${data.foodItem.item_name}" created successfully with ${data.nutrients.length} nutrients!`);

      // Reset form
      setItemName('');
      setBrand('');
      setCategory('');
      setFoodItemNutrients([{ nutrient_id: '', quantity: '', unit: '' }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating food item:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingNutrients) {
    return <div>Loading nutrients...</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to create food items.</div>;
  }

  return (
    <div className="create-food-item">
      <h2>Create New Food Item</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem', }}>
          <div className="form-group" style={{ flex: 1, margin: 1 }}>
            <label htmlFor="itemName">Food Item Name *</label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g., Banana, Energy Gel, Sports Drink"
            />
          </div>

          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label htmlFor="brand">Brand (Optional)</label>
            <input
              type="text"
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., GU, Clif, Gatorade"
            />
          </div>

          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label htmlFor="category">Category (Optional)</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="nutrients-section">
          <h3>Nutrients</h3>

          {foodItemNutrients.map((nutrient, index) => (
            <div key={index} className="nutrient-row" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, margin: 0 }}>
                <label htmlFor={`nutrient-${index}`}>Nutrient</label>
                <select
                  id={`nutrient-${index}`}
                  value={nutrient.nutrient_id}
                  onChange={(e) => updateNutrient(index, 'nutrient_id', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Select a nutrient</option>
                  {nutrients.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nutrient_name} ({n.nutrient_abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label htmlFor={`quantity-${index}`}>Quantity</label>
                <input
                  type="number"
                  id={`quantity-${index}`}
                  value={nutrient.quantity}
                  onChange={(e) => updateNutrient(index, 'quantity', e.target.value)}
                  placeholder="e.g., 100"
                  step="0.01"
                />
              </div>

              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label htmlFor={`unit-${index}`}>Unit</label>
                <input
                  type="text"
                  id={`unit-${index}`}
                  value={nutrient.unit}
                  onChange={(e) => updateNutrient(index, 'unit', e.target.value)}
                  placeholder="e.g., mg, g, mcg"
                />
              </div>

              {foodItemNutrients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNutrientRow(index)}
                  className="remove-btn"
                  style={{ marginBottom: '0' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addNutrientRow} className="add-nutrient-btn">
            + Add Nutrient
          </button>
        </div>

        <button type="submit" disabled={loading || !itemName} className="submit-btn">
          {loading ? 'Creating...' : 'Create Food Item'}
        </button>
      </form>
    </div>
  );
};

export default CreateFoodItem;
