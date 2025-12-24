import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { useRef } from 'react';
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

export default function Preferences() {
  const { user } = useAuth0();
  const toast = useRef<Toast>(null);
  

  const [colors, setColors] = useState<ReferenceColor[]>([]);
  const [categories, setCategories] = useState<ReferenceFoodCategory[]>([]);
  const [userPreferences, setUserPreferences] = useState<Map<string, string>>(new Map());
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [darkModeLoading, setDarkModeLoading] = useState(true);
  const [darkModeSaving, setDarkModeSaving] = useState(false);

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
  }, [API_URL]);

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
  }, [user?.sub, API_URL]);

  // Fetch user's dark mode preference
  useEffect(() => {
    const fetchDarkModePreference = async () => {
      if (!user?.sub) return;

      try {
        const response = await fetch(
          `${API_URL}/api/user-preferences?auth0_sub=${user.sub}`
        );
        if (!response.ok) throw new Error('Failed to fetch dark mode preference');

        const data = await response.json();
        setDarkMode(data.preferences.dark_mode);
      } catch (error) {
        console.error('Error fetching dark mode preference:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load dark mode preference',
          life: 3000
        });
      } finally {
        setDarkModeLoading(false);
      }
    };

    fetchDarkModePreference();
  }, [user?.sub, API_URL]);

  // Handle dark mode toggle
  const handleDarkModeToggle = async (value: boolean) => {
    if (!user?.sub) return;

    setDarkMode(value);
    setDarkModeSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/user-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          dark_mode: value
        })
      });

      if (!response.ok) throw new Error('Failed to update dark mode preference');

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Dark mode ${value ? 'enabled' : 'disabled'}`,
        life: 3000
      });
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
      // Revert the toggle on error
      setDarkMode(!value);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update dark mode preference',
        life: 3000
      });
    } finally {
      setDarkModeSaving(false);
    }
  };

  // Handle color selection
  const handleColorSelect = (categoryId: string, colorId: string) => {
    const newPreferences = new Map(userPreferences);
    newPreferences.set(categoryId, colorId);
    setUserPreferences(newPreferences);

    // Mark this category as dirty
    const newDirtyFields = new Set(dirtyFields);
    newDirtyFields.add(categoryId);
    setDirtyFields(newDirtyFields);
  };

  // Save preferences
  const handleSavePreferences = async () => {
    if (!user?.sub || dirtyFields.size === 0) return;

    setSaving(true);

    try {
      // Only save the dirty fields
      const preferencesToSave = Array.from(dirtyFields).map(categoryId => ({
        food_category_id: categoryId,
        color_id: userPreferences.get(categoryId)!
      }));

      const response = await fetch(`${API_URL}/api/preferences/user-colors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          preferences: preferencesToSave
        })
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      // Clear dirty fields on success
      setDirtyFields(new Set());

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `${preferencesToSave.length} preference(s) saved successfully`,
        life: 3000
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save preferences',
        life: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const userProfileTemplate = (
    <div className="preference-header-content">
      <Avatar
        label={user?.name?.charAt(0).toUpperCase()}
        icon="pi pi-user"
        style={{ backgroundColor: '#646cff', color: 'white' }}
        shape="circle"
        size="large"
      />
      <span className="preference-title">User Profile</span>
    </div>
  );

  return (
    <div className="preferences-container">
      <Toast ref={toast} />
      <Panel header="Preferences" className="preferences-panel">
        <p className="preferences-subtitle">Manage your app settings and preferences</p>

        <Divider />

        <Card className="preferences-card">
          {userProfileTemplate}
          <Divider />
          <div className="preference-section">
            <div className="preference-row">
              <label>Name</label>
              <span>{user?.name || 'N/A'}</span>
            </div>
            <Divider />
            <div className="preference-row">
              <label>Email</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
          </div>
        </Card>

        <Card title="App Settings" className="preferences-card">
          <div className="preference-section">
            <h3 className="settings-section-title">Display Settings</h3>
            <p className="settings-description">
              Customize how the app looks and feels.
            </p>

            <div className="preference-row" style={{ marginBottom: '2rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '1rem' }}>Dark Mode</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  Coming soon - toggle between light and dark themes
                </p>
              </div>
              <InputSwitch
                checked={darkMode}
                onChange={(e) => handleDarkModeToggle(e.value)}
                disabled={darkModeLoading || darkModeSaving}
              />
            </div>

            <Divider />

            <h3 className="settings-section-title">Category Color Preferences</h3>
            <p className="settings-description">
              Choose a color for each food category to customize how they appear in your events.
            </p>

            {loading ? (
              <div className="loading-state">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                <p>Loading preferences...</p>
              </div>
            ) : (
              <>
                <div className="color-preferences-list">
                  {categories.map((category) => {
                    const selectedColorId = userPreferences.get(category.id);
                    const isDirty = dirtyFields.has(category.id);

                    return (
                      <div key={category.id} className="category-color-row">
                        <div className="category-info">
                          <label className="category-label">
                            {category.category_name.replace(/_/g, ' ')}
                          </label>
                          {isDirty && (
                            <span className="unsaved-indicator">
                              <i className="pi pi-circle-fill" style={{ fontSize: '0.5rem' }}></i>
                            </span>
                          )}
                        </div>
                        <div className="color-options">
                          {colors.map((color) => {
                            const isSelected = selectedColorId === color.id;

                            return (
                              <button
                                key={color.id}
                                className={`color-circle ${isSelected ? 'selected' : ''}`}
                                style={{
                                  backgroundColor: color.hex,
                                  opacity: isSelected ? 1 : 0.4
                                }}
                                onClick={() => handleColorSelect(category.id, color.id)}
                                title={color.color_name}
                                aria-label={`Select ${color.color_name} for ${category.category_name}`}
                              >
                                {isSelected && (
                                  <i className="pi pi-check" style={{ color: 'white' }}></i>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="save-preferences-section">
                  <Button
                    label="Save Preferences"
                    icon="pi pi-save"
                    onClick={handleSavePreferences}
                    disabled={dirtyFields.size === 0 || saving}
                    loading={saving}
                    severity="success"
                  />
                  {dirtyFields.size > 0 && (
                    <span className="unsaved-changes-text">
                      {dirtyFields.size} unsaved change{dirtyFields.size > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </Panel>
    </div>
  );
}
