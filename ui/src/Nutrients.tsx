import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
  created_at: string;
  updated_at: string;
}

const Nutrients = () => {
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);

        if (!response.ok) {
          throw new Error('Failed to fetch nutrients');
        }

        const data = await response.json();
        setNutrients(data.nutrients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching nutrients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrients();
  }, []);

  if (loading) {
    return <div>Loading nutrients...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Nutrients</h2>
      <p>Total: {nutrients.length}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Abbreviation</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {nutrients.map((nutrient) => (
            <tr key={nutrient.id}>
              <td>{nutrient.nutrient_name}</td>
              <td>{nutrient.nutrient_abbreviation}</td>
              <td>{new Date(nutrient.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {nutrients.length === 0 && (
        <p>No nutrients found in the database.</p>
      )}
    </div>
  );
};

export default Nutrients;
