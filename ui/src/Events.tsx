import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import {
  EventForm,
  EventsTable,
  FoodItemsList,
  EventTimeline,
  NutritionSummary,
  FoodItemSelectionModal,
  NutrientGoalsDialog
} from './components/events';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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
  cost?: number;
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
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected event state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [foodInstances, setFoodInstances] = useState<FoodInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Sub-tab state (for left panel when event is selected)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingFoodItems, setLoadingFoodItems] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [myItemsOnly, setMyItemsOnly] = useState<boolean>(true);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Drag and drop state
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);

  // State for dragging food items from left panel
  const [draggingFoodItemId, setDraggingFoodItemId] = useState<string | null>(null);

  // State for left panel visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(false);

  // State for food item selection modal
  const [showFoodItemModal, setShowFoodItemModal] = useState(false);
  const [modalTimeInSeconds, setModalTimeInSeconds] = useState(0);

  // State for nutrient goals dialog
  const [showNutrientGoalsDialog, setShowNutrientGoalsDialog] = useState(false);
  const [goalsRefreshTrigger, setGoalsRefreshTrigger] = useState(0);

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

  // Handler for selecting an event (updates state and URL)
  const handleSelectEvent = (event: Event | null) => {
    setSelectedEvent(event);
    if (event) {
      navigate(`/events/${event.id}`);
    } else {
      navigate('/events');
    }
  };

  // Auto-select event if eventId is in URL, or clear selection if no eventId
  useEffect(() => {
    if (eventId && events.length > 0) {
      const eventToSelect = events.find(e => e.id === eventId);
      if (eventToSelect && selectedEvent?.id !== eventId) {
        setSelectedEvent(eventToSelect);
      }
    } else if (!eventId && selectedEvent) {
      // Clear selection when navigating back to /events
      setSelectedEvent(null);
    }
  }, [eventId, events]);

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
  }, [selectedEvent]);

  const handleDragStart = (e: React.DragEvent, instanceId: string, _currentTop: number) => {

    // Calculate the offset from the top of the dragged element to where the user clicked
    const draggedElement = e.currentTarget as HTMLElement;
    const rect = draggedElement.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    setDragOffsetY(offsetY);
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
    // Subtract the drag offset so the box stays where it was visually (not where the cursor is)
    const dropY = e.clientY - rect.top - dragOffsetY;

    // Check if drop is within timeline bounds
    if (dropY < 0 || dropY > rect.height) {
      setDraggingInstanceId(null);
      setDraggingFoodItemId(null);
      return;
    }

    // Calculate new time based on position
    const percentage = dropY / rect.height;
    const newTime = Math.round(percentage * selectedEvent.expected_duration);

    // Handle dragging existing instance - optimistic update
    if (draggingInstanceId) {
      // Optimistic update: Update local state immediately for instant feedback
      setFoodInstances(prev =>
        prev.map(instance =>
          instance.id === draggingInstanceId
            ? { ...instance, time_elapsed_at_consumption: newTime }
            : instance
        )
      );

      // Make API call in background
      try {
        const response = await fetch(`${API_URL}/api/food-instances/${draggingInstanceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            time_elapsed_at_consumption: newTime
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update food instance');
        }

        // Success - no refresh needed, state already updated optimistically
      } catch (err) {
        console.error('Error updating food instance:', err);
        setError(err instanceof Error ? err.message : 'Failed to move food instance');
        setTimeout(() => setError(null), 3000);
        // Refresh to revert to original position on error
        await fetchFoodInstances(selectedEvent.id);
      } finally {
        setDraggingInstanceId(null);
      }
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
    setDragOffsetY(0);
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

  const handleUpdateInstance = async (instanceId: string, time: number, servings: number) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`${API_URL}/api/food-instances/${instanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_elapsed_at_consumption: time,
          servings: servings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update food instance');
      }

      // Refresh food instances after update
      await fetchFoodInstances(selectedEvent.id);
      setSuccess('Food instance updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating food instance:', err);
      setError(err instanceof Error ? err.message : 'Failed to update food instance');
      throw err;
    }
  };

  // Handler for click on timeline to create new food instance
  const handleClickHoldCreate = (timeInSeconds: number) => {
    setModalTimeInSeconds(timeInSeconds);
    setShowFoodItemModal(true);
  };

  // Handler for food item selection from modal
  const handleFoodItemSelect = async (foodItemId: string, servings: number, timeInSeconds: number) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`${API_URL}/api/food-instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_item_id: foodItemId,
          event_id: selectedEvent.id,
          time_elapsed_at_consumption: timeInSeconds,
          servings: servings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create food instance');
      }

      // Refresh food instances to show the new one
      await fetchFoodInstances(selectedEvent.id);
      setSuccess('Food instance added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowFoodItemModal(false);
    } catch (err) {
      console.error('Error creating food instance:', err);
      setError(err instanceof Error ? err.message : 'Failed to create food instance');
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

  // Calculate timeline style based on event duration
  const calculateTimelineStyle = (event: typeof selectedEvent) => {
    if (!event) return undefined;

    const SIX_HOURS = 6 * 3600;
    if (event.expected_duration <= SIX_HOURS) {
      return {
        minHeight: '100%',
        height: '100%'
      };
    }

    // For longer events, scale the height proportionally
    const additionalHours = (event.expected_duration - SIX_HOURS) / 3600;
    const minHeight = 600 + (additionalHours * 100);
    return {
      minHeight: `${minHeight}px`,
      height: 'auto'
    };
  };

  const timelineStyle = calculateTimelineStyle(selectedEvent);

  // Calculate total cost of food instances
  const calculateTotalCost = () => {
    return foodInstances.reduce((total, instance) => {
      const itemCost = instance.foodItem.cost || 0;
      return total + (itemCost * instance.servings);
    }, 0);
  };

  const totalCost = selectedEvent ? calculateTotalCost() : 0;

  return (
    <div className={`events-container ${selectedEvent ? 'split-view' : ''} ${selectedEvent && !leftPanelOpen ? 'left-panel-collapsed' : ''}`}>
      {selectedEvent && (
        <button
          className="left-panel-toggle"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          title={leftPanelOpen ? 'Collapse left panel' : 'Expand left panel'}
        >
          {leftPanelOpen ? '‹' : '›'}
        </button>
      )}

      <div className={`events-panel ${selectedEvent ? 'vertical' : ''} ${selectedEvent && !leftPanelOpen ? 'collapsed' : ''}`}>
        <Card
          title={selectedEvent ? "Food Items" : "My Events"}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f0ff' }}
          pt={{
            title: { style: { textAlign: 'left', color: '#646cff', padding: '1.25rem', margin: 0, fontSize: '1.5rem', fontWeight: 700, backgroundColor: '#f3f0ff' } },
            body: { style: { flex: 1, overflow: 'auto', padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f3f0ff' } },
            content: { style: { padding: 0 } }
          }}
        >
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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

          {!selectedEvent && (
            <EventsTable
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleSelectEvent}
            />
          )}

          {selectedEvent && (
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
        </Card>
      </div>

      {selectedEvent && (
        <div className="event-detail-panel">
          <div className="event-detail-header">
            <div className="event-title-section">
              <h3>{selectedEvent.type}</h3>
              <span className="event-total-cost">
                {loadingInstances ? '--' : `$${totalCost.toFixed(2)}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowNutrientGoalsDialog(true)}
                className="add-nutrient-btn"
              >
                Nutrient Goals
              </button>
              <button
                onClick={() => handleSelectEvent(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="event-timeline-container">
            <EventTimeline
              event={selectedEvent}
              foodInstances={foodInstances}
              loadingInstances={loadingInstances}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDeleteInstance={handleDeleteInstance}
              onUpdateInstance={handleUpdateInstance}
              onClickHoldCreate={handleClickHoldCreate}
              timelineStyle={timelineStyle}
            />

            <NutritionSummary
              event={selectedEvent}
              foodInstances={foodInstances}
              timelineStyle={timelineStyle}
              userId={user.sub}
              goalsRefreshTrigger={goalsRefreshTrigger}
            />
          </div>
        </div>
      )}

      {/* Food Item Selection Modal */}
      <FoodItemSelectionModal
        isOpen={showFoodItemModal}
        foodItems={foodItems}
        timeInSeconds={modalTimeInSeconds}
        categoryFilter={categoryFilter}
        myItemsOnly={myItemsOnly}
        onClose={() => setShowFoodItemModal(false)}
        onSelect={handleFoodItemSelect}
        onCategoryFilterChange={setCategoryFilter}
        onMyItemsOnlyChange={setMyItemsOnly}
      />

      {/* Nutrient Goals Dialog */}
      {selectedEvent && user?.sub && (
        <NutrientGoalsDialog
          visible={showNutrientGoalsDialog}
          eventId={selectedEvent.id}
          eventDuration={selectedEvent.expected_duration}
          userId={user.sub}
          onHide={() => setShowNutrientGoalsDialog(false)}
          onSave={() => {
            setSuccess('Nutrient goals saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
            setGoalsRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default Events;
