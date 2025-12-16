import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

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

interface FoodItemNutrient {
  nutrient_id: string;
  quantity: number | string;
  unit: string;
}

interface CreateFoodItemProps {
  onFoodItemCreated?: () => void;
}

const CreateFoodItem = ({ onFoodItemCreated }: CreateFoodItemProps) => {
  const { user } = useAuth0();
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState<number | null>(null);
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
        cost: cost !== null ? cost : undefined,
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
      setCost(null);
      setFoodItemNutrients([{ nutrient_id: '', quantity: '', unit: '' }]);

      // Trigger refetch of food items
      if (onFoodItemCreated) {
        onFoodItemCreated();
      }

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
    <Card
      title="Create New Food Item"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f0ff' }}
      pt={{
        title: { style: { textAlign: 'left', color: '#646cff', padding: '1.25rem', margin: 0, fontSize: '1.5rem', fontWeight: 700, backgroundColor: '#f3f0ff' } },
        body: { style: { flex: 1, overflow: 'auto', padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f3f0ff' } },
        content: { style: { padding: 0 } }
      }}
    >
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="p-field">
            <label htmlFor="itemName">Food Item Name *</label>
            <InputText
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g., Banana, Energy Gel, Sports Drink"
              style={{ width: '100%' }}
            />
          </div>

          <div className="p-field">
            <label htmlFor="brand">Brand (Optional)</label>
            <InputText
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., GU, Clif, Gatorade"
              style={{ width: '100%' }}
            />
          </div>

          <div className="p-field">
            <label htmlFor="category">Category (Optional)</label>
            <Dropdown
              id="category"
              value={category}
              onChange={(e) => setCategory(e.value)}
              options={[
                { label: 'Select a category', value: '' },
                ...FOOD_CATEGORIES.map((cat) => ({
                  label: CATEGORY_DISPLAY_NAMES[cat] || cat,
                  value: cat
                }))
              ]}
              placeholder="Select a category"
              style={{ width: '100%' }}
            />
          </div>

          <div className="p-field">
            <label htmlFor="cost">Cost (Optional)</label>
            <InputNumber
              id="cost"
              value={cost}
              onValueChange={(e) => setCost(e.value ?? null)}
              mode="currency"
              currency="USD"
              locale="en-US"
              placeholder="e.g., 3.99"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={99999999.99}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="nutrients-section">
          <h3>Nutrients</h3>

          {foodItemNutrients.map((nutrient, index) => (
            <div key={index} className="nutrient-row" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div className="p-field" style={{ flex: 2, margin: 0 }}>
                <label htmlFor={`nutrient-${index}`}>Nutrient</label>
                <Dropdown
                  id={`nutrient-${index}`}
                  value={nutrient.nutrient_id}
                  onChange={(e) => updateNutrient(index, 'nutrient_id', e.value)}
                  options={nutrients.map((n) => ({
                    label: `${n.nutrient_name} (${n.nutrient_abbreviation})`,
                    value: n.id
                  }))}
                  placeholder="Select a nutrient"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="p-field" style={{ flex: 1, margin: 0 }}>
                <label htmlFor={`quantity-${index}`}>Quantity</label>
                <InputNumber
                  id={`quantity-${index}`}
                  value={typeof nutrient.quantity === 'string' ? parseFloat(nutrient.quantity) || undefined : nutrient.quantity}
                  onValueChange={(e) => updateNutrient(index, 'quantity', e.value || '')}
                  placeholder="e.g., 100"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="p-field" style={{ flex: 1, margin: 0 }}>
                <label htmlFor={`unit-${index}`}>Unit</label>
                <Dropdown
                  id={`unit-${index}`}
                  value={nutrient.unit}
                  onChange={(e) => updateNutrient(index, 'unit', e.value)}
                  options={[
                    { label: 'g (grams)', value: 'g' },
                    { label: 'mg (milligrams)', value: 'mg' }
                  ]}
                  placeholder="Select unit"
                  style={{ width: '100%' }}
                />
              </div>

              {foodItemNutrients.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeNutrientRow(index)}
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  style={{ marginBottom: '0' }}
                />
              )}
            </div>
          ))}

          <Button
            type="button"
            onClick={addNutrientRow}
            icon="pi pi-plus"
            label="Add Nutrient"
            outlined
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !itemName}
          label={loading ? 'Creating...' : 'Create Food Item'}
          icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
          severity="success"
          raised
          style={{ width: '100%', marginTop: '1rem', backgroundColor: '#22c55e', borderColor: '#22c55e', color: 'white', fontWeight: 600 }}
        />
      </form>
    </Card>
  );
};

export default CreateFoodItem;
