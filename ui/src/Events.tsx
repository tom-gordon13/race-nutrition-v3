import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams } from 'react-router-dom';
import {
  EventForm,
  EventsTable,
  FoodItemsList,
  EventTimeline,
  NutritionSummary
} from './components/events';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface FoodItemNutrient {
  id: string;
  food_item_id: string;
  nutrient_id: string;
  quantity: number;
  unit: string;
  nutrient: {
    id: string;
    nutrient_name: string;
    nutrient_abbreviation: string;
  };
}

interface FoodItem {
  id: string;
  item_name: string;
  brand?: string;
  category?: string;
  foodItemNutrients: FoodItemNutrient[];
}

interface FoodInstance {
  id: string;
  time_elapsed_at_consumption: number;
  servings: number;
  food_item_id: string;
  event_id: string;
  foodItem: FoodItem;
}

const Events = () => {
  const { user } = useAuth0();
  const { eventId } = useParams<{ eventId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected event state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [foodInstances, setFoodInstances] = useState<FoodInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Sub-tab state (for left panel when event is selected)
  const [leftPanelTab, setLeftPanelTab] = useState<'food-items' | 'events'>('food-items');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingFoodItems, setLoadingFoodItems] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [myItemsOnly, setMyItemsOnly] = useState<boolean>(true);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editableFoodInstances, setEditableFoodInstances] = useState<FoodInstance[]>([]);
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);

  // State for dragging food items from left panel
  const [draggingFoodItemId, setDraggingFoodItemId] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user || !user.sub) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/events?auth0_sub=${encodeURIComponent(user.sub)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchFoodItems = async () => {
    if (!user || !user.sub) return;

    setLoadingFoodItems(true);
    try {
      const response = await fetch(`${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user.sub)}&my_items_only=${myItemsOnly}`);

      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }

      const data = await response.json();
      setFoodItems(data.foodItems);
    } catch (err) {
      console.error('Error fetching food items:', err);
    } finally {
      setLoadingFoodItems(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchFoodItems();
    }
  }, [selectedEvent, myItemsOnly]);

  // Auto-select event if eventId is in URL
  useEffect(() => {
    if (eventId && events.length > 0 && !selectedEvent) {
      const eventToSelect = events.find(e => e.id === eventId);
      if (eventToSelect) {
        setSelectedEvent(eventToSelect);
      }
    }
  }, [eventId, events, selectedEvent]);

  const fetchFoodInstances = async (eventId: string) => {
    setLoadingInstances(true);
    try {
      const response = await fetch(`${API_URL}/api/food-instances/event/${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch food instances');
      }

      const data = await response.json();
      setFoodInstances(data.foodInstances);
    } catch (err) {
      console.error('Error fetching food instances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchFoodInstances(selectedEvent.id);
    } else {
      setFoodInstances([]);
    }
    // Reset edit mode when event changes
    setEditMode(false);
    setEditableFoodInstances([]);
  }, [selectedEvent]);

  const toggleEditMode = async () => {
    if (!editMode && selectedEvent) {
      // Entering edit mode - copy data to editable state
      setEditableFoodInstances(foodInstances.map(instance => ({ ...instance })));
      setEditMode(true);
    } else if (editMode) {
      // Exiting edit mode - save changes
      await saveChanges();
      setEditableFoodInstances([]);
      setEditMode(false);
    }
  };

  const saveChanges = async () => {
    if (!selectedEvent) return;

    try {
      // Update food instances that have changed
      for (const instance of editableFoodInstances) {
        const original = foodInstances.find(fi => fi.id === instance.id);
        if (original && original.time_elapsed_at_consumption !== instance.time_elapsed_at_consumption) {
          const response = await fetch(`${API_URL}/api/food-instances/${instance.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              time_elapsed_at_consumption: instance.time_elapsed_at_consumption
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update food instance');
          }
        }
      }

      // Refresh food instances after save
      await fetchFoodInstances(selectedEvent.id);
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.error('Error saving changes:', err);
    }
  };

  const handleDragStart = (_e: React.DragEvent, instanceId: string, _currentTop: number) => {
    if (!editMode) return;

    setDraggingInstanceId(instanceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const timeline = e.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();

    // Calculate drop position relative to timeline
    const dropY = e.clientY - rect.top;

    // Check if drop is within timeline bounds
    if (dropY < 0 || dropY > rect.height) {
      setDraggingInstanceId(null);
      setDraggingFoodItemId(null);
      return;
    }

    // Calculate new time based on position
    const percentage = dropY / rect.height;
    const newTime = Math.round(percentage * selectedEvent.expected_duration);

    // Handle dragging existing instance (edit mode)
    if (draggingInstanceId && editMode) {
      // Update the editable food instance
      setEditableFoodInstances(prev =>
        prev.map(instance =>
          instance.id === draggingInstanceId
            ? { ...instance, time_elapsed_at_consumption: newTime }
            : instance
        )
      );
      setDraggingInstanceId(null);
    }
    // Handle dragging food item from left panel (create new instance)
    else if (draggingFoodItemId) {
      try {
        const response = await fetch(`${API_URL}/api/food-instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            food_item_id: draggingFoodItemId,
            event_id: selectedEvent.id,
            time_elapsed_at_consumption: newTime,
            servings: 1
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create food instance');
        }

        // Refresh food instances to show the new one
        await fetchFoodInstances(selectedEvent.id);
        setSuccess('Food instance added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error creating food instance:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setDraggingFoodItemId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingInstanceId(null);
    setDraggingFoodItemId(null);
  };

  const handleFoodItemDragStart = (_e: React.DragEvent, foodItemId: string) => {
    setDraggingFoodItemId(foodItemId);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`${API_URL}/api/food-instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete food instance');
      }

      // Refresh food instances after deletion
      await fetchFoodInstances(selectedEvent.id);
      setSuccess('Food instance deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting food instance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleCreateEvent = async (eventType: string, expectedDuration: number) => {
    setError(null);
    setSuccess(null);

    try {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          expected_duration: expectedDuration,
          type: eventType
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const data = await response.json();
      setSuccess(`Event "${data.event.type}" created successfully!`);

      setShowCreateForm(false);

      // Refresh events list
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating event:', err);
      throw err;
    }
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view events.</div>;
  }

  return (
    <div className={`events-container ${selectedEvent ? 'split-view' : ''}`}>
      <div className={`events-panel ${selectedEvent ? 'vertical' : ''}`}>
        <h2>My Events</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {selectedEvent && (
          <div className="sub-tabs">
            <button
              className={`sub-tab ${leftPanelTab === 'food-items' ? 'active' : ''}`}
              onClick={() => setLeftPanelTab('food-items')}
            >
              Food Items
            </button>
            <button
              className={`sub-tab ${leftPanelTab === 'events' ? 'active' : ''}`}
              onClick={() => setLeftPanelTab('events')}
            >
              Events
            </button>
          </div>
        )}

        {!selectedEvent && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="add-nutrient-btn"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Event'}
            </button>
          </div>
        )}

        {showCreateForm && (
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {(!selectedEvent || leftPanelTab === 'events') && (
          <EventsTable
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
          />
        )}

        {selectedEvent && leftPanelTab === 'food-items' && (
          <FoodItemsList
            foodItems={foodItems}
            categoryFilter={categoryFilter}
            myItemsOnly={myItemsOnly}
            loadingFoodItems={loadingFoodItems}
            onCategoryFilterChange={setCategoryFilter}
            onMyItemsOnlyChange={setMyItemsOnly}
            onFoodItemDragStart={handleFoodItemDragStart}
            onFoodItemDragEnd={handleDragEnd}
          />
        )}
      </div>

      {selectedEvent && (
        <div className="event-detail-panel">
          <div className="event-detail-header">
            <h3>{selectedEvent.type}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={toggleEditMode}
                className={`edit-mode-btn ${editMode ? 'active' : ''}`}
              >
                {editMode ? 'Save & Exit Edit Mode' : 'Edit Mode'}
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="event-timeline-container">
            <EventTimeline
              event={selectedEvent}
              foodInstances={editMode ? editableFoodInstances : foodInstances}
              editMode={editMode}
              loadingInstances={loadingInstances}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDeleteInstance={handleDeleteInstance}
            />

            <NutritionSummary
              event={selectedEvent}
              foodInstances={editMode ? editableFoodInstances : foodInstances}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
