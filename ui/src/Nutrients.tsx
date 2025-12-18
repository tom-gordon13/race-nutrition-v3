import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

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

  // Template for date column
  const dateBodyTemplate = (rowData: Nutrient) => {
    return new Date(rowData.created_at).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading nutrients...</div>
      </div>
    );
  }

  return (
    <Card
      title="Nutrients"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f0ff' }}
      pt={{
        title: { style: { textAlign: 'left', color: '#646cff', padding: '1.25rem', margin: 0, fontSize: '1.5rem', fontWeight: 700, backgroundColor: '#f3f0ff' } },
        body: { style: { flex: 1, overflow: 'auto', padding: 0, backgroundColor: '#f3f0ff' } },
        content: { style: { padding: 0 } }
      }}
    >
      {error && <div className="error-message">{error}</div>}

      <DataTable
        value={nutrients}
        dataKey="id"
        stripedRows
        paginator
        rows={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        emptyMessage="No nutrients found in the database."
        loading={loading}
        pt={{
          root: { style: { borderTop: 'none' } },
          thead: {
            style: {
              backgroundColor: '#f3f4f6',
              borderBottom: '1px solid #d1d5db'
            }
          },
          headerCell: {
            style: {
              color: '#000000',
              fontWeight: 600,
              backgroundColor: '#f3f4f6'
            }
          }
        }}
      >
        <Column field="nutrient_name" header="Name" sortable />
        <Column field="nutrient_abbreviation" header="Abbreviation" sortable />
        <Column
          header="Created"
          body={dateBodyTemplate}
          sortable
          sortField="created_at"
        />
      </DataTable>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #dee2e6' }}>
        <Tag value={`Total Nutrients: ${nutrients.length}`} severity="info" />
      </div>
    </Card>
  );
};

export default Nutrients;
