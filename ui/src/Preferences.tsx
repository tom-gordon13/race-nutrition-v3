import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Preferences.css';
import { API_URL } from './config/api';

interface ReferenceColor {
  id: string;
  hex: string;
  color_name: string;
}

interface ReferenceFoodCategory {
  id: string;
  category_name: string;
}

interface UserColorPreference {
  id: string;
  user_id: string;
  food_category: string;
  color_id: string;
  color: ReferenceColor;
  foodCategory: ReferenceFoodCategory;
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ENERGY_GEL': 'Energy Gel',
  'ENERGY_BAR': 'Energy Bar',
  'SPORTS_DRINK': 'Sports Drink',
  'FRUIT': 'Fruit',
  'SNACK': 'Snack',
  'OTHER': 'Other'
};

export default function Preferences() {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [colors, setColors] = useState<ReferenceColor[]>([]);
  const [categories, setCategories] = useState<ReferenceFoodCategory[]>([]);
  const [userPreferences, setUserPreferences] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch reference data (colors and categories)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/preferences/reference-data`);
        if (!response.ok) throw new Error('Failed to fetch reference data');

        const data = await response.json();
        setColors(data.colors);
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching reference data:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load color options',
          life: 3000
        });
      }
    };

    fetchReferenceData();
  }, []);

  // Fetch user's existing color preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user?.sub) return;

      try {
        const response = await fetch(
          `${API_URL}/api/preferences/user-colors?auth0_sub=${user.sub}`
        );
        if (!response.ok) throw new Error('Failed to fetch user preferences');

        const data = await response.json();
        const prefsMap = new Map<string, string>();

        data.preferences.forEach((pref: UserColorPreference) => {
          prefsMap.set(pref.food_category, pref.color_id);
        });

        setUserPreferences(prefsMap);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load your saved preferences',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, [user?.sub]);

  // Handle color selection - auto-save
  const handleColorSelect = async (categoryId: string, colorId: string) => {
    if (!user?.sub) return;

    // Optimistic update
    const newPreferences = new Map(userPreferences);
    newPreferences.set(categoryId, colorId);
    setUserPreferences(newPreferences);

    try {
      const response = await fetch(`${API_URL}/api/preferences/user-colors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          preferences: [{
            food_category_id: categoryId,
            color_id: colorId
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to save preference');
    } catch (error) {
      console.error('Error saving preference:', error);
      // Revert on error
      const revertedPreferences = new Map(userPreferences);
      revertedPreferences.delete(categoryId);
      setUserPreferences(revertedPreferences);

      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save color preference',
        life: 3000
      });
    }
  };

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Get the color hex for a category
  const getSelectedColorHex = (categoryId: string): string => {
    const selectedColorId = userPreferences.get(categoryId);
    const selectedColor = colors.find(c => c.id === selectedColorId);
    return selectedColor?.hex || '#9ca3af';
  };

  return (
    <div className="preferences-page">
      <Toast ref={toast} />

      {/* Header */}
      <div className="preferences-header">
        <button onClick={handleBack} className="back-button">
          <i className="pi pi-chevron-left" />
        </button>
        <h1 className="preferences-title">Settings</h1>
      </div>

      <div className="preferences-content">
        {/* ACCOUNT Section */}
        <div className="preferences-section">
          <h2 className="section-header">ACCOUNT</h2>
          <div className="account-card">
            <Avatar
              label={user?.name?.charAt(0).toUpperCase()}
              icon="pi pi-user"
              style={{ backgroundColor: '#F97316', color: 'white', width: '70px', height: '70px', fontSize: '2rem', flexShrink: 0 }}
              shape="circle"
            />
            <div className="account-info">
              <div className="account-name">{user?.name || 'User'}</div>
              <div className="account-email">{user?.email || 'No email'}</div>
            </div>
            <i className="pi pi-chevron-right" style={{ color: '#d1d5db', fontSize: '1.25rem' }} />
          </div>
        </div>

        {/* DISPLAY Section */}
        <div className="preferences-section">
          <h2 className="section-header">DISPLAY</h2>

          {/* Dark Mode */}
          <div className="display-item">
            <div className="display-icon dark-mode-icon">
              <i className="pi pi-moon" style={{ color: 'white', fontSize: '1.5rem' }} />
            </div>
            <div className="display-content">
              <div className="display-label">Dark Mode</div>
              <div className="display-sublabel">Coming soon</div>
            </div>
            <div className="display-toggle disabled">
              {/* Placeholder for toggle switch */}
            </div>
          </div>

          {/* Units */}
          <div className="display-item">
            <div className="display-icon units-icon">
              <i className="pi pi-chart-line" style={{ color: 'white', fontSize: '1.5rem' }} />
            </div>
            <div className="display-content">
              <div className="display-label">Units</div>
            </div>
            <div className="display-value">
              <span>Metric</span>
              <i className="pi pi-chevron-right" style={{ color: '#d1d5db', marginLeft: '0.5rem' }} />
            </div>
          </div>
        </div>

        {/* CATEGORY COLORS Section */}
        <div className="preferences-section">
          <h2 className="section-header">CATEGORY COLORS</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
          ) : (
            <div className="category-colors-list">
              {categories.map((category) => {
                const selectedColorId = userPreferences.get(category.id);
                const selectedColorHex = getSelectedColorHex(category.id);
                const categoryName = CATEGORY_DISPLAY_NAMES[category.category_name] || category.category_name;

                return (
                  <div key={category.id} className="category-color-card">
                    <div className="category-header">
                      <span className="category-name">{categoryName}</span>
                      <div
                        className="category-indicator"
                        style={{ backgroundColor: selectedColorHex }}
                      />
                    </div>
                    <div className="color-picker">
                      {colors.map((color) => {
                        const isSelected = selectedColorId === color.id;

                        return (
                          <button
                            key={color.id}
                            className={`color-option ${isSelected ? 'selected' : ''}`}
                            style={{
                              backgroundColor: color.hex,
                              color: color.hex
                            }}
                            onClick={() => handleColorSelect(category.id, color.id)}
                            title={color.color_name}
                          >
                            {isSelected && (
                              <i className="pi pi-check" style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sign Out Section */}
        <div className="preferences-section">
          <h2 className="section-header">ACCOUNT</h2>
          <button className="sign-out-button" onClick={handleSignOut}>
            <div className="sign-out-icon">
              <i className="pi pi-sign-out" style={{ color: '#ef4444', fontSize: '1.25rem' }} />
            </div>
            <span className="sign-out-text">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
