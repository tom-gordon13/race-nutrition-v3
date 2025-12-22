import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import { API_URL } from './config/api';



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

  const headerContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#000000' }}>
        Nutrients
      </h3>
    </div>
  );

  return (
    <Card
      header={headerContent}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db' }}
      pt={{
        header: { style: { textAlign: 'left', padding: '1rem 1.5rem', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' } },
        body: { style: { flex: 1, overflow: 'auto', padding: 0, backgroundColor: 'white' } },
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
          }
        }}
      >
        <Column
          field="nutrient_name"
          header="Name"
          sortable
          headerStyle={{ color: '#000000', fontWeight: 600, backgroundColor: '#f3f4f6' }}
        />
        <Column
          field="nutrient_abbreviation"
          header="Abbrev"
          sortable
          headerStyle={{ color: '#000000', fontWeight: 600, backgroundColor: '#f3f4f6' }}
        />
        <Column
          header="Created"
          body={dateBodyTemplate}
          sortable
          sortField="created_at"
          headerStyle={{ color: '#000000', fontWeight: 600, backgroundColor: '#f3f4f6' }}
        />
      </DataTable>

      {nutrients.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '1rem 0' }}>
          <Tag value={`Total: ${nutrients.length}`} severity="info" />
        </div>
      )}
    </Card>
  );
};

export default Nutrients;
