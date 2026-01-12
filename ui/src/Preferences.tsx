import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Preferences.css';
import { API_URL } from './config/api';
import LoadingSpinner from './LoadingSpinner';

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

  // Get initials from user name
  const getInitials = (): string => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0].toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="preferences-page">
      <Toast ref={toast} />

      {/* Header */}
      <header className="preferences-header">
        <button onClick={handleBack} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="preferences-title">Settings</h1>
      </header>

      {/* Spacer */}
      <div className="header-spacer"></div>

      {/* Divider */}
      <div className="section-divider"></div>

      {/* Account Section */}
      <div className="section-label-wrapper">
        <p className="section-label">ACCOUNT</p>
      </div>

      <div className="account-card">
        <div className="account-avatar">
          {getInitials()}
        </div>
        <div className="account-info">
          <h3 className="account-name">{user?.name || 'User'}</h3>
          <p className="account-email">{user?.email || 'No email'}</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {/* Divider */}
      <div className="section-divider"></div>

      {/* Display Section */}
      <div className="section-label-wrapper">
        <p className="section-label">DISPLAY</p>
      </div>

      <div className="display-card">
        <div className="display-item">
          <div className="dark-mode-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <div className="display-content">
            <p className="display-label">Dark Mode</p>
            <p className="display-sublabel">Coming soon</p>
          </div>
          <div className="toggle-switch disabled"></div>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider"></div>

      {/* Category Colors Section */}
      <div className="section-label-wrapper">
        <p className="section-label">CATEGORY COLORS</p>
      </div>

      {categories.map((category, index) => {
        const selectedColorId = userPreferences.get(category.id);
        const selectedColorHex = getSelectedColorHex(category.id);
        const categoryName = CATEGORY_DISPLAY_NAMES[category.category_name] || category.category_name;

        return (
          <div key={category.id}>
            <div className="category-color-card">
              <div className="category-header">
                <p className="category-name">{categoryName}</p>
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
                    />
                  );
                })}
              </div>
            </div>
            {index < categories.length - 1 && <div className="category-divider"></div>}
          </div>
        );
      })}

      {/* Divider */}
      <div className="section-divider"></div>

      {/* Spacer before sign out */}
      <div style={{ height: '2rem' }}></div>

      {/* Sign Out Section */}
      <button className="sign-out-card" onClick={handleSignOut}>
        <div className="sign-out-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <p className="sign-out-text">Sign Out</p>
      </button>

      {/* Bottom spacing */}
      <div style={{ height: '7rem' }}></div>
    </div>
  );
}
