import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import {
  EventForm,
  EventsTable,
  EventTimeline,
  NutritionSummary,
  FoodItemSelectionModal,
  NutrientGoalsDialog,
  EditEventDialog,
  EventAnalyticsDialog
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
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Selected event state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [foodInstances, setFoodInstances] = useState<FoodInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Food items state (for modal)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [myItemsOnly, setMyItemsOnly] = useState<boolean>(true);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Drag and drop state
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);

  // State for food item selection modal
  const [showFoodItemModal, setShowFoodItemModal] = useState(false);
  const [modalTimeInSeconds, setModalTimeInSeconds] = useState(0);

  // State for nutrient goals dialog
  const [showNutrientGoalsDialog, setShowNutrientGoalsDialog] = useState(false);
  const [goalsRefreshTrigger, setGoalsRefreshTrigger] = useState(0);

  // State for edit event dialog
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  // State for analytics dialog
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    try {
      const response = await fetch(`${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user.sub)}&my_items_only=${myItemsOnly}`);

      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }

      const data = await response.json();
      setFoodItems(data.foodItems);
    } catch (err) {
      console.error('Error fetching food items:', err);
    }
  };

  useEffect(() => {
    if (showFoodItemModal) {
      fetchFoodItems();
    }
  }, [showFoodItemModal, myItemsOnly]);

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
      return;
    }

    // Calculate new time based on position
    const PRE_START_TIME = 0.25 * 3600; // 0.25 hours in seconds
    const POST_END_TIME = 0.25 * 3600; // 0.25 hours in seconds
    const totalTimelineDuration = selectedEvent.expected_duration + PRE_START_TIME + POST_END_TIME;
    const percentage = dropY / rect.height;
    const newTime = Math.round((percentage * totalTimelineDuration) - PRE_START_TIME);

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
  };

  const handleDragEnd = () => {
    setDraggingInstanceId(null);
    setDragOffsetY(0);
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

  // Handler for opening edit event dialog
  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setShowEditEventDialog(true);
  };

  // Handler for saving edited event
  const handleSaveEditedEvent = async () => {
    await fetchEvents();
    // If the edited event is currently selected, update it
    if (selectedEvent && eventToEdit && selectedEvent.id === eventToEdit.id) {
      const updatedEvent = events.find(e => e.id === eventToEdit.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    }
  };

  // Handler for duplicating an event
  const handleDuplicateEvent = async (event: Event) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${event.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate event');
      }

      const data = await response.json();
      console.log('Event duplicated:', data);

      // Refresh the events list
      await fetchEvents();

      // Show success message
      setSuccess(`Event duplicated successfully! ${data.foodInstancesCopied} food items copied.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate event');
      console.error('Error duplicating event:', err);
      setTimeout(() => setError(null), 3000);
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

  // Calculate total carbs per hour
  const calculateCarbsPerHour = () => {
    if (!selectedEvent) return 0;
    const totalCarbs = foodInstances.reduce((total, instance) => {
      const carbNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('carb')
      );
      if (carbNutrient) {
        return total + (carbNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);
    const durationHours = selectedEvent.expected_duration / 3600;
    return durationHours > 0 ? totalCarbs / durationHours : 0;
  };

  // Calculate total sodium per hour
  const calculateSodiumPerHour = () => {
    if (!selectedEvent) return 0;
    const totalSodium = foodInstances.reduce((total, instance) => {
      const sodiumNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('sodium')
      );
      if (sodiumNutrient) {
        // Convert to mg if needed
        let sodiumInMg = sodiumNutrient.quantity;
        if (sodiumNutrient.unit === 'g') {
          sodiumInMg = sodiumNutrient.quantity * 1000;
        }
        return total + (sodiumInMg * instance.servings);
      }
      return total;
    }, 0);
    const durationHours = selectedEvent.expected_duration / 3600;
    return durationHours > 0 ? totalSodium / durationHours : 0;
  };

  const totalCost = selectedEvent ? calculateTotalCost() : 0;
  const carbsPerHour = selectedEvent ? calculateCarbsPerHour() : 0;
  const sodiumPerHour = selectedEvent ? calculateSodiumPerHour() : 0;

  return (
    <div className={`events-container ${selectedEvent ? 'split-view' : ''}`}>
      {!selectedEvent && (
        <div className="events-panel">
          <Card
            title="My Events"
            style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db' }}
            pt={{
              title: { style: { textAlign: 'left', color: '#000000', padding: '1rem 1.5rem', margin: 0, fontSize: '1.5rem', fontWeight: 600, backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' } },
              body: { style: { flex: 1, overflow: 'auto', padding: 0, backgroundColor: 'white' } },
              content: { style: { padding: 0 } }
            }}
          >
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div style={{ padding: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="add-nutrient-btn"
              >
                {showCreateForm ? 'Cancel' : '+ Create New Event'}
              </button>
            </div>

            {showCreateForm && (
              <EventForm
                onSubmit={handleCreateEvent}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            <EventsTable
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleSelectEvent}
              onEditEvent={handleEditEvent}
              onDuplicateEvent={handleDuplicateEvent}
              isMobile={isMobile}
            />
          </Card>
        </div>
      )}

      {selectedEvent && (
        <div className="event-detail-container">
          <div className="event-detail-header">
            <div className="event-header-top-row">
              <h3>{selectedEvent.type}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="edit-event-btn"
                >
                  <span className="edit-event-text">Edit Event</span>
                  <span className="edit-event-icon">✎</span>
                </button>
                <button
                  onClick={() => handleSelectEvent(null)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="event-header-bottom-row">
              <div className="event-stats-container">
                <div className="event-stat">
                  <div className="event-stat-value">
                    {(() => {
                      const hours = Math.floor(selectedEvent.expected_duration / 3600);
                      const minutes = Math.floor((selectedEvent.expected_duration % 3600) / 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </div>
                  <div className="event-stat-label">Duration</div>
                </div>
                <div className="event-stat">
                  <div className="event-stat-value">
                    {loadingInstances ? '--' : `$${totalCost.toFixed(2)}`}
                  </div>
                  <div className="event-stat-label">Total Cost</div>
                </div>
                <div className="event-stat">
                  <div className="event-stat-value">
                    {loadingInstances ? '--' : `${carbsPerHour.toFixed(0)}g`}
                  </div>
                  <div className="event-stat-label">carbs/hr</div>
                </div>
                <div className="event-stat">
                  <div className="event-stat-value">
                    {loadingInstances ? '--' : `${sodiumPerHour.toFixed(0)}mg`}
                  </div>
                  <div className="event-stat-label">sodium/hr</div>
                </div>
              </div>
              <button
                onClick={() => setShowNutrientGoalsDialog(true)}
                className="add-nutrient-btn"
              >
                View/Add Nutrient Goals
              </button>
              <button
                onClick={() => setShowAnalyticsDialog(true)}
                className="add-nutrient-btn"
              >
                View Analytics
              </button>
            </div>
          </div>
          <div className="event-detail-content">
            <div className="event-timeline-container" ref={timelineContainerRef}>
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
                scrollContainerRef={timelineContainerRef}
              />
            </div>
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

      {/* Edit Event Dialog */}
      <EditEventDialog
        visible={showEditEventDialog}
        event={eventToEdit}
        onHide={() => {
          setShowEditEventDialog(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEditedEvent}
      />

      {/* Analytics Dialog */}
      <EventAnalyticsDialog
        visible={showAnalyticsDialog}
        onHide={() => setShowAnalyticsDialog(false)}
      />
    </div>
  );
};

export default Events;
